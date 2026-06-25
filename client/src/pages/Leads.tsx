import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  Filter,
  MessageSquare,
  Clock,
  Bot,
  Phone,
  Mail,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Leads() {
  return (
    <DashboardLayout>
      <LeadsContent />
    </DashboardLayout>
  );
}

function LeadsContent() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewLead, setShowNewLead] = useState(false);

  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;

  const leadsQuery = trpc.leads.list.useQuery(
    { businessId: business?.id ?? 0, status: statusFilter },
    { enabled: !!business?.id }
  );

  const teamQuery = trpc.team.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );

  const utils = trpc.useUtils();

  const statusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.kpi.stats.invalidate();
      toast.success("Lead status updated");
    },
  });

  const assignMutation = trpc.leads.assign.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead assigned");
    },
  });

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Leads
          </h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your incoming leads.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <NewLeadDialog businessId={business.id} open={showNewLead} onOpenChange={setShowNewLead} />
        </div>
      </div>

      {leadsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : leadsQuery.data?.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">No leads yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first lead or simulate an inquiry.</p>
            <Button onClick={() => setShowNewLead(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leadsQuery.data?.map((lead: any) => (
            <Card key={lead.id} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{lead.customerName || "Unknown"}</span>
                      <StatusBadge status={lead.status} />
                      {lead.aiActive && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {lead.serviceNeeded || "No description"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {lead.customerPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {lead.customerPhone}
                        </span>
                      )}
                      {lead.customerEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.customerEmail}
                        </span>
                      )}
                      {lead.responseTimeMs && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(lead.responseTimeMs / 1000)}s response
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs h-5">
                        {lead.sourceType || "manual"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={lead.status}
                      onValueChange={(val) =>
                        statusMutation.mutate({ id: lead.id, status: val as any })
                      }
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={lead.assignedToId?.toString() || "unassigned"}
                      onValueChange={(val) =>
                        assignMutation.mutate({
                          id: lead.id,
                          assignedToId: val === "unassigned" ? null : parseInt(val),
                        })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Assign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {teamQuery.data?.map((member: any) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/inbox`)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewLeadDialog({ businessId, open, onOpenChange }: { businessId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [source, setSource] = useState("website");
  const utils = trpc.useUtils();

  const simulateMutation = trpc.ai.simulateInquiry.useMutation({
    onSuccess: (data) => {
      utils.leads.list.invalidate();
      utils.conversations.list.invalidate();
      utils.kpi.stats.invalidate();
      toast.success("Lead created with AI response!");
      onOpenChange(false);
      setName(""); setPhone(""); setEmail(""); setService("");
    },
    onError: (err) => toast.error(err.message),
  });

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.conversations.list.invalidate();
      toast.success("Lead created");
      onOpenChange(false);
      setName(""); setPhone(""); setEmail(""); setService("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Customer Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Service Needed</Label>
            <Textarea
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="My AC stopped working and it's really hot. Can someone come look at it today?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="thumbtack">Thumbtack</SelectItem>
                <SelectItem value="google_lsa">Google LSA</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              onClick={() =>
                simulateMutation.mutate({
                  businessId,
                  customerName: name,
                  customerPhone: phone || undefined,
                  customerEmail: email || undefined,
                  serviceNeeded: service,
                  sourceType: source as any,
                })
              }
              disabled={!name || !service || simulateMutation.isPending}
            >
              <Bot className="h-4 w-4 mr-2" />
              {simulateMutation.isPending ? "Creating..." : "Create + AI Reply"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                createMutation.mutate({
                  businessId,
                  customerName: name,
                  customerPhone: phone || undefined,
                  customerEmail: email || undefined,
                  serviceNeeded: service,
                  sourceType: source as any,
                })
              }
              disabled={!name || createMutation.isPending}
            >
              Create Only
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    new: "badge-new",
    qualified: "badge-qualified",
    booked: "badge-booked",
    lost: "badge-lost",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles[status || "new"] || styles.new}`}>
      {status || "new"}
    </span>
  );
}
