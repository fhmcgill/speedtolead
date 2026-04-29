import { useState } from "react";
import { UserPlus, Phone, Mail, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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

export default function Leads() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "website" });

  const { data: leads } = trpc.leads.list.useQuery();
  const { data: team } = trpc.team.list.useQuery();
  const utils = trpc.useUtils();

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setShowCreateDialog(false);
      setNewLead({ name: "", email: "", phone: "", source: "website" });
      toast.success("Lead created");
    },
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead status updated");
    },
  });

  const assignLead = trpc.leads.assign.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success("Lead assigned");
    },
  });

  const statusColors: Record<string, string> = {
    new_lead: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    booked: "bg-purple-100 text-purple-800",
    lost: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Leads</h1>
          <p className="text-muted-foreground">
            Manage and track all your incoming leads.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Lead name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select
                  value={newLead.source}
                  onValueChange={(val) => setNewLead({ ...newLead, source: val })}
                >
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
              <Button
                className="w-full"
                onClick={() => createLead.mutate(newLead)}
                disabled={!newLead.name || createLead.isPending}
              >
                Add New Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads?.length ? (
            <div className="divide-y">
              {leads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{lead.name}</span>
                      <Badge className={statusColors[lead.status] || ""}>
                        {lead.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                      )}
                      <span>Source: {lead.source}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={lead.status}
                      onValueChange={(val) =>
                        updateStatus.mutate({ id: lead.id, status: val })
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new_lead">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No leads yet.</p>
              <p className="text-sm mt-1">
                Create your first lead or simulate an inquiry.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
