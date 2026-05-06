import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add the access token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (data) => api.post('/auth/login/', data),
    signup: (data) => api.post('/users/signup/', data),
};

export const usersApi = {
    me: () => api.get('/users/me/'),
};

export const adminUsersApi = {
    list: () => api.get('/users/admin_users/'),
    create: (data) => api.post('/users/admin_users/', data),
    delete: (id) => api.delete(`/users/admin_users/${id}/`),
};

export const networksApi = {
    list: () => api.get('/networks/'),
    create: (data) => api.post('/networks/', data),
};

export const devicesApi = {
    list: () => api.get('/devices/'),
};

export const transfersApi = {
    list: () => api.get('/transfers/'),
    create: (data) => api.post('/transfers/', data),
};

export const firewallApi = {
    logs: () => api.get('/firewall/logs/'),
    toggle: () => api.post('/firewall/toggle/'),
};

export const vpnApi = {
    list: () => api.get('/vpn/servers/'),
    connect: (data) => api.post('/vpn/connect/', data),
    disconnect: () => api.post('/vpn/disconnect/'),
};

export default api;
