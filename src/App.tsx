import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Proximos from "./pages/Proximos";
import Leads from "./pages/Leads";
import LeadProfile from "./pages/LeadProfile";
import Assets from "./pages/Assets";
import Trilhas from "./pages/Trilhas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/proximos" element={<Proximos />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadProfile />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/trilhas" element={<Trilhas />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
