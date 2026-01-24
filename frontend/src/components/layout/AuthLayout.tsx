/**
 * Auth Layout for Login Page
 */
import { Outlet } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <div className="bg-primary p-2 sm:p-3 rounded-lg sm:rounded-xl">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Horas Líquidas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Organize seus estudos</p>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md px-2 sm:px-0">
        <Outlet />
      </div>

      {/* Footer */}
      <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground text-center px-4">
        Acompanhe seu progresso e alcance suas metas de estudo
      </p>
    </div>
  );
}

export default AuthLayout;
