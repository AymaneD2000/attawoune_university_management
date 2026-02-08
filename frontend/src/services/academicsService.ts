import api from './api';
import { Course, PaginatedResponse } from '../types';

export const academicsService = {
    getCourses: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Course>>('/academics/courses/', { params });
        return response.data;
    },

    getCourse: async (id: number) => {
        const response = await api.get<Course>(`/academics/courses/${id}/`);
        return response.data;
    },

    createCourse: async (data: Partial<Course>) => {
        const response = await api.post<Course>('/academics/courses/', data);
        return response.data;
    },

    updateCourse: async (id: number, data: Partial<Course>) => {
        const response = await api.patch<Course>(`/academics/courses/${id}/`, data);
        return response.data;
    },

    deleteCourse: async (id: number) => {
        await api.delete(`/academics/courses/${id}/`);
    },
};

export default academicsService;
