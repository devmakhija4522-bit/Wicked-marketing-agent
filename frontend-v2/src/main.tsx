import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ClientProvider } from "@/context/ClientContext";
import { JobsProvider } from "@/context/JobsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ClientProvider>
        <JobsProvider>
          <App />
        </JobsProvider>
      </ClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
