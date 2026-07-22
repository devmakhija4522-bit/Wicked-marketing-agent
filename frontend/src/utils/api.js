const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the WICKED backend. Make sure the server is running on localhost:8000.');
    }
    throw error;
  }
}

export const api = {
  // Clients
  getClients: () => apiRequest('/clients', { method: 'GET' }),
  addClient: (data) => apiRequest('/clients', { method: 'POST', body: data }),
  updateClient: (id, data) => apiRequest(`/clients/${id}`, { method: 'PUT', body: data }),
  deleteClient: (id) => apiRequest(`/clients/${id}`, { method: 'DELETE' }),
  getClient: (id) => apiRequest(`/clients/${id}`, { method: 'GET' }),

  // Full pipeline
  runFullPipeline: (topic, platform) =>
    apiRequest('/api/full-pipeline', {
      method: 'POST',
      body: JSON.stringify({ topic, platform }),
    }),

  analyzeTrends: (trends, clientId = 'generic') =>
    apiRequest(`/api/analyze-trends?client_id=${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ trends }),
    }),

  // Content generation
  generateConcepts: (insights, clientId = 'generic') =>
    apiRequest(`/api/generate-concepts?client_id=${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ insights }),
    }),

  writeScript: (concept, styleProfile = null, clientId = 'generic') =>
    apiRequest(`/api/write-script?client_id=${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ concept, style_profile: styleProfile }),
    }),

  reviewScript: (script, clientId = 'generic') =>
    apiRequest(`/api/review-script?client_id=${clientId}`, {
      method: 'POST',
      body: JSON.stringify({ script }),
    }),


  // Style
  analyzeStyle: (samples) =>
    apiRequest('/api/style-profile', {
      method: 'POST',
      body: JSON.stringify({ samples }),
    }),

  // Settings
  getSettings: () =>
    apiRequest('/api/settings', { method: 'GET' }),

  updateSettings: (settings) =>
    apiRequest('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  // LinkedIn Drafts
  generateLinkedInDrafts: (limit = 3) =>
    apiRequest(`/linkedin/generate?limit=${limit}`, { method: 'GET' }),

  // Jobs
  getJobStatus: (jobId) =>
    apiRequest(`/api/jobs/${jobId}`, { method: 'GET' }),

  // Instagram Scripts
  generateInstagramScript: () =>
    apiRequest('/instagram/generate-script', { method: 'GET' }),

  // Voice Sample (account-wide)
  getVoiceCategories: () =>
    apiRequest('/api/voice-categories', { method: 'GET' }),

  getVoiceSample: () =>
    apiRequest('/api/voice-sample', { method: 'GET' }),

  saveVoiceSample: (data) =>
    apiRequest('/api/voice-sample', { method: 'PUT', body: data }),

  analyzeReferenceReel: (videoUrl) =>
    apiRequest('/api/voice-sample/analyze-reference', {
      method: 'POST',
      body: { video_url: videoUrl },
    }),

  approveReferenceProfile: (data) =>
    apiRequest('/api/voice-sample/approve-reference', {
      method: 'POST',
      body: data,
    }),

  // Analytics
  getAnalyticsSummary: (platform = 'All') =>
    apiRequest(`/analytics/summary?platform=${platform}`, { method: 'GET' }),
};

export default api;
