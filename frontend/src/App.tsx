import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Main pages
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import TeachersPage from './pages/teachers/TeachersPage';
import CoursesPage from './pages/academics/CoursesPage';
import GradesPage from './pages/academics/GradesPage';
import DeliberationPage from './pages/academics/DeliberationPage';
import SchedulePage from './pages/scheduling/SchedulePage';
import AnnouncementsPage from './pages/scheduling/AnnouncementsPage';
import FinancePage from './pages/finance/FinancePage';

// Structure pages
import FacultiesPage from './pages/structure/FacultiesPage';
import DepartmentsPage from './pages/structure/DepartmentsPage';
import ProgramsPage from './pages/structure/ProgramsPage';
import ClassroomsPage from './pages/structure/ClassroomsPage';
import AcademicYearsPage from './pages/structure/AcademicYearsPage';
import LevelsPage from './pages/structure/LevelsPage';

// Admin pages
import UsersPage from './pages/admin/UsersPage';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Students */}
              <Route path="students" element={<StudentsPage />} />

              {/* Teachers */}
              <Route path="teachers" element={<TeachersPage />} />

              {/* Academics */}
              <Route path="academics/courses" element={<CoursesPage />} />
              <Route path="academics/grades" element={<GradesPage />} />
              <Route path="academics/deliberation" element={<DeliberationPage />} />

              {/* Scheduling */}
              <Route path="scheduling" element={<SchedulePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />

              {/* Finance */}
              <Route path="finance" element={<FinancePage />} />

              {/* University Management */}

              {/* University Management */}
              <Route path="university/faculties" element={<FacultiesPage />} />
              <Route path="university/departments" element={<DepartmentsPage />} />
              <Route path="university/programs" element={<ProgramsPage />} />
              <Route path="university/classrooms" element={<ClassroomsPage />} />
              <Route path="university/academic-years" element={<AcademicYearsPage />} />
              <Route path="university/levels" element={<LevelsPage />} />

              {/* Administration */}
              <Route path="admin/users" element={<UsersPage />} />
            </Route>

            {/* Unauthorized */}
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-red-600">403</h1>
                    <p className="text-gray-500 mt-2">Accès non autorisé</p>
                    <a href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
                      Retour au tableau de bord
                    </a>
                  </div>
                </div>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">404</h1>
                    <p className="text-gray-500 mt-2">Page non trouvée</p>
                    <a href="/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
                      Retour au tableau de bord
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
