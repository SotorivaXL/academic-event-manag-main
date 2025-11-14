import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { GraduationCap, User } from '@phosphor-icons/react';

export function AppHeader() {
  const { user } = useAuth();

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

          {/* Simplified: keep user icon but removed logout action from header (moved to sidebar footer) */}
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
