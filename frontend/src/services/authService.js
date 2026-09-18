import api from './api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('trueinspect_token', response.data.token);
      localStorage.setItem('trueinspect_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(fullName, email, password, confirmPassword, role) {
    const response = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
      confirmPassword,
      role
    });
    return response.data;
  },

  getCurrentUser() {
    const userJson = localStorage.getItem('trueinspect_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  getToken() {
    return localStorage.getItem('trueinspect_token');
  },

  logout() {
    localStorage.removeItem('trueinspect_token');
    localStorage.removeItem('trueinspect_user');
  }
};
