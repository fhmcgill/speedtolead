import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Calendar,
  Zap,
  ChartColumn,
  Bot,
  Users,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Inbox", path: "/inbox" },
  { icon: UserPlus, label: "Leads", path: "/leads" },
  { icon: Calendar, label: "Availability", path: "/availability" },
  { icon: Zap, label: "Follow-Ups", path: "/follow-ups" },
  { icon: ChartColumn, label: "Analytics", path: "/analytics" },
  { icon: Bot, label: "AI Configuration", path: "/ai-config" },
  { icon: Users, label: "Team", path: "/team" },
  { icon: Plug, label: "Integrations", path: "/integrations" },
  { icon: CreditCard, label: "Billing", path: "/billing" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, isAuthenticated, signIn, signOut } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-display">SpeedLead</span>
          </div>
          <h2 className="text-xl font-semibold">Sign in to continue</h2>
          <p className="text-muted-foreground">
            Access your lead management dashboard. Sign in to get started.
          </p>
          <Button onClick={signIn} className="w-full max-w-xs" size="lg">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold font-display">SpeedLead</span>
            <button
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Separator />

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          <Separator />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background px-4 py-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold font-display">SpeedLead</span>
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse space-y-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-primary animate-bounce" />
          <span className="text-2xl font-bold font-display">SpeedLead</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
