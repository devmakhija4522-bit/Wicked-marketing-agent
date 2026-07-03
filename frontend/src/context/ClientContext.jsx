import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const ClientContext = createContext();

export const useClient = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
      
      // Auto-restore active client from localStorage
      const savedClientId = localStorage.getItem('activeClientId');
      if (savedClientId) {
        const found = data.find(c => c.id === savedClientId);
        if (found) {
          setActiveClient(found);
        } else if (data.length > 0) {
          // If saved client no longer exists, fall back to first
          setActiveClient(data[0]);
          localStorage.setItem('activeClientId', data[0].id);
        }
      } else if (data.length > 0) {
        // If no saved client, default to first
        setActiveClient(data[0]);
        localStorage.setItem('activeClientId', data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
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
      fetchClients(); // background sync
    } catch (error) {
      console.error("Failed to add client:", error);
      throw error;
    }
  };

  const removeClient = async (clientId) => {
    try {
      await api.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      if (activeClient?.id === clientId) {
        setActiveClient(null);
        localStorage.removeItem('activeClientId');
      }
      fetchClients();
    } catch (error) {
      console.error("Failed to remove client:", error);
      throw error;
    }
  };

  return (
    <ClientContext.Provider value={{ clients, activeClient, switchClient, addClient, removeClient, refreshClients: fetchClients, loading }}>
      {children}
    </ClientContext.Provider>
  );
};
