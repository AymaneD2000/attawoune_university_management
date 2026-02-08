import api from './api';
import { Student, PaginatedResponse } from '../types';

export const studentService = {
    getStudents: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Student>>('/students/', { params });
        return response.data;
    },

    getStudent: async (id: number) => {
        const response = await api.get<Student>(`/students/${id}/`);
        return response.data;
    },

    createStudent: async (data: Partial<Student> | FormData) => {
        const response = await api.post<Student>('/students/', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    updateStudent: async (id: number, data: Partial<Student> | FormData) => {
        const response = await api.patch<Student>(`/students/${id}/`, data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    deleteStudent: async (id: number) => {
        await api.delete(`/students/${id}/`);
    },

    downloadIdCard: async (id: number) => {
        const response = await api.get(`/students/${id}/generate_id_card/`, {
            responseType: 'blob'
        });
        return response.data;
    },

    downloadBulkIdCards: async (studentIds: number[]) => {
        const response = await api.post('/students/generate_bulk_id_cards/', { student_ids: studentIds }, {
            responseType: 'blob'
        });
        return response.data;
    },
};

export default studentService;
