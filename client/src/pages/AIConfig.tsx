import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Save,
  Plus,
  X,
  Sparkles,
  MessageSquare,
  Mail,
  Eye,
  Clock,
  ShieldAlert,
  FlaskConical,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AIConfig() {
  return (
    <DashboardLayout>
      <AIConfigContent />
    </DashboardLayout>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tone = "friendly" | "professional" | "urgent";

interface TemplateLocal {
  id?: number;
  attemptNumber: number;
  name: string;
  promptInstructions: string;
  tone: Tone;
  maxChars: number;
  forbiddenPhrases: string[];
  approvalRequired: boolean;
  delayHours: number;
  isActive: boolean;
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function AIConfigContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();

  // ── AI Config state ──────────────────────────────────────────────────────
  const [aiContext, setAiContext] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiPromptInstructions, setAiPromptInstructions] = useState("");
  const [aiResponseRules, setAiResponseRules] = useState<string[]>([]);
  const [aiUnsupportedReply, setAiUnsupportedReply] = useState("");
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    if (business) {
      setAiContext(business.aiContext || "");
      setAiTone(business.aiTone || "professional");
      setAiPromptInstructions(business.aiPromptInstructions || "");
      setAiResponseRules(business.aiResponseRules || []);
      setAiUnsupportedReply(business.aiUnsupportedReply || "");
    }
  }, [business]);

  const updateMutation = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("AI configuration saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!business) return;
    updateMutation.mutate({
      id: business.id,
      aiContext,
      aiTone,
      aiPromptInstructions,
      aiResponseRules,
      aiUnsupportedReply,
    });
  };

  const addRule = () => {
    if (newRule.trim() && !aiResponseRules.includes(newRule.trim())) {
      setAiResponseRules([...aiResponseRules, newRule.trim()]);
      setNewRule("");
    }
  };

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          AI Configuration
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize how the AI responds to customers and coaches automated follow-ups.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="gap-2">
            <Bot className="h-4 w-4" /> General AI
          </TabsTrigger>
          <TabsTrigger value="followup" className="gap-2">
            <Mail className="h-4 w-4" /> Follow-Up Coaching
          </TabsTrigger>
        </TabsList>

        {/* ── General AI Tab ─────────────────────────────────────────────── */}
        <TabsContent value="general" className="space-y-6">
          {/* Context */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Context
              </CardTitle>
              <CardDescription>
                Provide background information about your business that the AI should know.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Context</Label>
                <Textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="We are a family-owned HVAC company serving the greater Phoenix area for 20 years. We specialize in AC repair, installation, and maintenance. We offer same-day emergency service and free estimates."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This context is unique to your business and helps the AI provide accurate, relevant responses.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tone & Style */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Tone & Style
              </CardTitle>
              <CardDescription>
                Control the personality and communication style of AI responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Response Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly & Casual</SelectItem>
                    <SelectItem value="empathetic">Empathetic & Caring</SelectItem>
                    <SelectItem value="concise">Concise & Direct</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Custom Instructions</Label>
                <Textarea
                  value={aiPromptInstructions}
                  onChange={(e) => setAiPromptInstructions(e.target.value)}
                  placeholder="Always mention our 24/7 emergency service. Offer a free estimate. Ask for the customer's preferred time for a visit."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Specific instructions the AI should follow when crafting responses.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Response Rules */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Response Rules
              </CardTitle>
              <CardDescription>
                Define specific rules the AI must follow in every response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {aiResponseRules.map((rule) => (
                  <Badge key={rule} variant="secondary" className="px-3 py-1.5 text-sm">
                    {rule}
                    <button
                      onClick={() => setAiResponseRules(aiResponseRules.filter((r) => r !== rule))}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="e.g., Always ask for the customer's address"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
                />
                <Button variant="outline" size="icon" onClick={addRule}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Unsupported Service Reply</Label>
                <Textarea
                  value={aiUnsupportedReply}
                  onChange={(e) => setAiUnsupportedReply(e.target.value)}
                  placeholder="I appreciate your inquiry, but unfortunately that service is outside our area of expertise."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  What the AI should say when asked about services you don't offer.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save AI Configuration"}
          </Button>
        </TabsContent>

        {/* ── Follow-Up Coaching Tab ──────────────────────────────────────── */}
        <TabsContent value="followup">
          <FollowUpCoachingTab businessName={business.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Follow-Up Coaching Tab ───────────────────────────────────────────────────

function FollowUpCoachingTab({ businessName }: { businessName: string }) {
  const utils = trpc.useUtils();
  const templatesQuery = trpc.followup.getTemplates.useQuery();
  const templates = templatesQuery.data ?? [];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editing, setEditing] = useState<TemplateLocal | null>(null);
  const [newForbidden, setNewForbidden] = useState("");
  const [previewMsg, setPreviewMsg] = useState("");
  const [previewCustomer, setPreviewCustomer] = useState("John Smith");
  const [previewService, setPreviewService] = useState("HVAC tune-up and filter replacement");
  const [previewAmount, setPreviewAmount] = useState("$285");

  // Sync editing state when templates load or selection changes
  useEffect(() => {
    if (templates.length > 0 && !editing) {
      const t = templates[selectedIdx] ?? templates[0];
      setEditing({
        id: t.id,
        attemptNumber: t.attemptNumber,
        name: t.name,
        promptInstructions: t.promptInstructions,
        tone: (t.tone ?? "friendly") as Tone,
        maxChars: t.maxChars ?? 320,
        forbiddenPhrases: (t.forbiddenPhrases as string[]) ?? [],
        approvalRequired: t.approvalRequired ?? false,
        delayHours: t.delayHours ?? 24,
        isActive: t.isActive ?? true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length, selectedIdx]);

  const saveTemplateMutation = trpc.followup.saveTemplate.useMutation({
    onSuccess: () => {
      utils.followup.getTemplates.invalidate();
      toast.success("Template saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const previewMutation = trpc.followup.previewMessage.useMutation({
    onSuccess: (data) => setPreviewMsg(data.message),
    onError: (err) => toast.error("Preview failed: " + err.message),
  });

  const handleSaveTemplate = () => {
    if (!editing) return;
    saveTemplateMutation.mutate(editing);
  };

  const handlePreview = () => {
    if (!editing) return;
    setPreviewMsg("");
    previewMutation.mutate({
      promptInstructions: editing.promptInstructions,
      tone: editing.tone,
      maxChars: editing.maxChars,
      forbiddenPhrases: editing.forbiddenPhrases,
      attemptNumber: editing.attemptNumber,
      customerName: previewCustomer,
      serviceDescription: previewService,
      estimateAmount: previewAmount,
    });
  };

  const selectTemplate = (idx: number) => {
    const t = templates[idx];
    if (!t) return;
    setSelectedIdx(idx);
    setEditing({
      id: t.id,
      attemptNumber: t.attemptNumber,
      name: t.name,
      promptInstructions: t.promptInstructions,
      tone: (t.tone ?? "friendly") as Tone,
      maxChars: t.maxChars ?? 320,
      forbiddenPhrases: (t.forbiddenPhrases as string[]) ?? [],
      approvalRequired: t.approvalRequired ?? false,
      delayHours: t.delayHours ?? 24,
      isActive: t.isActive ?? true,
    });
    setPreviewMsg("");
  };

  if (templatesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Estimate Follow-Up Templates
          </CardTitle>
          <CardDescription>
            Coach the AI on how to write each follow-up attempt. The AI uses your instructions to
            craft personalised SMS messages for unsigned estimates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Attempt selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {templates.map((t, idx) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  idx === selectedIdx
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                Attempt {t.attemptNumber}: {t.name}
              </button>
            ))}
          </div>

          {editing && (
            <div className="space-y-5">
              {/* Name & Active toggle */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <Label>Template Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. First Nudge"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    checked={editing.isActive}
                    onCheckedChange={(v) => setEditing({ ...editing, isActive: v })}
                  />
                  <Label>{editing.isActive ? "Active" : "Paused"}</Label>
                </div>
              </div>

              {/* Coaching instructions */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Coaching Instructions
                </Label>
                <Textarea
                  value={editing.promptInstructions}
                  onChange={(e) => setEditing({ ...editing, promptInstructions: e.target.value })}
                  rows={5}
                  placeholder="Write a warm, friendly SMS reminding the customer about their open estimate. Reference the service they inquired about..."
                />
                <p className="text-xs text-muted-foreground">
                  These instructions tell the AI how to write this specific follow-up. Be specific about tone, content focus, and call-to-action.
                </p>
              </div>

              {/* Tone, Max chars, Delay */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Tone
                  </Label>
                  <Select
                    value={editing.tone}
                    onValueChange={(v) => setEditing({ ...editing, tone: v as Tone })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Max Characters
                  </Label>
                  <Input
                    type="number"
                    min={50}
                    max={1600}
                    value={editing.maxChars}
                    onChange={(e) => setEditing({ ...editing, maxChars: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Send After (hours)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={editing.delayHours}
                    onChange={(e) => setEditing({ ...editing, delayHours: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Forbidden phrases */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Forbidden Phrases
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editing.forbiddenPhrases.map((p) => (
                    <Badge key={p} variant="destructive" className="px-2 py-1 text-xs">
                      {p}
                      <button
                        onClick={() =>
                          setEditing({
                            ...editing,
                            forbiddenPhrases: editing.forbiddenPhrases.filter((x) => x !== p),
                          })
                        }
                        className="ml-1.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newForbidden}
                    onChange={(e) => setNewForbidden(e.target.value)}
                    placeholder="e.g., guaranteed, cheapest"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newForbidden.trim()) {
                        e.preventDefault();
                        setEditing({
                          ...editing,
                          forbiddenPhrases: [...editing.forbiddenPhrases, newForbidden.trim()],
                        });
                        setNewForbidden("");
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (newForbidden.trim()) {
                        setEditing({
                          ...editing,
                          forbiddenPhrases: [...editing.forbiddenPhrases, newForbidden.trim()],
                        });
                        setNewForbidden("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The AI will never use these words or phrases in follow-up messages.
                </p>
              </div>

              {/* Approval required */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    Require Approval Before Sending
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI drafts the message but it waits in the queue for you to approve before sending.
                  </p>
                </div>
                <Switch
                  checked={editing.approvalRequired}
                  onCheckedChange={(v) => setEditing({ ...editing, approvalRequired: v })}
                />
              </div>

              {/* Save template */}
              <Button
                onClick={handleSaveTemplate}
                disabled={saveTemplateMutation.isPending}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Live Message Preview
          </CardTitle>
          <CardDescription>
            See exactly what the AI would send for this template. Adjust the sample data to test different scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Customer Name</Label>
              <Input
                value={previewCustomer}
                onChange={(e) => setPreviewCustomer(e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Service Description</Label>
              <Input
                value={previewService}
                onChange={(e) => setPreviewService(e.target.value)}
                placeholder="HVAC tune-up"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimate Amount</Label>
              <Input
                value={previewAmount}
                onChange={(e) => setPreviewAmount(e.target.value)}
                placeholder="$285"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={previewMutation.isPending || !editing}
            className="w-full"
          >
            {previewMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating preview...</>
            ) : (
              <><FlaskConical className="h-4 w-4 mr-2" /> Generate Preview</>
            )}
          </Button>

          {previewMsg && (
            <div className="rounded-lg bg-muted p-4 border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                AI-generated SMS ({previewMsg.length} chars):
              </p>
              <p className="text-sm leading-relaxed">{previewMsg}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* A/B Testing info card */}
      <Card className="card-premium border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-primary" />
            A/B Message Variants
          </CardTitle>
          <CardDescription>
            Write two versions of a follow-up message. LeadHammer alternates between them and tracks
            which version converts more estimates into bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A/B variant management is available in the <strong>Approval Queue</strong> page. After
            saving your templates above, head to <strong>Follow-Ups → Approval Queue</strong> to
            manage variants and view conversion analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
