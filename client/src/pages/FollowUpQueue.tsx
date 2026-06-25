import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Send,
  Plus,
  BarChart3,
  Clock,
  Loader2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FollowUpQueue() {
  return (
    <DashboardLayout>
      <FollowUpQueueContent />
    </DashboardLayout>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_approval: { label: "Pending Approval", variant: "outline" },
  approved: { label: "Approved", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABELS[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function FollowUpQueueContent() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editItem, setEditItem] = useState<{ id: number; message: string } | null>(null);
  const [showEnqueue, setShowEnqueue] = useState(false);

  const statsQuery = trpc.followup.getStats.useQuery();
  const stats = statsQuery.data;

  const queueQuery = trpc.followup.getQueue.useQuery({
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });
  const items = queueQuery.data ?? [];

  const approveMutation = trpc.followup.approveItem.useMutation({
    onSuccess: (data) => {
      utils.followup.getQueue.invalidate();
      utils.followup.getStats.invalidate();
      if (data.smsSent) toast.success("Message approved and sent via SMS");
      else toast.error("Approved but SMS failed: " + (data.error ?? "unknown error"));
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.followup.rejectItem.useMutation({
    onSuccess: () => {
      utils.followup.getQueue.invalidate();
      utils.followup.getStats.invalidate();
      toast.success("Follow-up rejected");
    },
    onError: (err) => toast.error(err.message),
  });

  const editMutation = trpc.followup.editMessage.useMutation({
    onSuccess: () => {
      utils.followup.getQueue.invalidate();
      setEditItem(null);
      toast.success("Message updated");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Follow-Up Queue
        </h1>
        <p className="text-muted-foreground mt-1">
          Review, edit, and approve AI-drafted estimate follow-up messages before they are sent.
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, icon: MessageSquare },
            { label: "Sent", value: stats.sent, icon: Send },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "Converted", value: stats.converted, icon: CheckCircle2 },
            { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="card-premium">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Queue */}
      <Card className="card-premium">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Message Queue
              </CardTitle>
              <CardDescription>
                Messages requiring approval are highlighted. Auto-approved messages are sent immediately.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setShowEnqueue(true)}>
                <Plus className="h-4 w-4 mr-1" /> Test Follow-Up
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queueQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No messages in queue</p>
              <p className="text-sm mt-1">
                Follow-ups appear here when estimates go unsigned past their threshold.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 space-y-3 ${
                    item.status === "pending_approval"
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.customerName ?? "Unknown"}</span>
                        <span className="text-muted-foreground text-xs">{item.customerPhone}</span>
                        <Badge variant="outline" className="text-xs">
                          Attempt #{item.attemptNumber}
                        </Badge>
                        <StatusBadge status={item.status} />
                        {item.resultedInBooking && (
                          <Badge className="bg-green-600 text-white text-xs">Booked!</Badge>
                        )}
                      </div>
                      {item.serviceDescription && (
                        <p className="text-xs text-muted-foreground mt-1">{item.serviceDescription}</p>
                      )}
                      {item.estimateAmount && (
                        <p className="text-xs text-muted-foreground">Estimate: {item.estimateAmount}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      <p>Scheduled: {formatDate(item.scheduledAt)}</p>
                      {item.sentAt && <p>Sent: {formatDate(item.sentAt)}</p>}
                    </div>
                  </div>

                  {item.generatedMessage && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">AI Draft ({item.generatedMessage.length} chars):</p>
                      <p className="leading-relaxed">{item.generatedMessage}</p>
                    </div>
                  )}

                  {item.status === "pending_approval" && (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate({ id: item.id })}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & Send
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditItem({ id: item.id, message: item.generatedMessage ?? "" })
                        }
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit Message
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => rejectMutation.mutate({ id: item.id })}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit message dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => { if (!o) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Follow-Up Message</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-3">
              <Textarea
                value={editItem.message}
                onChange={(e) => setEditItem({ ...editItem, message: e.target.value })}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">{editItem.message.length} characters</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editItem) editMutation.mutate({ id: editItem.id, message: editItem.message });
              }}
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual enqueue dialog */}
      {showEnqueue && <EnqueueDialog onClose={() => setShowEnqueue(false)} />}
    </div>
  );
}

// ─── Manual Enqueue Dialog ────────────────────────────────────────────────────

function EnqueueDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const templatesQuery = trpc.followup.getTemplates.useQuery();
  const templates = templatesQuery.data ?? [];

  const [templateId, setTemplateId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [estimateAmount, setEstimateAmount] = useState("");

  const enqueueMutation = trpc.followup.enqueue.useMutation({
    onSuccess: (data) => {
      utils.followup.getQueue.invalidate();
      utils.followup.getStats.invalidate();
      toast.success(
        data.item.status === "pending_approval"
          ? "Follow-up queued — awaiting your approval"
          : "Follow-up queued and will send automatically"
      );
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!templateId || !customerName || !customerPhone || !serviceDescription) {
      toast.error("Please fill in all required fields");
      return;
    }
    enqueueMutation.mutate({
      templateId,
      customerName,
      customerPhone,
      serviceDescription,
      estimateAmount: estimateAmount || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Queue a Test Follow-Up</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template *</Label>
            <Select
              value={templateId?.toString() ?? ""}
              onValueChange={(v) => setTemplateId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    Attempt {t.attemptNumber}: {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Customer Name *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="space-y-1">
              <Label>Phone Number *</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+16785551234" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Service Description *</Label>
            <Input value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} placeholder="HVAC tune-up and filter replacement" />
          </div>
          <div className="space-y-1">
            <Label>Estimate Amount</Label>
            <Input value={estimateAmount} onChange={(e) => setEstimateAmount(e.target.value)} placeholder="$285" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={enqueueMutation.isPending}>
            {enqueueMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Queue Follow-Up</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
