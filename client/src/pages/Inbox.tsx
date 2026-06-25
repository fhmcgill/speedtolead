import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Bot,
  User,
  Send,
  ArrowLeft,
  Zap,
  Clock,
  Smartphone,
  PhoneOff,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Streamdown } from "streamdown";

export default function Inbox() {
  return (
    <DashboardLayout>
      <InboxContent />
    </DashboardLayout>
  );
}

function InboxContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/inbox/:id");
  const selectedId = params?.id ? parseInt(params.id) : null;

  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;

  const convsQuery = trpc.conversations.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id, refetchInterval: 5000 }
  );

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Inbox
        </h1>
        <p className="text-muted-foreground mt-1">
          All conversations across every channel.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 min-h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <Card className="card-premium overflow-hidden">
          <ScrollArea className="h-[calc(100vh-260px)]">
            {convsQuery.isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : convsQuery.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Leads will appear here when they come in.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {convsQuery.data?.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => setLocation(`/inbox/${conv.id}`)}
                    className={`w-full text-left p-4 hover:bg-accent/50 transition-colors ${
                      selectedId === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {conv.lead?.customerName || "Unknown Customer"}
                          </span>
                          {conv.aiActive && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary border-0">
                              <Bot className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                        <StatusBadge status={conv.lead?.status} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs h-5">
                        {conv.channel || "website"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.messageCount} messages
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Conversation Detail */}
        {selectedId ? (
          <ConversationDetail conversationId={selectedId} businessId={business.id} />
        ) : (
          <Card className="card-premium flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to view</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function ConversationDetail({ conversationId, businessId }: { conversationId: number; businessId: number }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const convQuery = trpc.conversations.get.useQuery(
    { id: conversationId },
    { refetchInterval: 3000 }
  );
  const conv = convQuery.data;

  const sendMutation = trpc.conversations.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.conversations.get.invalidate({ id: conversationId });
      utils.conversations.list.invalidate();
    },
  });

  const toggleAIMutation = trpc.conversations.toggleAI.useMutation({
    onSuccess: () => {
      utils.conversations.get.invalidate({ id: conversationId });
      utils.conversations.list.invalidate();
    },
  });

  const aiReplyMutation = trpc.ai.generateReply.useMutation({
    onSuccess: () => {
      utils.conversations.get.invalidate({ id: conversationId });
      utils.conversations.list.invalidate();
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conv?.messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate({
      conversationId,
      content: message.trim(),
      senderType: "team_member",
      senderId: user?.id,
    });
  };

  const handleAIReply = () => {
    aiReplyMutation.mutate({ conversationId, businessId });
  };

  if (!conv) {
    return (
      <Card className="card-premium flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </Card>
    );
  }

  return (
    <Card className="card-premium flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">
              {conv.lead?.customerName || "Unknown"}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {conv.lead?.serviceNeeded ? conv.lead.serviceNeeded.substring(0, 60) + "..." : conv.channel}
              {conv.lead?.customerPhone && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                  <Smartphone className="h-3 w-3" />
                  {conv.lead.customerPhone}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">AI Active</span>
            <Switch
              checked={conv.aiActive ?? false}
              onCheckedChange={(checked) =>
                toggleAIMutation.mutate({ conversationId, aiActive: checked })
              }
            />
          </div>
          {conv.lead?.customerPhone && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">SMS</span>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
                title={smsEnabled ? "SMS sending enabled" : "SMS sending disabled"}
              />
              {smsEnabled
                ? <Smartphone className="h-3.5 w-3.5 text-green-500" />
                : <PhoneOff className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleAIReply}
            disabled={aiReplyMutation.isPending}
          >
            <Bot className="h-4 w-4 mr-1" />
            {aiReplyMutation.isPending ? "Generating..." : "AI Reply"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {conv.messages?.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === "customer" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.senderType === "customer"
                    ? "bg-muted text-foreground"
                    : msg.senderType === "ai"
                    ? "bg-primary/10 text-foreground border border-primary/20"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.senderType === "ai" && <Bot className="h-3 w-3" />}
                  {msg.senderType === "team_member" && <User className="h-3 w-3" />}
                  <span className="text-xs opacity-70">
                    {msg.senderType === "customer" ? "Customer" : msg.senderType === "ai" ? "AI Assistant" : "You"}
                  </span>
                </div>
                <div className="text-sm leading-relaxed">
                  <Streamdown>{msg.content}</Streamdown>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-50">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {(msg.senderType === "ai" || msg.senderType === "team_member") && conv.lead?.customerPhone && msg.smsSent && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                      <Smartphone className="h-3 w-3" /> SMS sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/60">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-32"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    new: "badge-new",
    qualified: "badge-qualified",
    booked: "badge-booked",
    lost: "badge-lost",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[status || "new"] || styles.new}`}>
      {status || "new"}
    </span>
  );
}
