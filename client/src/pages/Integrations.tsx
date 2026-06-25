import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Plug,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Globe,
  MessageSquare,
  Star,
  Search,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Integrations() {
  return (
    <DashboardLayout>
      <IntegrationsContent />
    </DashboardLayout>
  );
}

function IntegrationsContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();

  const sourcesQuery = trpc.sources.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );

  const createSourceMutation = trpc.sources.create.useMutation({
    onSuccess: () => {
      utils.sources.list.invalidate();
      toast.success("Lead source added");
    },
  });

  const toggleSourceMutation = trpc.sources.update.useMutation({
    onSuccess: () => {
      utils.sources.list.invalidate();
    },
  });

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  const existingSources = sourcesQuery.data || [];
  const sourceTypes = [
    { type: "yelp", label: "Yelp", icon: Star, desc: "Capture leads from Yelp messages and requests" },
    { type: "thumbtack", label: "Thumbtack", icon: MessageSquare, desc: "Import leads from Thumbtack inquiries" },
    { type: "google_lsa", label: "Google LSA", icon: Search, desc: "Google Local Services Ads lead capture" },
    { type: "website", label: "Website Form", icon: Globe, desc: "Embed a form on your website to capture leads" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect your lead sources and scheduling tools.
        </p>
      </div>

      {/* Scheduling Integrations */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            Scheduling Integrations
          </CardTitle>
          <CardDescription>
            Connect ServiceTitan or Jobber for real-time availability sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ServiceTitanRow
            connected={business.availabilityMode === "servicetitan"}
          />
          <Separator />
          <IntegrationRow
            name="Jobber"
            description="Sync schedules, quotes, and job management"
            connected={business.availabilityMode === "jobber"}
            onConnect={() => toast.info("Configure Jobber in Availability settings")}
          />
        </CardContent>
      </Card>

      {/* Lead Sources */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Lead Sources
          </CardTitle>
          <CardDescription>
            Configure where leads come from. All sources feed into your unified inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sourceTypes.map((source) => {
            const existing = existingSources.find((s: any) => s.sourceType === source.type);
            return (
              <div key={source.type}>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <source.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{source.label}</span>
                        {existing && (
                          <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{source.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {existing ? (
                      <Switch
                        checked={existing.isConnected ?? true}
                        onCheckedChange={(checked) =>
                          toggleSourceMutation.mutate({ id: existing.id, isConnected: checked })
                        }
                      />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          createSourceMutation.mutate({
                            businessId: business.id,
                            sourceType: source.type as any,
                          })
                        }
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Webhook / API */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            API & Webhooks
          </CardTitle>
          <CardDescription>
            Use our API to send leads from any custom source.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Lead Ingestion Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/api/webhook/lead/${business.id}`}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhook/lead/${business.id}`);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              POST JSON with fields: customerName, customerPhone, customerEmail, serviceNeeded, sourceType
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Plivo Inbound SMS Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/api/webhooks/plivo/inbound`}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/plivo/inbound`);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this URL into your Plivo console under Phone Numbers → your number → Message URL (HTTP POST).
              Inbound replies from leads will appear in the Inbox automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** ServiceTitan row with live "Test Connection" capability */
function ServiceTitanRow({ connected }: { connected: boolean }) {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testMutation = trpc.servicetitan.testConnection.useMutation({
    onSuccess: (data) => {
      const normalized = {
        success: data.valid,
        message: data.valid
          ? `Connected — ${data.tenantName ?? "Tenant verified"}`
          : (data.error ?? "Unknown error"),
      };
      setTestResult(normalized);
      if (data.valid) {
        toast.success("ServiceTitan connection verified!");
      } else {
        toast.error(`Connection failed: ${data.error ?? "Unknown error"}`);
      }
    },
    onError: (err) => {
      setTestResult({ success: false, message: err.message });
      toast.error(`Connection error: ${err.message}`);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">ServiceTitan</span>
            {connected ? (
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
            {testResult && (
              <Badge
                variant="secondary"
                className={`text-xs ${testResult.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
              >
                {testResult.success ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {testResult.success ? "API Verified" : "API Error"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sync availability, dispatch, and customer data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Testing…
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Configure ServiceTitan in Availability settings")}
          >
            Configure
          </Button>
        </div>
      </div>

      {testResult && (
        <div
          className={`rounded-md px-3 py-2 text-xs font-mono ${
            testResult.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {testResult.message}
        </div>
      )}
    </div>
  );
}

function IntegrationRow({ name, description, connected, onConnect }: {
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{name}</span>
          {connected ? (
            <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onConnect}>
        {connected ? "Configure" : "Connect"}
      </Button>
    </div>
  );
}
