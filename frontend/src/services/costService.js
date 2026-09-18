import api from './api';

export const costService = {
  async getAllRules() {
    const response = await api.get('/repair-costs');
    return response.data;
  },

  async createRule(data) {
    const response = await api.post('/repair-costs', data);
    return response.data;
  },

  async updateRule(id, data) {
    const response = await api.put(`/repair-costs/${id}`, data);
    return response.data;
  },

  async toggleRuleActive(id) {
    const response = await api.patch(`/repair-costs/${id}/toggle`);
    return response.data;
  }
};
