import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const ClientContext = createContext();

export const useClient = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      if (data && data.length > 0) {
        setClients(data);
        const savedClientId = localStorage.getItem('activeClientId');
        if (savedClientId) {
          const found = data.find(c => c.id === savedClientId);
          if (found) {
            setActiveClient(found);
            return;
          }
        }
        setActiveClient(data[0]);
      } else {
        setClients([]);
        setActiveClient(null);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]);
      setActiveClient(null);
    } finally {
      setLoading(false);
    }
  };

  const switchClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setActiveClient(client);
      localStorage.setItem('activeClientId', client.id);
    }
  };

  const addClient = async (clientData) => {
    try {
      const newClient = await api.addClient(clientData);
      setClients(prev => [...prev, newClient]);
      setActiveClient(newClient);
      localStorage.setItem('activeClientId', newClient.id);
    } catch (error) {
      console.error("Failed to add client:", error);
      throw error;
    }
  };

  const removeClient = async (clientId) => {
    try {
      await api.deleteClient(clientId);
      const remaining = clients.filter(c => c.id !== clientId);
      setClients(remaining);
      if (activeClient?.id === clientId) {
        const nextActive = remaining.length > 0 ? remaining[0] : null;
        setActiveClient(nextActive);
        if (nextActive) {
          localStorage.setItem('activeClientId', nextActive.id);
        } else {
          localStorage.removeItem('activeClientId');
        }
      }
    } catch (error) {
      console.error("Failed to remove client:", error);
      throw error;
    }
  };

  return (
    <ClientContext.Provider value={{
      clients,
      activeClient,
      currentClient: activeClient,
      switchClient,
      selectClient: switchClient,
      addClient,
      removeClient,
      refreshClients: fetchClients,
      loading
    }}>
      {children}
    </ClientContext.Provider>
  );
};
