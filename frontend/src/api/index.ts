import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include token in requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const networksApi = {
  list: () => api.get('/networks/'),
  getStats: () => api.get('/networks/global_stats/'),
  toggleFirewall: (enabled: boolean) => api.post('/networks/toggle_firewall/', { enabled }),
};

export const devicesApi = {
  list: () => api.get('/devices/'),
  block: (id: number) => api.post(`/devices/${id}/block/`),
  unblock: (id: number) => api.post(`/devices/${id}/unblock/`),
};

export const transfersApi = {
  list: () => api.get('/transfers/'),
  create: (data: any) => api.post('/transfers/', data),
};

export const vpnApi = {
  list: () => api.get('/vpn-servers/'),
};

export const vpnStatusApi = {
  getStatus: () => api.get('/vpn-status/status/'),
  connect: (country: string) => api.post('/vpn-status/connect/', { country }),
  disconnect: () => api.post('/vpn-status/disconnect/'),
  selectCountry: (country: string) => api.post('/vpn-status/select_country/', { country }),
};

export const attackApi = {
  trigger: (data: { type: string, network_id: number }) => api.post('/attack-simulations/trigger/', data),
  logs: () => api.get('/firewall-logs/'),
};

export default api;
