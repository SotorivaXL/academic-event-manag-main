// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiService, LoginRequest, LoginResponse } from '../lib/api';
import { UserRole } from '@/lib/types';

interface AuthUser {
    username: string;
    tenant: string;
    role: UserRole | string;
    name?: string;
    email?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

const STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const allowedRoles = ['admin', 'client', 'cliente'];

    useEffect(() => {
        const checkAuth = () => {
            const hasToken = ApiService.isAuthenticated();
            const storedUser = localStorage.getItem(STORAGE_KEY);

            if (hasToken && storedUser) {
                try {
                    const parsed: AuthUser = JSON.parse(storedUser);
                    if (parsed.role && allowedRoles.includes(String(parsed.role).toLowerCase())) {
                        setUser(parsed);
                    } else {
                        // usuário sem permissão para este módulo
                        ApiService.logout();
                        localStorage.removeItem(STORAGE_KEY);
                    }
                } catch {
                    ApiService.logout();
                    localStorage.removeItem(STORAGE_KEY);
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginRequest) => {
        setIsLoading(true);
        try {
            const response: LoginResponse = await ApiService.login(credentials);

            const apiUser = response.user;
            const rawRole =
                apiUser.role ||
                (apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : '') ||
                '';

            const normalizedRole = rawRole.toLowerCase();

            if (!allowedRoles.includes(normalizedRole)) {
                ApiService.logout();
                setUser(null);
                localStorage.removeItem(STORAGE_KEY);
                throw new Error(
                    'Este usuário não tem permissão para acessar o módulo web (role inválida).'
                );
            }

            const authUser: AuthUser = {
                username: apiUser.email || credentials.username,
                tenant: 'demo', // em um cenário real viria do token ou da resposta
                role: normalizedRole,
                name: apiUser.name,
                email: apiUser.email,
            };

            setUser(authUser);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        ApiService.logout();
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}