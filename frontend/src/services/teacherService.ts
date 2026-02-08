import api from './api';
import { Teacher, PaginatedResponse } from '../types';

export const teacherService = {
    getTeachers: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Teacher>>('/teachers/teachers/', { params });
        return response.data;
    },

    getTeacher: async (id: number) => {
        const response = await api.get<Teacher>(`/teachers/teachers/${id}/`);
        return response.data;
    },

    createTeacher: async (data: Partial<Teacher>) => {
        const response = await api.post<Teacher>('/teachers/teachers/', data);
        return response.data;
    },

    updateTeacher: async (id: number, data: Partial<Teacher>) => {
        const response = await api.patch<Teacher>(`/teachers/teachers/${id}/`, data);
        return response.data;
    },

    deleteTeacher: async (id: number) => {
        await api.delete(`/teachers/teachers/${id}/`);
    },
};

export default teacherService;
