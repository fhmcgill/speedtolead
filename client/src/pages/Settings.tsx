import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Save, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}

function SettingsContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setPhone(business.phone || "");
      setEmail(business.email || "");
      setAddress(business.address || "");
      setTimezone(business.timezone || "America/New_York");
      setCategories(business.serviceCategories || []);
    }
  }, [business]);

  const createMutation = trpc.business.create.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Business profile created!");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (business) {
      updateMutation.mutate({
        id: business.id,
        name, phone, email, address, timezone,
        serviceCategories: categories,
      });
    } else {
      createMutation.mutate({
        name, phone, email, address, timezone,
        serviceCategories: categories,
      });
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Business Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your business profile and preferences.
        </p>
      </div>

      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Business Profile
          </CardTitle>
          <CardDescription>
            This information is used by the AI to respond to customer inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ABC Plumbing & HVAC" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@abcplumbing.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Anytown, USA" rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/New_York" />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Service Categories</Label>
            <p className="text-xs text-muted-foreground">
              Add the types of services your business offers (e.g., HVAC, Plumbing, Electrical).
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="px-3 py-1 text-sm">
                  {cat}
                  <button
                    onClick={() => setCategories(categories.filter((c) => c !== cat))}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add a service category"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
              />
              <Button variant="outline" size="icon" onClick={addCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!name || createMutation.isPending || updateMutation.isPending}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : business ? "Save Changes" : "Create Business Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
