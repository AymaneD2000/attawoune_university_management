import { useQuery } from '@tanstack/react-query';
import studentService from '../../services/studentService';
import { StudentListParams } from '../../types';

export const studentQueryKeys = {
  all: ['students'] as const,
  lists: () => ['students', 'list'] as const,
  list: (params: StudentListParams) => [...studentQueryKeys.lists(), params] as const,
  summaries: () => ['students', 'summary'] as const,
  summary: (currentYearOnly: boolean) => [...studentQueryKeys.summaries(), currentYearOnly] as const,
  detail: (id: number) => ['students', 'detail', id] as const,
  enrollments: (id: number) => ['students', id, 'enrollments'] as const,
  grades: (id: number) => ['students', id, 'grades'] as const,
  attendance: (id: number) => ['students', id, 'attendance'] as const,
  bulletins: (id: number) => ['students', id, 'bulletins'] as const,
  finance: (id: number) => ['students', id, 'finance'] as const,
  idCard: (id: number) => ['students', id, 'id-card'] as const,
};

export const useStudentsQuery = (params: StudentListParams) => useQuery({
  queryKey: studentQueryKeys.list(params),
  queryFn: ({ signal }) => studentService.getStudents(params, signal),
  staleTime: 30_000,
});

export const useStudentSummaryQuery = (currentYearOnly: boolean) => useQuery({
  queryKey: studentQueryKeys.summary(currentYearOnly),
  queryFn: ({ signal }) => studentService.getStudentSummary(currentYearOnly, signal),
  staleTime: 60_000,
});

export const useStudentQuery = (id: number) => useQuery({
  queryKey: studentQueryKeys.detail(id),
  queryFn: ({ signal }) => studentService.getStudent(id, signal),
  enabled: id > 0,
  staleTime: 30_000,
});

export const useStudentEnrollmentsQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.enrollments(id),
  queryFn: ({ signal }) => studentService.getEnrollments(id, signal),
  enabled: id > 0 && enabled,
});

export const useStudentGradesQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.grades(id),
  queryFn: ({ signal }) => studentService.getGrades(id, signal),
  enabled: id > 0 && enabled,
});

export const useStudentAttendanceQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.attendance(id),
  queryFn: ({ signal }) => studentService.getAttendance(id, signal),
  enabled: id > 0 && enabled,
});

export const useStudentBulletinsQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.bulletins(id),
  queryFn: ({ signal }) => studentService.getReportCards(id, signal),
  enabled: id > 0 && enabled,
});

export const useStudentFinanceQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.finance(id),
  queryFn: ({ signal }) => studentService.getFinancialStatement(id, signal),
  enabled: id > 0 && enabled,
});

export const useStudentIdCardQuery = (id: number, enabled: boolean) => useQuery({
  queryKey: studentQueryKeys.idCard(id),
  queryFn: ({ signal }) => studentService.downloadIdCard(id, signal),
  enabled: id > 0 && enabled,
});
