import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import MapPage from "./pages/MapPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import CitizenPanel from "./pages/CitizenPanel.tsx";
import InstitutionalPanel from "./pages/InstitutionalPanel.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";
import GestaoLogin from "./pages/GestaoLogin.tsx";
import GestaoPanel from "./pages/GestaoPanel.tsx";
import GestaoEstatisticas from "./pages/GestaoEstatisticas.tsx";
import Gestao from "./pages/Gestao.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import NotFound from "./pages/NotFound.tsx";
import Support from "./pages/Support.tsx";
import SupportFab from "./components/support/SupportFab.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary fallbackMessage="Ocorreu um erro inesperado na aplicação. Tente recarregar a página.">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mapa" element={<MapPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/minha-cidade" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/recuperar-senha" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/painel" element={<ProtectedRoute><CitizenPanel /></ProtectedRoute>} />
              <Route path="/institucional/:type" element={<ProtectedRoute requireInstitutional><InstitutionalPanel /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireInstitutional><AdminPanel /></ProtectedRoute>} />
              <Route path="/validacoes" element={<Navigate to="/painel?tab=validations" replace />} />
              <Route path="/gestao/login" element={<GestaoLogin />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/gestao/painel" element={<ProtectedRoute requireInstitutional><GestaoPanel /></ProtectedRoute>} />
              <Route path="/gestao/estatisticas" element={<ProtectedRoute requireInstitutional><GestaoEstatisticas /></ProtectedRoute>} />
              <Route path="/suporte" element={<Support />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SupportFab />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
