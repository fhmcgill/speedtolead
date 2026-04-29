import { useState } from "react";
import { Users, Plus, Trash2, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Team() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");

  const { data: members } = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const createMember = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setShowInviteDialog(false);
      setEmail("");
      setRole("team_member");
      toast.success("Team member invited");
    },
  });

  const deleteMember = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Team member removed");
    },
  });

  const updateMember = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      toast.success("Role updated");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles.
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="team@company.com"
                  type="email"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner — Full access</SelectItem>
                    <SelectItem value="team_member">Team Member — Limited access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Invite team members to collaborate on leads.
              </p>
              <Button
                className="w-full"
                onClick={() => createMember.mutate({ email, role })}
                disabled={!email || createMember.isPending}
              >
                Add Team Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Owner and Team Member roles. Assign leads, manage access, and collaborate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members?.length ? (
            <div className="divide-y">
              {members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {member.role === "owner" ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {member.role === "owner" ? "Owner" : "Team Member"}
                    </Badge>
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteMember.mutate({ id: member.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No team members yet</p>
              <p className="text-sm mt-1">
                Invite team members to collaborate on leads.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
