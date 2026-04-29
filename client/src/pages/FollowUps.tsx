import { useState } from "react";
import { Zap, Plus, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface FollowUpStep {
  delayMinutes: number;
  messageTemplate: string;
}

export default function FollowUps() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<FollowUpStep[]>([
    { delayMinutes: 10, messageTemplate: "" },
  ]);

  const { data: sequences } = trpc.followUps.list.useQuery();
  const utils = trpc.useUtils();

  const createSequence = trpc.followUps.create.useMutation({
    onSuccess: () => {
      utils.followUps.list.invalidate();
      setShowCreateDialog(false);
      setName("");
      setSteps([{ delayMinutes: 10, messageTemplate: "" }]);
      toast.success("Follow-up sequence created");
    },
  });

  const deleteSequence = trpc.followUps.delete.useMutation({
    onSuccess: () => {
      utils.followUps.list.invalidate();
      toast.success("Sequence deleted");
    },
  });

  const addStep = () => {
    setSteps([...steps, { delayMinutes: 30, messageTemplate: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof FollowUpStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Follow-Ups</h1>
          <p className="text-muted-foreground">
            Automated follow-up sequences that stop when a customer responds or books.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Follow-Up Sequence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Follow-Up Sequence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Sequence Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., New Lead Follow-Up"
                />
              </div>
              <div className="space-y-3">
                <Label>Steps</Label>
                {steps.map((step, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Step {i + 1}</span>
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeStep(i)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Delay (minutes)</Label>
                      <Input
                        type="number"
                        value={step.delayMinutes}
                        onChange={(e) =>
                          updateStep(i, "delayMinutes", parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Message Template</Label>
                      <Textarea
                        value={step.messageTemplate}
                        onChange={(e) =>
                          updateStep(i, "messageTemplate", e.target.value)
                        }
                        placeholder="Hi {{name}}, just following up..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStep} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Step
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => createSequence.mutate({ name, steps })}
                disabled={!name || createSequence.isPending}
              >
                Create Sequence
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Sequences</CardTitle>
          <CardDescription>
            Follow-up sequences automatically halt when a customer responds or books an
            appointment. No exceptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sequences?.length ? (
            <div className="divide-y">
              {sequences.map((seq: any) => (
                <div key={seq.id} className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium">{seq.name}</div>
                    <p className="text-sm text-muted-foreground">
                      {seq.steps?.length || 0} steps • {seq.active ? "Active" : "Paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteSequence.mutate({ id: seq.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No follow-up sequences</p>
              <p className="text-sm mt-1">
                Create your first automated follow-up sequence.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
