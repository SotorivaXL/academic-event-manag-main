import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { GraduationCap, User, SignOut } from '@phosphor-icons/react';
import toast from '@/lib/toast';

export function AppHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.info('Logout realizado com sucesso');
  };

  return (
    <header className="border-b bg-card">
      <div className="flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sistema de Eventos Acadêmicos</h1>
            <p className="text-sm text-muted-foreground">
              Gestão completa de eventos, inscrições e certificados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <p className="font-medium">{user?.username}</p>
            <p className="text-muted-foreground">Tenant: {user?.tenant}</p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <SignOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
