import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Leads from "./pages/Leads";
import Settings from "./pages/Settings";
import Availability from "./pages/Availability";
import FollowUps from "./pages/FollowUps";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import AIConfig from "./pages/AIConfig";
import Integrations from "./pages/Integrations";
import Billing from "./pages/Billing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Messages from "./pages/Messages";
import FollowUpQueue from "./pages/FollowUpQueue";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/inbox"} component={Inbox} />
      <Route path={"/inbox/:id"} component={Inbox} />
      <Route path={"/leads"} component={Leads} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/availability"} component={Availability} />
      <Route path={"/follow-ups"} component={FollowUps} />
      <Route path={"/follow-up-queue"} component={FollowUpQueue} />
      <Route path={"/team"} component={Team} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/ai-config"} component={AIConfig} />
      <Route path={"/integrations"} component={Integrations} />
      <Route path={"/messages"} component={Messages} />
      <Route path={"/billing"} component={Billing} />
      <Route path={"/about"} component={About} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
