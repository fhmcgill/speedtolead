import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Hammer, Plus, Trash2, Clock, MessageSquare, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FollowUps() {
  return (
    <DashboardLayout>
      <FollowUpsContent />
    </DashboardLayout>
  );
}

function FollowUpsContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();

  const sequencesQuery = trpc.followUps.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );

  const [showCreate, setShowCreate] = useState(false);

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Follow-Up Sequences
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated messages sent at configurable intervals.
          </p>
        </div>
        <CreateSequenceDialog businessId={business.id} open={showCreate} onOpenChange={setShowCreate} />
      </div>

      {/* Important Note */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Auto-Stop Logic</p>
            <p className="text-xs text-amber-700 mt-1">
              Follow-up sequences automatically halt when a customer responds or books an appointment. No exceptions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sequences List */}
      {sequencesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="card-premium animate-pulse h-32" />
          ))}
        </div>
      ) : sequencesQuery.data?.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Hammer className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">No follow-up sequences</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first automated follow-up sequence.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequencesQuery.data?.map((seq: any) => (
            <SequenceCard key={seq.id} sequence={seq} businessId={business.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function SequenceCard({ sequence, businessId }: { sequence: any; businessId: number }) {
  const utils = trpc.useUtils();

  const toggleMutation = trpc.followUps.update.useMutation({
    onSuccess: () => {
      utils.followUps.list.invalidate();
    },
  });

  const deleteMutation = trpc.followUps.delete.useMutation({
    onSuccess: () => {
      utils.followUps.list.invalidate();
      toast.success("Sequence deleted");
    },
  });

  const steps = sequence.steps || [];

  return (
    <Card className="card-premium">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{sequence.name}</h3>
              <Badge variant={sequence.isActive ? "default" : "secondary"} className="text-xs">
                {sequence.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {steps.length} step{steps.length !== 1 ? "s" : ""} · Trigger: {sequence.triggerEvent || "new_lead"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={sequence.isActive ?? false}
              onCheckedChange={(checked) =>
                toggleMutation.mutate({ id: sequence.id, isActive: checked })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => deleteMutation.mutate({ id: sequence.id })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-3 ml-2">
          {steps.map((step: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-px h-6 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    After {step.delayMinutes} minutes
                  </span>
                  <Badge variant="outline" className="text-xs h-5">
                    {step.channel || "sms"}
                  </Badge>
                </div>
                <p className="text-sm mt-1 text-muted-foreground line-clamp-2">
                  {step.messageTemplate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateSequenceDialog({ businessId, open, onOpenChange }: { businessId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("new_lead");
  const [steps, setSteps] = useState([
    { delayMinutes: 10, messageTemplate: "Hi {{name}}, thanks for reaching out! We received your inquiry about {{service}}. A team member will be in touch shortly.", channel: "sms" },
    { delayMinutes: 60, messageTemplate: "Hi {{name}}, just following up on your {{service}} request. Would you like to schedule an appointment?", channel: "sms" },
    { delayMinutes: 1440, messageTemplate: "Hi {{name}}, we haven't heard back yet. We'd love to help with your {{service}} needs. Reply to book a time that works for you.", channel: "sms" },
  ]);
  const utils = trpc.useUtils();

  const createMutation = trpc.followUps.create.useMutation({
    onSuccess: () => {
      utils.followUps.list.invalidate();
      toast.success("Sequence created");
      onOpenChange(false);
      setName("");
    },
    onError: (err) => toast.error(err.message),
  });

  const addStep = () => {
    setSteps([...steps, { delayMinutes: 60, messageTemplate: "", channel: "sms" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Follow-Up Sequence</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Sequence Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New Lead Follow-Up" />
          </div>
          <div className="space-y-2">
            <Label>Trigger Event</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_lead">New Lead Created</SelectItem>
                <SelectItem value="no_response">No Response</SelectItem>
                <SelectItem value="qualified">Lead Qualified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button variant="ghost" size="sm" onClick={addStep}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Step
              </Button>
            </div>
            {steps.map((step, i) => (
              <div key={i} className="p-3 rounded-lg border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Delay (minutes)</Label>
                    <Input
                      type="number"
                      value={step.delayMinutes}
                      onChange={(e) => updateStep(i, "delayMinutes", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Channel</Label>
                    <Select value={step.channel} onValueChange={(v) => updateStep(i, "channel", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Message Template</Label>
                  <Textarea
                    value={step.messageTemplate}
                    onChange={(e) => updateStep(i, "messageTemplate", e.target.value)}
                    placeholder="Use {{name}} and {{service}} as placeholders"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={() =>
              createMutation.mutate({
                businessId,
                name,
                steps,
              })
            }
            disabled={!name || steps.length === 0 || createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Sequence"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
