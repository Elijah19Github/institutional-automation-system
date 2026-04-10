import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './dashboard/AdminDashboard';
import FacultyDashboard from './dashboard/FacultyDashboard';
import StudentDashboard from './dashboard/StudentDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin text-4xl text-indigo-500">⏳</div>
      </div>
    );
  }

  if (!user) return null;

  switch (user.role.toLowerCase()) {
    case 'admin':
    case 'supadmin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return (
        <div className="p-8 text-center text-rose-500 text-xl font-bold">
          Unknown Role or unassigned dashboard.
        </div>
      );
  }
};

export default Dashboard;
