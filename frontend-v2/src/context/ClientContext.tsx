import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as api from "@/lib/api";
import type { ClientCreate, ClientProfile } from "@/lib/types";
import { hashToHsl } from "@/lib/brandColor";

interface ClientContextValue {
  clients: ClientProfile[];
  activeClient: ClientProfile | null;
  activeClientColor: string;
  switchClient: (id: string) => void;
  addClient: (client: ClientCreate) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ClientContext = createContext<ClientContextValue | null>(null);
const STORAGE_KEY = "wicked.activeClientId";

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchClients() {
    try {
      const data = await api.getClients();
      setClients(data);
      setError(null);
      setActiveClientId((current) => {
        if (current && data.some((c) => c.id === current)) return current;
        const saved = localStorage.getItem(STORAGE_KEY);
        return data.find((c) => c.id === saved)?.id ?? data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchClient = (id: string) => {
    setActiveClientId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  async function addClient(client: ClientCreate) {
    const created = await api.addClient(client);
    await fetchClients();
    switchClient(created.id);
  }

  async function removeClient(id: string) {
    await api.deleteClient(id);
    if (activeClientId === id) {
      localStorage.removeItem(STORAGE_KEY);
      setActiveClientId(null);
    }
    await fetchClients();
  }

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) ?? null,
    [clients, activeClientId],
  );

  const activeClientColor = useMemo(
    () => (activeClient ? hashToHsl(activeClient.id) : "#e94560"),
    [activeClient],
  );

  return (
    <ClientContext.Provider
      value={{
        clients,
        activeClient,
        activeClientColor,
        switchClient,
        addClient,
        removeClient,
        refreshClients: fetchClients,
        loading,
        error,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be used within a ClientProvider");
  return ctx;
}
