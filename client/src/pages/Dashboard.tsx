import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Hammer,
  MessageSquare,
  Activity,
} from "lucide-react";
import { useLocation } from "wouter";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;

  const kpiQuery = trpc.kpi.stats.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );
  const stats = kpiQuery.data;

  const leadsQuery = trpc.leads.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );
  const recentLeads = useMemo(() => {
    if (!leadsQuery.data) return [];
    return [...leadsQuery.data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [leadsQuery.data]);

  if (businessQuery.isLoading) {
    return <DashboardSkeleton />;
  }

  if (!business) {
    return <OnboardingPrompt />;
  }

  // Chart data
  const pipelineData = [
    { name: "New", value: stats?.newLeads ?? 0, fill: "#3b82f6" },
    { name: "Qualified", value: stats?.qualifiedLeads ?? 0, fill: "#f59e0b" },
    { name: "Booked", value: stats?.bookedLeads ?? 0, fill: "#10b981" },
    { name: "Lost", value: stats?.lostLeads ?? 0, fill: "#ef4444" },
  ];

  const barData = [
    { name: "New", count: stats?.newLeads ?? 0 },
    { name: "Qualified", count: stats?.qualifiedLeads ?? 0 },
    { name: "Booked", count: stats?.bookedLeads ?? 0 },
    { name: "Lost", count: stats?.lostLeads ?? 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name || "there"}. Here's your lead overview.
          </p>
        </div>
        <Button onClick={() => setLocation("/inbox")} size="sm">
          <Hammer className="h-4 w-4 mr-2" />
          Open Inbox
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Lead Volume"
          value={stats?.leadVolume ?? 0}
          icon={Users}
          loading={kpiQuery.isLoading}
        />
        <KPICard
          title="Avg Response"
          value={stats?.avgResponseTimeSec ? `${stats.avgResponseTimeSec}s` : "—"}
          icon={Clock}
          loading={kpiQuery.isLoading}
        />
        <KPICard
          title="Booking Rate"
          value={stats?.bookingRate ? `${stats.bookingRate}%` : "0%"}
          icon={TrendingUp}
          loading={kpiQuery.isLoading}
        />
        <KPICard
          title="Booked Jobs"
          value={stats?.totalBookings ?? 0}
          icon={CalendarCheck}
          loading={kpiQuery.isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pipeline Bar Chart */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Pie Chart */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : stats?.leadVolume === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No leads yet. Create your first lead to see distribution.
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={pipelineData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pipelineData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pipelineData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads & Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Leads / Activity Feed */}
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Recent Leads
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/leads")}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {leadsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No leads yet. Incoming inquiries will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer"
                    onClick={() => setLocation("/leads")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{lead.customerName || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground truncate">{lead.serviceNeeded || "No description"}</p>
                      </div>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction icon={UserPlus} label="Add New Lead" onClick={() => setLocation("/leads")} />
            <QuickAction icon={Hammer} label="Configure AI" onClick={() => setLocation("/ai-config")} />
            <QuickAction icon={CalendarCheck} label="Manage Availability" onClick={() => setLocation("/availability")} />
            <QuickAction icon={Users} label="Manage Team" onClick={() => setLocation("/team")} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    qualified: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    booked: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variants[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function KPICard({ title, value, icon: Icon, loading }: {
  title: string;
  value: string | number;
  icon: any;
  loading?: boolean;
}) {
  return (
    <Card className="card-premium">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold tracking-tight">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-accent/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}

function OnboardingPrompt() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Hammer className="h-8 w-8" style={{ color: "oklch(0.68 0.19 42)" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Welcome to LeadHammer
        </h2>
        <p className="text-muted-foreground">
          Let's set up your business profile so your AI assistant can start responding to leads.
        </p>
        <Button size="lg" onClick={() => setLocation("/settings")}>
          Set Up Your Business
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="card-premium">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
