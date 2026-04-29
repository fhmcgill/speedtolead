import {
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = trpc.kpi.stats.useQuery();
  const { data: business } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();

  const simulateInquiry = trpc.ai.simulateInquiry.useMutation({
    onSuccess: (data) => {
      utils.leads.list.invalidate();
      utils.conversations.list.invalidate();
      utils.kpi.stats.invalidate();
    },
  });

  const kpiCards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: UserPlus,
      description: "All time leads captured",
    },
    {
      title: "Avg Response Time",
      value: stats?.avgResponseTime ?? "—",
      icon: Clock,
      description: "Average first response",
    },
    {
      title: "Booking Rate",
      value: stats?.bookingRate ? `${stats.bookingRate}%` : "—",
      icon: CheckCircle,
      description: "of leads converted to bookings",
    },
    {
      title: "Active Conversations",
      value: stats?.activeConversations ?? 0,
      icon: MessageSquare,
      description: "Currently in progress",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {business
              ? `Here's your lead overview.`
              : "Let's set up your business profile so your AI assistant can start responding to leads."}
          </p>
        </div>
        <Button
          onClick={() => simulateInquiry.mutate()}
          disabled={simulateInquiry.isPending || !business}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Simulate Inquiry
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.totalLeads ? (
            <p className="text-sm text-muted-foreground">
              You have {stats.activeConversations} active conversations and{" "}
              {stats.totalLeads} total leads. Your AI is responding in an
              average of {stats.avgResponseTime}.
            </p>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Create your first lead or simulate an inquiry.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => simulateInquiry.mutate()}
                disabled={simulateInquiry.isPending || !business}
              >
                Simulate First Lead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
