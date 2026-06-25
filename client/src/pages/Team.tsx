import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Trash2, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Team() {
  return (
    <DashboardLayout>
      <TeamContent />
    </DashboardLayout>
  );
}

function TeamContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);

  const teamQuery = trpc.team.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );

  const removeMutation = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Team member removed");
    },
  });

  const updateRoleMutation = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Role updated");
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Team
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and their roles.
          </p>
        </div>
        <AddMemberDialog businessId={business.id} open={showAdd} onOpenChange={setShowAdd} />
      </div>

      {/* Role Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-primary" />
          <span>Owner — Full access to all features</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          <span>Team Member — Limited access</span>
        </div>
      </div>

      {/* Team Members */}
      {teamQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="card-premium animate-pulse h-20" />
          ))}
        </div>
      ) : teamQuery.data?.length === 0 ? (
        <Card className="card-premium">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-2">No team members yet</p>
            <p className="text-sm text-muted-foreground mb-4">Invite team members to collaborate on leads.</p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamQuery.data?.map((member: any) => (
            <Card key={member.id} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {member.name?.charAt(0).toUpperCase() || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        <Badge
                          variant={member.role === "owner" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {member.role === "owner" ? "Owner" : "Team Member"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) =>
                            updateRoleMutation.mutate({ id: member.id, role: val as any })
                          }
                        >
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="team_member">Team Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMutation.mutate({ id: member.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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

function AddMemberDialog({ businessId, open, onOpenChange }: { businessId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");
  const utils = trpc.useUtils();

  const addMutation = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Team member added");
      onOpenChange(false);
      setName(""); setEmail("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="team_member">Team Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => addMutation.mutate({ businessId, name, email, role: role as any })}
            disabled={!name || addMutation.isPending}
          >
            {addMutation.isPending ? "Adding..." : "Add Team Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
