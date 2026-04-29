import { ChartColumn, TrendingUp, Clock, CheckCircle, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { trpc } from "../lib/trpc";

export default function Analytics() {
  const { data: stats } = trpc.kpi.stats.useQuery();

  const metrics = [
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: UserPlus,
      change: "+12%",
      description: "vs last month",
    },
    {
      title: "Average Response Time",
      value: stats?.avgResponseTime ?? "—",
      icon: Clock,
      change: "-23%",
      description: "vs last month",
    },
    {
      title: "Booking Rate",
      value: stats?.bookingRate ? `${stats.bookingRate}%` : "—",
      icon: CheckCircle,
      change: "+8%",
      description: "vs last month",
    },
    {
      title: "Active Conversations",
      value: stats?.activeConversations ?? 0,
      icon: TrendingUp,
      change: "+5%",
      description: "vs last week",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground">
          Track lead volume, response times, booking rates, and team performance at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600 font-medium">{metric.change}</span>{" "}
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Volume</CardTitle>
            <CardDescription>Leads captured over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ChartColumn className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chart will display with more data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>Average first response time by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chart will display with more data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chart will display with more data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source Performance</CardTitle>
            <CardDescription>Leads by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ChartColumn className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chart will display with more data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
