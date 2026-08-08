import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'student' | 'teacher';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const userRaw = localStorage.getItem('shiksha_user');

  // Not logged in
  if (!userRaw) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userRaw);

    // Malformed session
    if (!user?.id || !user?.role) return <Navigate to="/login" replace />;

    // Wrong role — teachers can access student routes, students cannot access teacher routes
    if (requiredRole === 'teacher' && user.role !== 'teacher') {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
};
