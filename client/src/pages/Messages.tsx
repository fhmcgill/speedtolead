import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  MessageSquare,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Phone,
} from "lucide-react";

function statusBadge(status: string) {
  switch (status) {
    case "sent":
    case "delivered":
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />{status}</Badge>;
    case "failed":
    case "undelivered":
      return <Badge variant="destructive" className="bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/20"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>;
    case "queued":
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />queued</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatPhone(num: string) {
  const d = num.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return num;
}

export default function Messages() {
  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fromNumberInput, setFromNumberInput] = useState("");
  const [dailyLimitInput, setDailyLimitInput] = useState("");

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [toNumber, setToNumber] = useState("");
  const [messageBody, setMessageBody] = useState("");

  // Test send state
  const [testOpen, setTestOpen] = useState(false);
  const [testNumber, setTestNumber] = useState("");

  // Data
  const { data: settings, refetch: refetchSettings } = trpc.messaging.getSettings.useQuery();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = trpc.messaging.getLogs.useQuery({ limit: 100 });

  // Mutations
  const updateSettings = trpc.messaging.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved", { description: "Messaging settings updated." });
      refetchSettings();
      setSettingsOpen(false);
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const sendSms = trpc.messaging.sendSms.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Message sent", { description: `SMS delivered to ${formatPhone(toNumber)}.` });
        setComposeOpen(false);
        setToNumber("");
        setMessageBody("");
        refetchLogs();
      } else {
        toast.error("Send failed", { description: result.error });
      }
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const testSend = trpc.messaging.testSend.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test message sent!", { description: `Check ${formatPhone(testNumber)} for the test SMS.` });
        setTestOpen(false);
        setTestNumber("");
        refetchLogs();
      } else {
        toast.error("Test failed", { description: result.error });
      }
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({
      ...(fromNumberInput && { fromNumber: fromNumberInput }),
      ...(dailyLimitInput && { dailySendLimit: parseInt(dailyLimitInput) }),
    });
  };

  const handleToggleSms = (enabled: boolean) => {
    updateSettings.mutate({ smsEnabled: enabled });
  };

  const sentCount = logs?.filter((l) => l.status === "sent" || l.status === "delivered").length ?? 0;
  const failedCount = logs?.filter((l) => l.status === "failed" || l.status === "undelivered").length ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send and track SMS messages to your leads via Plivo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Test Send */}
          <Dialog open={testOpen} onOpenChange={setTestOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Test Send
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test SMS</DialogTitle>
                <DialogDescription>
                  Send a test message to verify your Plivo integration is working correctly.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => testSend.mutate({ toNumber: testNumber })}
                  disabled={testNumber.length < 10 || testSend.isPending}
                >
                  {testSend.isPending ? "Sending…" : "Send Test"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Compose */}
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Send className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New SMS</DialogTitle>
                <DialogDescription>Send a message to a lead or contact.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={toNumber}
                    onChange={(e) => setToNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Type your message…"
                    rows={4}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    maxLength={1600}
                  />
                  <p className="text-xs text-muted-foreground text-right">{messageBody.length}/1600</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => sendSms.mutate({ toNumber, body: messageBody })}
                  disabled={toNumber.length < 10 || !messageBody.trim() || sendSms.isPending}
                >
                  {sendSms.isPending ? "Sending…" : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Sent</p>
                <p className="text-xl font-bold">{logs?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="text-xl font-bold">{sentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold">{failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">SMS Settings</CardTitle>
              <CardDescription>Plivo integration status and configuration.</CardDescription>
            </div>
            <Dialog open={settingsOpen} onOpenChange={(o) => {
              setSettingsOpen(o);
              if (o) {
                setFromNumberInput(settings?.fromNumber ?? "");
                setDailyLimitInput(settings?.dailySendLimit?.toString() ?? "200");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>SMS Configuration</DialogTitle>
                  <DialogDescription>Adjust your Plivo messaging settings.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>From Number (E.164)</Label>
                    <Input
                      placeholder="16785361017"
                      value={fromNumberInput}
                      onChange={(e) => setFromNumberInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Digits only, with country code (e.g. 16785361017).</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Daily Send Limit</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={dailyLimitInput}
                      onChange={(e) => setDailyLimitInput(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                    {updateSettings.isPending ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">SMS Enabled</p>
              <p className="text-xs text-muted-foreground">Allow LeadHammer to send SMS messages to leads.</p>
            </div>
            <Switch
              checked={settings?.smsEnabled ?? false}
              onCheckedChange={handleToggleSms}
              disabled={updateSettings.isPending}
            />
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">From Number</p>
              <p className="font-medium">{settings?.fromNumber ? formatPhone(settings.fromNumber) : "Not configured"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Daily Limit</p>
              <p className="font-medium">{settings?.dailySendLimit ?? 200} messages/day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Message Log</CardTitle>
              <CardDescription>Recent outbound SMS messages and their delivery status.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Loading messages…
            </div>
          ) : !logs?.length ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Send className="h-8 w-8 opacity-30" />
              <p className="text-sm">No messages sent yet.</p>
              <p className="text-xs">Use the Compose button or Test Send to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>To</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatPhone(log.toNumber)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm text-muted-foreground">{log.body}</p>
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
