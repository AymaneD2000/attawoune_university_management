import api from './api';

export interface StudentStats {
    avg_score: number;
    max_score: number;
    min_score: number;
    total_exams: number;
    absences: number;
}

export interface Grade {
    id: number;
    student: number;
    student_name: string;
    student_matricule: string;
    exam: number;
    exam_type: string;
    exam_type_display: string;
    course_name: string;
    course_code: string;
    score: string;
    max_score: string;
    is_absent: boolean;
    remarks: string;
    graded_by_name: string;
    graded_at: string;
}

export interface StudentGradeHistory {
    grades: Grade[];
    stats: StudentStats;
}

export const gradesService = {
    // Export template for importing grades
    exportTemplate: async (examId: number) => {
        const response = await api.get('/academics/grades/export_template/', {
            params: { exam_id: examId },
            responseType: 'blob'
        });
        return response.data;
    },

    // Export current grades for an exam
    exportGrades: async (examId: number) => {
        const response = await api.get('/academics/grades/export_grades/', {
            params: { exam_id: examId },
            responseType: 'blob'
        });
        return response.data;
    },

    // Import grades from Excel
    importGrades: async (examId: number, file: File) => {
        const formData = new FormData();
        formData.append('exam_id', examId.toString());
        formData.append('file', file);
        const response = await api.post('/academics/grades/import_grades/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Get a student's full grade history
    getStudentHistory: async (studentId: number) => {
        const response = await api.get<StudentGradeHistory>('/academics/grades/student_history/', {
            params: { student_id: studentId }
        });
        return response.data;
    }
};
