import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Leads from "./pages/Leads";
import Availability from "./pages/Availability";
import FollowUps from "./pages/FollowUps";
import Analytics from "./pages/Analytics";
import AIConfig from "./pages/AIConfig";
import Team from "./pages/Team";
import Integrations from "./pages/Integrations";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<Inbox />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-config" element={<AIConfig />} />
          <Route path="/team" element={<Team />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
