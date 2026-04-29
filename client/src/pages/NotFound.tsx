import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Button onClick={() => navigate("/")} className="gap-2">
          <Home className="h-4 w-4" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
