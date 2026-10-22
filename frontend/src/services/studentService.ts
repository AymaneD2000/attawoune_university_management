import api from './api';
import {
    CountedResponse,
    PaginatedResponse,
    ReinscriptionCandidate,
    Student,
    StudentAttendanceStatistics,
    StudentEnrollmentSummary,
    StudentFinancialStatement,
    StudentGradesResponse,
    StudentListParams,
    StudentReportCard,
    StudentSummary,
    AcademicYearCorrectionRequest,
    AcademicYearCorrectionResponse,
} from '../types';

type CompatibleStudentListParams = Partial<
    Omit<StudentListParams, 'page' | 'program' | 'current_level' | 'status' | 'ordering'>
> & {
    page?: number | string;
    program?: number | string | null;
    current_level?: number | string | null;
    status?: string;
    ordering?: string;
};

const buildStudentListRequestParams = (params: CompatibleStudentListParams) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== null && value !== '' && value !== undefined)
    );

async function getStudents(
    params: StudentListParams,
    signal?: AbortSignal
): Promise<PaginatedResponse<Student>>;
async function getStudents(
    params?: CompatibleStudentListParams,
    signal?: AbortSignal
): Promise<PaginatedResponse<Student>>;
async function getStudents(
    params: CompatibleStudentListParams = {},
    signal?: AbortSignal
): Promise<PaginatedResponse<Student>> {
    const response = await api.get<PaginatedResponse<Student>>('/students/', {
        params: buildStudentListRequestParams(params),
        signal,
    });
    return response.data;
}

async function exportStudents(params: StudentListParams): Promise<Blob>;
async function exportStudents(params?: CompatibleStudentListParams): Promise<Blob>;
async function exportStudents(
    params: CompatibleStudentListParams = {}
): Promise<Blob> {
    const response = await api.get<Blob>('/students/export_excel/', {
        params: buildStudentListRequestParams(params),
        responseType: 'blob',
    });
    return response.data;
}

export const studentService = {
    getStudents,

    getStudent: async (id: number, signal?: AbortSignal): Promise<Student> => {
        const response = await api.get<Student>(`/students/${id}/`, { signal });
        return response.data;
    },

    createStudent: async (data: Partial<Student> | FormData) => {
        // Axios must set the multipart boundary itself for FormData uploads.
        const response = await api.post<Student>('/students/', data);
        return response.data;
    },

    updateStudent: async (id: number, data: Partial<Student> | FormData) => {
        const response = await api.patch<Student>(`/students/${id}/`, data);
        return response.data;
    },

    deleteStudent: async (id: number) => {
        await api.delete(`/students/${id}/`);
    },

    downloadIdCard: async (id: number, signal?: AbortSignal): Promise<Blob> => {
        const response = await api.get<Blob>(`/students/${id}/generate_id_card/`, {
            responseType: 'blob',
            params: { refresh: Date.now() },
            signal,
            timeout: 15_000,
        });
        return response.data;
    },

    downloadBulkIdCards: async (studentIds: number[]) => {
        const response = await api.post('/students/generate_bulk_id_cards/', { student_ids: studentIds }, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportStudents,

    getStudentSummary: async (
        currentYearOnly: boolean,
        signal?: AbortSignal
    ): Promise<StudentSummary> => {
        const scope = { current_year_only: currentYearOnly };
        const [all, active, graduated, suspended] = await Promise.all([
            getStudents(scope, signal),
            getStudents({ ...scope, status: 'ACTIVE' }, signal),
            getStudents({ ...scope, status: 'GRADUATED' }, signal),
            getStudents({ ...scope, status: 'SUSPENDED' }, signal),
        ]);

        return {
            total: all.count,
            active: active.count,
            graduated: graduated.count,
            suspended: suspended.count,
        };
    },

    getEnrollments: async (
        id: number,
        signal?: AbortSignal
    ): Promise<CountedResponse<StudentEnrollmentSummary>> => {
        const response = await api.get<CountedResponse<StudentEnrollmentSummary>>(
            `/students/${id}/enrollments/`,
            { signal }
        );
        return response.data;
    },

    getGrades: async (id: number, signal?: AbortSignal): Promise<StudentGradesResponse> => {
        const response = await api.get<StudentGradesResponse>(`/students/${id}/grades/`, { signal });
        return response.data;
    },

    getAttendance: async (
        id: number,
        signal?: AbortSignal
    ): Promise<StudentAttendanceStatistics> => {
        const response = await api.get<StudentAttendanceStatistics>(
            `/students/${id}/attendance_stats/`,
            { signal }
        );
        return response.data;
    },

    getReportCards: async (
        id: number,
        signal?: AbortSignal
    ): Promise<PaginatedResponse<StudentReportCard>> => {
        const response = await api.get<PaginatedResponse<StudentReportCard>>(
            '/academics/report-cards/',
            { params: { student: id }, signal }
        );
        return response.data;
    },

    downloadReportCard: async (id: number): Promise<Blob> => {
        const response = await api.get<Blob>(`/academics/report-cards/${id}/download_pdf/`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getFinancialStatement: async (
        id: number,
        signal?: AbortSignal
    ): Promise<StudentFinancialStatement> => {
        const response = await api.get<StudentFinancialStatement>(
            '/finance/student-balances/statement/',
            { params: { student_id: id }, signal }
        );
        return response.data;
    },

    downloadFinancialStatement: async (id: number): Promise<Blob> => {
        const response = await api.get<Blob>('/finance/student-balances/download_statement/', {
            params: { student_id: id },
            responseType: 'blob',
        });
        return response.data;
    },

    importStudents: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/students/import_excel/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    downloadImportTemplate: async (): Promise<Blob> => {
        const response = await api.get('/students/download_template/', {
            responseType: 'blob'
        });
        return response.data;
    },

    // Re-inscription: previous-year students eligible for the active year
    getReinscriptionCandidates: async (
        search?: string,
        signal?: AbortSignal
    ): Promise<ReinscriptionCandidate[]> => {
        const response = await api.get<ReinscriptionCandidate[]>('/students/reinscription-candidates/', {
            params: search ? { search } : undefined,
            signal,
        });
        return response.data;
    },

    reinscribeStudent: async (data: { student: number; level?: number; program?: number }) => {
        const response = await api.post('/students/reinscription/', data);
        return response.data;
    },

    // Academic-year correction: bulk-move newly created students to the right year
    correctAcademicYear: async (data: AcademicYearCorrectionRequest) => {
        const response = await api.post<AcademicYearCorrectionResponse>(
            '/students/correct-academic-year/',
            data,
        );
        return response.data;
    },
};

export default studentService;
