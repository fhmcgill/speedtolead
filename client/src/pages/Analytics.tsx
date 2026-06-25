import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Clock,
  CalendarCheck,
  TrendingUp,
  Zap,
  CheckCircle2,
  XCircle,
  Target,
} from "lucide-react";
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
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

export default function Analytics() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}

function AnalyticsContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;

  const kpiQuery = trpc.kpi.stats.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );
  const stats = kpiQuery.data;

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  const pipelineData = [
    { name: "New", count: stats?.newLeads ?? 0, fill: "#3b82f6" },
    { name: "Qualified", count: stats?.qualifiedLeads ?? 0, fill: "#f59e0b" },
    { name: "Booked", count: stats?.bookedLeads ?? 0, fill: "#10b981" },
    { name: "Lost", count: stats?.lostLeads ?? 0, fill: "#ef4444" },
  ];

  const pieData = pipelineData.filter(d => d.count > 0);

  const bookingData = [
    { name: "Confirmed", value: stats?.confirmedBookings ?? 0, fill: "#10b981" },
    { name: "Completed", value: stats?.completedBookings ?? 0, fill: "#3b82f6" },
    { name: "Total", value: stats?.totalBookings ?? 0, fill: "#8b5cf6" },
  ];

  const bookingRate = stats?.bookingRate ?? 0;
  const radialData = [
    { name: "Booking Rate", value: bookingRate, fill: "#3b82f6" },
  ];

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Key performance indicators for your lead pipeline.
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Leads"
          value={stats?.leadVolume ?? 0}
          icon={Users}
          loading={kpiQuery.isLoading}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Avg Response Time"
          value={stats?.avgResponseTimeSec ? `${stats.avgResponseTimeSec}s` : "—"}
          icon={Clock}
          loading={kpiQuery.isLoading}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <MetricCard
          title="Booking Rate"
          value={stats?.bookingRate ? `${stats.bookingRate}%` : "0%"}
          icon={TrendingUp}
          loading={kpiQuery.isLoading}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <MetricCard
          title="Booked Jobs"
          value={stats?.totalBookings ?? 0}
          icon={CalendarCheck}
          loading={kpiQuery.isLoading}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Charts Row 1: Pipeline Bar Chart + Status Pie Chart */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pipelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : pieData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                No leads yet. Data will appear once leads are created.
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="55%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 pl-2">
                  {pipelineData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2.5 text-sm">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Booking Rate Gauge + Booking Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Booking Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    barSize={20}
                    data={radialData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={10}
                      fill="#3b82f6"
                      background={{ fill: "hsl(var(--muted))" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-20">
                  <div className="text-4xl font-bold text-primary">{bookingRate}%</div>
                  <div className="text-sm text-muted-foreground mt-1">of leads converted to bookings</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <SummaryRow label="Total Bookings" value={stats?.totalBookings ?? 0} icon={CalendarCheck} color="text-purple-600" />
                <SummaryRow label="Confirmed" value={stats?.confirmedBookings ?? 0} icon={CheckCircle2} color="text-emerald-600" />
                <SummaryRow label="Completed" value={stats?.completedBookings ?? 0} icon={CheckCircle2} color="text-blue-600" />
                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Response Time</span>
                    <span className="text-lg font-bold text-primary">
                      {stats?.avgResponseTimeSec ? `${stats.avgResponseTimeSec}s` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 py-6">
            {[
              { label: "Leads", value: stats?.leadVolume ?? 0, color: "bg-blue-500" },
              { label: "Qualified", value: stats?.qualifiedLeads ?? 0, color: "bg-amber-500" },
              { label: "Booked", value: stats?.bookedLeads ?? 0, color: "bg-emerald-500" },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="text-center">
                  <div className={`${stage.color} text-white rounded-2xl px-8 py-5 min-w-[120px] shadow-sm`}>
                    <div className="text-3xl font-bold">{stage.value}</div>
                    <div className="text-xs opacity-80 mt-1.5 font-medium">{stage.label}</div>
                  </div>
                </div>
                {i < 2 && (
                  <div className="text-muted-foreground text-2xl px-1">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, loading, color, bgColor }: {
  title: string;
  value: string | number;
  icon: any;
  loading?: boolean;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="card-premium">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          <div className={`h-9 w-9 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}
