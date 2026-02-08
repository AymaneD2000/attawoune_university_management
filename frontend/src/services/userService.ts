import api from './api';
import { User, PaginatedResponse } from '../types';

export const userService = {
    getUsers: async (params?: any) => {
        const response = await api.get<PaginatedResponse<User>>('/accounts/users/', { params });
        return response.data;
    },

    getUser: async (id: number) => {
        const response = await api.get<User>(`/accounts/users/${id}/`);
        return response.data;
    },

    createUser: async (data: any) => {
        const response = await api.post<User>('/accounts/users/', data);
        return response.data;
    },

    updateUser: async (id: number, data: Partial<User>) => {
        const response = await api.patch<User>(`/accounts/users/${id}/`, data);
        return response.data;
    },

    deleteUser: async (id: number) => {
        await api.delete(`/accounts/users/${id}/`);
    },

    getUsersByRole: async (role: string) => {
        const response = await api.get<User[]>('/accounts/users/by_role/', {
            params: { role }
        });
        return response.data;
    },

    changePassword: async (id: number, data: any) => {
        const response = await api.post(`/accounts/users/${id}/change_password/`, data);
        return response.data;
    },
};

export default userService;
