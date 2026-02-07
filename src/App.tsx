import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import HealthMetrics from "./pages/HealthMetrics";
import SplitView from "./pages/SplitView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <div className="app-shell">
    <div className="small-screen-warning">
      <p>Screen too small, expand to see content</p>
    </div>
    <QueryClientProvider client={queryClient}>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/health-metrics" element={<HealthMetrics />} />
          <Route path="/kalkulator-bmi" element={<SplitView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </div>
);

export default App;
