import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { QueuePage } from "./pages/QueuePage";
import { PatientsPage } from "./pages/PatientsPage";
import { BedsPage } from "./pages/BedsPage";
import { AdmittedPage } from "./pages/AdmittedPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EmergencyPage } from "./pages/EmergencyPage";
import { PatientPortalPage } from "./pages/PatientPortalPage";
import { ConsentFormsPage } from "./pages/ConsentFormsPage";
import { SupportPage } from "./pages/SupportPage";
import { ChatPage } from "./pages/ChatPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/queue" replace />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="beds" element={<BedsPage />} />
              <Route path="admitted" element={<AdmittedPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="emergency" element={<EmergencyPage />} />
              <Route path="portal" element={<PatientPortalPage />} />
              <Route path="consent" element={<ConsentFormsPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="chat" element={<ChatPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
