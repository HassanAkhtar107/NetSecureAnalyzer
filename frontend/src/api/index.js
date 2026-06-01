import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the access token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Token ${token}`; // Changed from Bearer to Token for DRF
    }
    return config;
});

export const authApi = {
    login: (data) => api.post('/login/', data),
    signup: (data) => api.post('/signup/', data),
};

export const usersApi = {
    me: () => api.get('/users/me/'),
    listAll: () => api.get('/admin_users/'), // Using admin_users to get a list for dropdown
};

export const adminUsersApi = {
    list: () => api.get('/admin_users/'),
    create: (data) => api.post('/admin_users/', data),
    delete: (id) => api.delete(`/admin_users/${id}/`),
};

export const networksApi = {
    list: () => api.get('/networks/'),
    create: (data) => api.post('/networks/'),
    globalStats: () => api.get('/networks/global_stats/'),
    myStats: () => api.get('/networks/my_network_stats/'),
    tcpConnections: () => api.get('/networks/tcp_connections/'),
};



export const userDevicesApi = {
    list: () => api.get('/user-devices/'),
    register: (data) => api.post('/user-devices/register/', data),
    block: (id) => api.post(`/user-devices/${id}/block/`),
    unblock: (id) => api.post(`/user-devices/${id}/unblock/`),
    delete: (id) => api.delete(`/user-devices/${id}/`),
};



export const firewallApi = {
    logs: () => api.get('/firewall-logs/'),
    rules: () => api.get('/firewall-rules/'),
    createRule: (data) => api.post('/firewall-rules/', data),
    deleteRule: (id) => api.delete(`/firewall-rules/${id}/`),
    toggleRule: (id) => api.post(`/firewall-rules/${id}/toggle/`),
    toggle: (data) => api.post('/networks/toggle_firewall/', data),
};

export const vpnApi = {
    status: () => api.get('/vpn-status/status/'),
    connect: (data) => api.post('/vpn-status/connect/', data),
    disconnect: () => api.post('/vpn-status/disconnect/'),
};

export const imageTransfersApi = {
    list: () => api.get('/image-transfers/'),
    send: (formData) => api.post('/image-transfers/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
};

export const attacksApi = {
    list: () => api.get('/attack-simulations/'),
    trigger: (data) => api.post('/attack-simulations/trigger/', data),
};

export default api;
