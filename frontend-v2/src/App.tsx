import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/shell/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { VoiceSample } from "@/pages/VoiceSample";
import { InstagramScriptStudio } from "@/pages/InstagramScriptStudio";
import { Analytics } from "@/pages/Analytics";
import { BrandSettings } from "@/pages/BrandSettings";
import { Clients } from "@/pages/Clients";
import { ComingSoon } from "@/pages/ComingSoon";
import { Welcome } from "@/pages/Welcome";

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/voice" element={<VoiceSample />} />
        <Route path="/instagram-script" element={<InstagramScriptStudio />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<BrandSettings />} />
        <Route path="/clients" element={<Clients />} />
        <Route
          path="*"
          element={
            <ComingSoon title="Page not found" description="That screen doesn't exist yet." icon="grid" />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
