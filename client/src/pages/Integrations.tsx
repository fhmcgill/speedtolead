import { Plug, ExternalLink, CheckCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const leadSources = [
  {
    id: "yelp",
    name: "Yelp",
    description: "Capture leads from Yelp messages and requests",
    icon: "🟡",
  },
  {
    id: "thumbtack",
    name: "Thumbtack",
    description: "Thumbtack lead capture and response",
    icon: "🔵",
  },
  {
    id: "google_lsa",
    name: "Google LSA",
    description: "Google Local Services Ads lead capture",
    icon: "🟢",
  },
  {
    id: "website",
    name: "Website Form",
    description: "Embed a form on your website to capture leads",
    icon: "🌐",
  },
];

const schedulingIntegrations = [
  {
    id: "servicetitan",
    name: "ServiceTitan",
    description: "Connect ServiceTitan for real-time availability and job scheduling",
    status: "available",
  },
  {
    id: "jobber",
    name: "Jobber",
    description: "Connect Jobber for scheduling and dispatch",
    status: "available",
  },
];

export default function Integrations() {
  const { data: sources } = trpc.sources.list.useQuery();
  const utils = trpc.useUtils();

  const createSource = trpc.sources.create.useMutation({
    onSuccess: () => {
      utils.sources.list.invalidate();
      toast.success("Lead source added");
    },
  });

  const updateSource = trpc.sources.update.useMutation({
    onSuccess: () => {
      utils.sources.list.invalidate();
      toast.success("Source updated");
    },
  });

  const isSourceEnabled = (sourceId: string) => {
    return sources?.some((s: any) => s.type === sourceId && s.enabled);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your lead sources and scheduling tools.
        </p>
      </div>

      {/* Lead Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Sources</CardTitle>
          <CardDescription>
            Configure where leads come from. All sources feed into your unified inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {leadSources.map((source) => {
              const enabled = isSourceEnabled(source.id);
              return (
                <div
                  key={source.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    enabled ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{source.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{source.name}</div>
                      <p className="text-xs text-muted-foreground">
                        {source.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        createSource.mutate({ type: source.id, enabled: true });
                      } else {
                        const existing = sources?.find((s: any) => s.type === source.id);
                        if (existing) {
                          updateSource.mutate({ id: existing.id, enabled: false });
                        }
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduling Integrations</CardTitle>
          <CardDescription>
            Connect ServiceTitan or Jobber for real-time availability sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {schedulingIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <div className="font-medium text-sm">{integration.name}</div>
                  <p className="text-xs text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            API integration coming soon for additional scheduling platforms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
