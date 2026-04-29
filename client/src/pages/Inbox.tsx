import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Bot, User, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

export default function Inbox() {
  const { id } = useParams();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(id || null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = trpc.conversations.list.useQuery();
  const { data: activeConversation } = trpc.conversations.get.useQuery(
    { id: selectedConversation! },
    { enabled: !!selectedConversation, refetchInterval: 3000 }
  );

  const utils = trpc.useUtils();
  const sendMessage = trpc.conversations.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.conversations.get.invalidate();
    },
  });

  const toggleAI = trpc.conversations.toggleAI.useMutation({
    onSuccess: () => {
      utils.conversations.get.invalidate();
      utils.conversations.list.invalidate();
      toast.success("AI status updated");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedConversation) return;
    sendMessage.mutate({ conversationId: selectedConversation, content: message });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Inbox</h1>
        <p className="text-muted-foreground">
          All conversations from every channel in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              {conversations?.length ? (
                <div className="divide-y">
                  {conversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedConversation === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {conv.leadName}
                        </span>
                        <Badge variant={conv.aiEnabled ? "default" : "secondary"} className="text-xs">
                          {conv.aiEnabled ? "AI" : "Manual"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conv.source} • {conv.timeAgo}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No conversations yet. Simulate an inquiry from the Dashboard.
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Conversation */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation && activeConversation ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {activeConversation.leadName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {activeConversation.source} • {activeConversation.status}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleAI.mutate({
                        conversationId: selectedConversation,
                        enabled: !activeConversation.aiEnabled,
                      })
                    }
                    className="gap-2"
                  >
                    {activeConversation.aiEnabled ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    AI {activeConversation.aiEnabled ? "On" : "Off"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {activeConversation.messages?.map((msg: any, i: number) => (
                      <div
                        key={i}
                        className={`flex gap-3 ${
                          msg.role === "assistant" ? "" : "justify-end"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                            msg.role === "assistant"
                              ? "bg-muted"
                              : msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-blue-100 text-blue-900"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role !== "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessage.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
