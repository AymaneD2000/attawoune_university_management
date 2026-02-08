import api from './api';
import { PaginatedResponse } from '../types';

export interface TimeSlot {
    id: number;
    day: number;
    day_display: string;
    start_time: string;
    end_time: string;
}

export interface Schedule {
    id: number;
    course: number;
    course_name: string;
    course_code: string;
    teacher: number;
    teacher_name: string;
    semester: number;
    semester_name: string;
    time_slot: TimeSlot;
    classroom: number;
    classroom_name: string;
    is_active: boolean;
}

export const schedulingService = {
    getSchedules: async (params?: any): Promise<Schedule[]> => {
        const response = await api.get<Schedule[] | PaginatedResponse<Schedule>>('/scheduling/schedules/', { params });
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },

    getSchedule: async (id: number) => {
        const response = await api.get<Schedule>(`/scheduling/schedules/${id}/`);
        return response.data;
    },

    createSchedule: async (data: any) => {
        const response = await api.post<Schedule>('/scheduling/schedules/', data);
        return response.data;
    },

    updateSchedule: async (id: number, data: Partial<Schedule>) => {
        const response = await api.patch<Schedule>(`/scheduling/schedules/${id}/`, data);
        return response.data;
    },

    deleteSchedule: async (id: number) => {
        await api.delete(`/scheduling/schedules/${id}/`);
    },

    getTimeSlots: async (): Promise<TimeSlot[]> => {
        const response = await api.get<TimeSlot[] | PaginatedResponse<TimeSlot>>('/scheduling/time-slots/');
        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.results || [];
    },
};

export default schedulingService;
