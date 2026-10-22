// User types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  first_name_ar?: string;
  last_name_ar?: string;
  full_name: string;
  role: 'ADMIN' | 'DEAN' | 'TEACHER' | 'STUDENT' | 'ACCOUNTANT' | 'SECRETARY';
  phone: string;
  address: string;
  address_ar?: string;
  profile_picture: string | null;
  date_of_birth: string | null;
  gender?: 'M' | 'F';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// University types
export interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: number;
  academic_year: number;
  academic_year_name: string;
  semester_type: 'S1' | 'S2';
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Faculty {
  id: number;
  name: string;
  code: string;
  description: string;
  dean: number | null;
  dean_name: string;
  departments_count: number;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  faculty: number;
  faculty_name: string;
  head: number | null;
  head_name: string;
  description: string;
  programs_count: number;
  teachers_count: number;
}

export interface Level {
  id: number;
  name: string;
  display_name: string;
  order: number;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  department: number;
  department_name: string;
  faculty_name: string;
  levels: number[];
  levels_display: string;
  duration_years: number;
  description: string;
  tuition_fee: string;
  is_active: boolean;
  students_count: number;
  fees?: ProgramFee[];
}

export interface ProgramFee {
  id: number;
  level: number;
  level_name: string;
  academic_year: number;
  academic_year_name: string;
  amount: string;
}

export interface Classroom {
  id: number;
  name: string;
  code: string;
  building: string;
  capacity: number;
  has_projector: boolean;
  has_computers: boolean;
  is_available: boolean;
  current_status: string;
}

// Student types
export interface Student {
  id: number;
  user: number;
  user_full_name: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  user_email: string;
  user_phone?: string;
  student_id: string;
  program: number;
  program_name: string;
  current_level: number;
  level_display: string;
  enrollment_date: string;
  status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'DROPPED';
  guardian_name: string;
  guardian_phone: string;
  emergency_contact: string;
  photo: string | null;
}

export interface StudentListParams {
  page: number;
  search: string;
  program: number | null;
  current_level: number | null;
  status: '' | Student['status'];
  current_year_only: boolean;
  ordering: '' | 'student_id' | '-student_id' | 'enrollment_date' | '-enrollment_date' | 'created_at' | '-created_at';
}

export interface StudentSummary {
  total: number;
  active: number;
  graduated: number;
  suspended: number;
}

export interface StudentEnrollmentSummary {
  id: number;
  academic_year: number;
  academic_year_name: string;
  program: number;
  program_name: string;
  level: number;
  level_display: string;
  status: string;
  student?: number;
  student_name?: string;
  student_matricule?: string;
  status_display?: string;
  enrollment_date?: string;
  is_active?: boolean;
}

export interface StudentGradesResponse {
  exam_grades: CountedResponse<Grade>;
  course_grades: CountedResponse<CourseGrade>;
}

export interface StudentAttendanceStatistics {
  student_id: number;
  student_name: string;
  statistics: {
    total_sessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number;
  };
}

export interface StudentReportCard {
  id: number;
  academic_year_name?: string;
  academic_year?: string;
  student?: number;
  student_name?: string;
  student_matricule?: string;
  program_name?: string;
  semester?: number;
  semester_name?: string;
  gpa?: string;
  total_credits?: number;
  credits_earned?: number;
  rank?: number;
  is_published?: boolean;
  published_at?: string | null;
  generated_by?: number | null;
  generated_by_name?: string;
  generated_at?: string;
}

export interface StudentFinancialTransaction {
  id?: number;
  date?: string;
  payment_date?: string;
  description?: string;
  amount?: string;
  type?: string;
  payment_method?: string;
  reference?: string;
  status?: string;
}

export interface StudentFinancialStatement {
  total_due: string;
  total_paid: string;
  balance: string;
  transactions: StudentFinancialTransaction[];
  student_name?: string;
  program?: string;
  academic_year?: string;
  status?: string;
}

export type StudentProfileTab = 'info' | 'enrollments' | 'grades' | 'attendance' | 'bulletins' | 'finance' | 'idcard';

// Teacher types
export interface Teacher {
  id: number;
  user: number;
  user_name?: string;
  user_full_name?: string;
  first_name?: string;
  last_name?: string;
  user_email?: string;
  user_phone?: string;
  user_address?: string;
  user_date_of_birth?: string | null;
  user_gender?: 'M' | 'F';
  user_profile_picture?: string | null;
  employee_id: string;
  department: number | null;
  department_name?: string;
  department_code?: string;
  faculty_name?: string;
  rank: string;
  rank_display: string;
  contract_type: string;
  contract_type_display: string;
  hire_date: string;
  specialization: string;
  office_location: string;
  is_active: boolean;
  courses_count?: number;
  active_contracts_count?: number;
}

// Course types
export interface Course {
  id: number;
  name: string;
  code: string;
  program: number;
  program_name: string;
  course_type: 'REQUIRED' | 'ELECTIVE' | 'PRACTICAL';
  course_type_display: string;
  semester_type: 'S1' | 'S2';
  semester_type_display: string;
  level: number;
  level_display: string;
  credits: number;
  hours_lecture: number;
  hours_practical: number;
  hours_tutorial: number;
  total_hours: number;
  description: string;
  coefficient: string;
  is_active: boolean;
}

// Grade types
export interface Grade {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  exam: number;
  exam_info: string;
  score: string;
  remarks: string;
  is_absent: boolean;
  percentage: string;
}

export interface CourseGrade {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  course: number;
  course_name: string;
  course_code: string;
  semester: number;
  final_score: string;
  grade_letter: string;
  is_validated: boolean;
}

// Finance types
export interface TuitionPayment {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  academic_year: number;
  academic_year_name: string;
  level: number | null;
  level_name: string;
  semester: number | null;
  semester_name: string;
  amount: string;
  payment_method: string;
  payment_method_display: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  status_display: string;
  reference: string;
  payment_date: string;
}

export interface DebtPayment {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  payment_method_display?: string;
  reference: string;
  notes?: string;
  received_by?: number | null;
  received_by_name?: string | null;
  created_at?: string;
}

export interface StudentDebt {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  academic_year: number | null;
  academic_year_name: string | null;
  amount_due: string;
  amount_paid: string;
  outstanding: string;
  status: 'OPEN' | 'PARTIAL' | 'PAID';
  status_display: string;
  description: string;
  recorded_by?: number | null;
  created_at: string;
  payments?: DebtPayment[];
}

// A previous-year student eligible for re-inscription into the active year
export interface ReinscriptionCandidate {
  id: number;
  student_id: string;
  name: string;
  email?: string;
  program: string;
  last_year: string | null;
  last_level: string | null;
}

// Deliberation types
export interface StudentPromotion {
  id: number;
  student: number;
  student_name: string;
  student_matricule: string;
  academic_year: number;
  program: number;
  level_from: number;
  level_to: number | null;
  annual_gpa: string;
  decision: 'PROMOTED' | 'REPEATED' | 'FAILED' | 'CONDITIONAL';
  decision_display: string;
  decision_date: string;
  remarks: string;
}

// Scheduling types
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

// API Response types
export interface CountedResponse<T> {
  count: number;
  results: T[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Academic-year correction types
export interface AcademicYearCorrectionRequest {
  student_ids: number[];
  source_academic_year: number;
  target_academic_year: number;
  enrollment_date: string;
}

export interface AcademicYearCorrectionResponse {
  transferred: Array<{
    student: number;
    name: string;
    old_student_id: string;
    new_student_id: string;
  }>;
  blocked: Array<{
    student: number;
    student_id?: string;
    reason: string;
  }>;
}
