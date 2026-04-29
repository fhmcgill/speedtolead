import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Settings() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const { data: business } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();

  const updateBusiness = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Settings saved");
    },
  });

  const createBusiness = trpc.business.create.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Business profile created");
    },
  });

  useEffect(() => {
    if (business) {
      setCompanyName(business.companyName || "");
      setEmail(business.email || "");
      setPhone(business.phone || "");
      setTimezone(business.timezone || "America/New_York");
      setServiceCategories(business.serviceCategories || []);
    }
  }, [business]);

  const handleSave = () => {
    const data = {
      companyName,
      email,
      phone,
      timezone,
      serviceCategories,
    };

    if (business) {
      updateBusiness.mutate(data);
    } else {
      createBusiness.mutate(data);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !serviceCategories.includes(newCategory.trim())) {
      setServiceCategories([...serviceCategories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (cat: string) => {
    setServiceCategories(serviceCategories.filter((c) => c !== cat));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Settings</h1>
          <p className="text-muted-foreground">
            Configure your business profile and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateBusiness.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Profile
          </CardTitle>
          <CardDescription>
            {business
              ? "Update your business information."
              : "Let's set up your business profile so your AI assistant can start responding to leads."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ABC Plumbing & HVAC"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@abcplumbing.com"
                type="email"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="America/Phoenix">Arizona Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Service Categories</CardTitle>
          <CardDescription>
            Add the types of services your business offers (e.g., HVAC, Plumbing, Electrical).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 px-3 py-1">
                  {cat}
                  <button
                    onClick={() => removeCategory(cat)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add a service category..."
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
            />
            <Button variant="outline" onClick={addCategory}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {business
              ? "Your business profile is configured. Update settings above as needed."
              : "Set up your business profile first."}
          </p>
          {!business && (
            <Button className="mt-4" onClick={handleSave}>
              Create Business Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
