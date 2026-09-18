import api from './api';

export const inspectionService = {
  async getDashboard() {
    const response = await api.get('/dashboard');
    return response.data;
  },

  async getInspections() {
    const response = await api.get('/inspections');
    return response.data;
  },

  async getInspectionById(id) {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  async createInspection(data) {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  async updateInspectionStatus(id, status) {
    const response = await api.patch(`/inspections/${id}/status`, { status });
    return response.data;
  },

  async uploadImages(inspectionId, formData) {
    const response = await api.post(`/inspections/${inspectionId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  async deleteImage(inspectionId, imageId) {
    const response = await api.delete(`/inspections/${inspectionId}/images/${imageId}`);
    return response.data;
  },

  async runAIDetection(inspectionId, imageId) {
    const response = await api.post(`/inspections/${inspectionId}/defects/ai-detect`, {
      image_id: imageId
    });
    return response.data;
  },

  async addManualDefect(inspectionId, defectData) {
    const response = await api.post(`/inspections/${inspectionId}/defects`, defectData);
    return response.data;
  },

  async deleteDefect(inspectionId, defectId) {
    const response = await api.delete(`/inspections/${inspectionId}/defects/${defectId}`);
    return response.data;
  },

  async generateEstimate(inspectionId) {
    const response = await api.post(`/inspections/${inspectionId}/estimate`);
    return response.data;
  },

  async getEstimate(inspectionId) {
    const response = await api.get(`/inspections/${inspectionId}/estimate`);
    return response.data;
  },

  async getReportData(inspectionId) {
    const response = await api.get(`/reports/${inspectionId}`);
    return response.data;
  },

  async downloadReportPDF(inspectionId, registrationNumber) {
    const response = await api.get(`/reports/${inspectionId}/pdf`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanReg = (registrationNumber || 'VEHICLE').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `TRUEINSPECT_Report_${cleanReg}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
