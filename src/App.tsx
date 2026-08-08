import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { StudentQuiz } from './pages/StudentQuiz';
import { TeacherDashboard } from './pages/TeacherDashboard';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/student" element={<StudentQuiz />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
