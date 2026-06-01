import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { QueuePage } from "./pages/QueuePage";
import { PatientsPage } from "./pages/PatientsPage";
import { BedsPage } from "./pages/BedsPage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/queue" replace />} />
          <Route path="queue" element={<QueuePage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="beds" element={<BedsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
