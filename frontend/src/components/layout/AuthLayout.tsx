/**
 * Auth Layout for Login Page
 */
import { Outlet } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary p-3 rounded-xl">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Study Planner</h1>
          <p className="text-sm text-text-light">Organize seus estudos</p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-text-lighter text-center">
        Acompanhe seu progresso e alcance suas metas de estudo
      </p>
    </div>
  );
}

export default AuthLayout;
