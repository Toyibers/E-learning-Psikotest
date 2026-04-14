/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import LoginRegister from './pages/auth/LoginRegister';
import Home from './pages/student/Home';
import StudentClassDetail from './pages/student/ClassDetail';
import ModuleDetail from './pages/student/ModuleDetail';
import Dashboard from './pages/admin/Dashboard';
import Classes from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import AdminModuleDetail from './pages/admin/ModuleDetail';
import Students from './pages/admin/Students';
import Profile from './pages/admin/Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRegister />} />
        
        {/* Student Routes */}
        <Route path="/" element={<StudentLayout />}>
          <Route index element={<Home />} />
          <Route path="class/:classId" element={<StudentClassDetail />} />
          <Route path="module/:id" element={<ModuleDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="modules" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="modules/:id" element={<AdminModuleDetail />} />
          <Route path="students" element={<Students />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

