import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AOIThemeProvider } from "./theme/ThemeProvider";
import Navigation from "./components/Navigation";
import UploadPage from "./pages/UploadPage";
import InspectionPage from "./pages/InspectionPage";
import SafetyMonitor from "./pages/SafetyMonitor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AOIThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Navigation />
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/inspection" element={<InspectionPage />} />
              <Route path="/safety" element={<SafetyMonitor />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AOIThemeProvider>
  </QueryClientProvider>
);

export default App;
