/**
 * User Menu Dropdown
 * Groups user-related actions: theme toggle, blog, community, logout
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Moon, Sun, BookOpen, Users, LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserMenuProps {
  user: { name?: string | null; email: string; image?: string | null } | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  isLoading: boolean;
}

export function UserMenu({ user, isDark, onToggleTheme, onLogout, isLoading }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2">
          {user?.image ? (
            <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="hidden sm:inline max-w-[120px] truncate text-sm">
            {user?.name || user?.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            {user?.name && (
              <p className="text-sm font-medium leading-none">{user.name}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/app/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleTheme} className="cursor-pointer">
          {isDark ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {isDark ? 'Modo claro' : 'Modo escuro'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="/blog">
            <BookOpen className="mr-2 h-4 w-4" />
            Blog
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="https://t.me/+g27TaGZfnYIzZTUx" target="_blank" rel="noopener noreferrer">
            <Users className="mr-2 h-4 w-4" />
            Comunidade
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={isLoading}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
