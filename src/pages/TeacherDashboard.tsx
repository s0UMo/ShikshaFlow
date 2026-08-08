import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="glass-card p-8 rounded-2xl text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-purple-500/10 text-purple-400">
          <LayoutDashboard className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white">Teacher Analytics Dashboard (Stage 4 Ready)</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Class-wide accuracy heatmap, stuck-student alert system, and Firestore real-time sync structure prepared.
        </p>
      </div>
    </div>
  );
};
