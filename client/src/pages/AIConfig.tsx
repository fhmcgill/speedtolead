import { useState, useEffect } from "react";
import { Bot, Save } from "lucide-react";
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
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function AIConfig() {
  const [tone, setTone] = useState("professional");
  const [context, setContext] = useState("");
  const [promptInstructions, setPromptInstructions] = useState("");
  const [responseRules, setResponseRules] = useState<string[]>([]);
  const [unsupportedReply, setUnsupportedReply] = useState("");
  const [newRule, setNewRule] = useState("");

  const { data: business } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();

  const updateBusiness = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("AI configuration saved");
    },
  });

  useEffect(() => {
    if (business) {
      setTone(business.aiTone || "professional");
      setContext(business.aiContext || "");
      setPromptInstructions(business.aiPromptInstructions || "");
      setResponseRules(business.aiResponseRules || []);
      setUnsupportedReply(business.aiUnsupportedReply || "");
    }
  }, [business]);

  const handleSave = () => {
    updateBusiness.mutate({
      aiTone: tone,
      aiContext: context,
      aiPromptInstructions: promptInstructions,
      aiResponseRules: responseRules,
      aiUnsupportedReply: unsupportedReply,
    });
  };

  const addRule = () => {
    if (newRule.trim()) {
      setResponseRules([...responseRules, newRule.trim()]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setResponseRules(responseRules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">AI Configuration</h1>
          <p className="text-muted-foreground">
            Control the personality and communication style of AI responses.
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateBusiness.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Tone */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Tone</CardTitle>
          <CardDescription>
            Set custom instructions, tone, response rules, and context per business profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business Context */}
      <Card>
        <CardHeader>
          <CardTitle>Business Context</CardTitle>
          <CardDescription>
            Provide background information about your business so the AI can respond accurately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="We are a family-owned HVAC company serving the greater Phoenix area for 20 years. We specialize in AC repair, installation, and maintenance. We offer same-day emergency service and free estimates."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Instructions</CardTitle>
          <CardDescription>
            Define specific rules the AI must follow in every response.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={promptInstructions}
            onChange={(e) => setPromptInstructions(e.target.value)}
            placeholder="Always mention our 24/7 emergency service. Offer a free estimate. Ask for the customer's preferred time for a visit."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Response Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Response Rules</CardTitle>
          <CardDescription>
            Add rules that the AI must always follow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {responseRules.length > 0 && (
            <div className="space-y-2">
              {responseRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <span className="flex-1 text-sm">{rule}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeRule(i)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Add a new rule..."
              onKeyDown={(e) => e.key === "Enter" && addRule()}
            />
            <Button variant="outline" onClick={addRule}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unsupported Reply */}
      <Card>
        <CardHeader>
          <CardTitle>Unsupported Service Reply</CardTitle>
          <CardDescription>
            What should the AI say when asked about services you don't offer?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={unsupportedReply}
            onChange={(e) => setUnsupportedReply(e.target.value)}
            placeholder="I appreciate your interest, but we don't currently offer that service. However, I'd be happy to help you with..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}
