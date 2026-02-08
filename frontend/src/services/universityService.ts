import api from './api';
import {
    Faculty,
    Department,
    Program,
    AcademicYear,
    Semester,
    Level,
    Classroom,
    PaginatedResponse,
    Teacher
} from '../types';

export const universityService = {
    // Faculties
    getFaculties: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Faculty>>('/university/faculties/', { params });
        return response.data;
    },

    getFaculty: async (id: number) => {
        const response = await api.get<Faculty>(`/university/faculties/${id}/`);
        return response.data;
    },

    createFaculty: async (data: Partial<Faculty>) => {
        const response = await api.post<Faculty>('/university/faculties/', data);
        return response.data;
    },

    updateFaculty: async (id: number, data: Partial<Faculty>) => {
        const response = await api.patch<Faculty>(`/university/faculties/${id}/`, data);
        return response.data;
    },

    deleteFaculty: async (id: number) => {
        await api.delete(`/university/faculties/${id}/`);
    },

    // Departments
    getDepartments: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Department>>('/university/departments/', { params });
        return response.data;
    },

    getDepartment: async (id: number) => {
        const response = await api.get<Department>(`/university/departments/${id}/`);
        return response.data;
    },

    createDepartment: async (data: Partial<Department>) => {
        const response = await api.post<Department>('/university/departments/', data);
        return response.data;
    },

    updateDepartment: async (id: number, data: Partial<Department>) => {
        const response = await api.patch<Department>(`/university/departments/${id}/`, data);
        return response.data;
    },

    deleteDepartment: async (id: number) => {
        await api.delete(`/university/departments/${id}/`);
    },

    // Programs
    getPrograms: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Program>>('/university/programs/', { params });
        return response.data;
    },

    getProgram: async (id: number) => {
        const response = await api.get<Program>(`/university/programs/${id}/`);
        return response.data;
    },

    createProgram: async (data: Partial<Program>) => {
        const response = await api.post<Program>('/university/programs/', data);
        return response.data;
    },

    updateProgram: async (id: number, data: Partial<Program>) => {
        const response = await api.patch<Program>(`/university/programs/${id}/`, data);
        return response.data;
    },

    deleteProgram: async (id: number) => {
        await api.delete(`/university/programs/${id}/`);
    },

    // Academic Years
    getAcademicYears: async (params?: any) => {
        const response = await api.get<PaginatedResponse<AcademicYear>>('/university/academic-years/', { params });
        return response.data;
    },

    getAcademicYear: async (id: number) => {
        const response = await api.get<AcademicYear>(`/university/academic-years/${id}/`);
        return response.data;
    },

    createAcademicYear: async (data: Partial<AcademicYear>) => {
        const response = await api.post<AcademicYear>('/university/academic-years/', data);
        return response.data;
    },

    updateAcademicYear: async (id: number, data: Partial<AcademicYear>) => {
        const response = await api.patch<AcademicYear>(`/university/academic-years/${id}/`, data);
        return response.data;
    },

    deleteAcademicYear: async (id: number) => {
        await api.delete(`/university/academic-years/${id}/`);
    },

    setCurrentAcademicYear: async (id: number) => {
        const response = await api.post(`/university/academic-years/${id}/set_current/`);
        return response.data;
    },

    // Semesters
    getSemesters: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Semester>>('/university/semesters/', { params });
        return response.data;
    },

    getSemester: async (id: number) => {
        const response = await api.get<Semester>(`/university/semesters/${id}/`);
        return response.data;
    },

    createSemester: async (data: Partial<Semester>) => {
        const response = await api.post<Semester>('/university/semesters/', data);
        return response.data;
    },

    updateSemester: async (id: number, data: Partial<Semester>) => {
        const response = await api.patch<Semester>(`/university/semesters/${id}/`, data);
        return response.data;
    },

    deleteSemester: async (id: number) => {
        await api.delete(`/university/semesters/${id}/`);
    },

    setCurrentSemester: async (id: number) => {
        const response = await api.post(`/university/semesters/${id}/set_current/`);
        return response.data;
    },

    // Levels
    getLevels: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Level>>('/university/levels/', { params });
        return response.data;
    },

    getLevel: async (id: number) => {
        const response = await api.get<Level>(`/university/levels/${id}/`);
        return response.data;
    },

    createLevel: async (data: Partial<Level>) => {
        const response = await api.post<Level>('/university/levels/', data);
        return response.data;
    },

    updateLevel: async (id: number, data: Partial<Level>) => {
        const response = await api.patch<Level>(`/university/levels/${id}/`, data);
        return response.data;
    },

    deleteLevel: async (id: number) => {
        await api.delete(`/university/levels/${id}/`);
    },

    // Classrooms
    getClassrooms: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Classroom>>('/university/classrooms/', { params });
        return response.data;
    },

    getClassroom: async (id: number) => {
        const response = await api.get<Classroom>(`/university/classrooms/${id}/`);
        return response.data;
    },

    createClassroom: async (data: Partial<Classroom>) => {
        const response = await api.post<Classroom>('/university/classrooms/', data);
        return response.data;
    },

    updateClassroom: async (id: number, data: Partial<Classroom>) => {
        const response = await api.patch<Classroom>(`/university/classrooms/${id}/`, data);
        return response.data;
    },

    deleteClassroom: async (id: number) => {
        await api.delete(`/university/classrooms/${id}/`);
    },

    checkClassroomAvailability: async (id: number, datetime: string) => {
        const response = await api.get(`/university/classrooms/${id}/check_availability/`, {
            params: { datetime }
        });
        return response.data;
    },
    // Teachers
    getTeachers: async (params?: any) => {
        const response = await api.get<PaginatedResponse<Teacher>>('/teachers/teachers/', { params });
        return response.data;
    },

    getTeacher: async (id: number) => {
        const response = await api.get<Teacher>(`/teachers/teachers/${id}/`);
        return response.data;
    },
};

export default universityService;
