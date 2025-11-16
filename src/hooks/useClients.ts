// src/hooks/useClients.ts
import { useEffect, useState } from 'react';
import { ApiService, CreateClientRequest, UpdateClientRequest } from '@/lib/api';
import { Client } from '@/lib/types';
import { showError, showSuccess } from '@/lib/toast';

export function useClients() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            setError(null);

            // Por enquanto o backend expõe apenas "Get My Client".
            const current = await ApiService.getCurrentClient();
            setClients(current ? [current] : []);
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Erro ao carregar clientes';
            setError(msg);
            showError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const createClient = async (
        data: Omit<CreateClientRequest, 'config_json'> & {
            config_json?: Record<string, unknown>;
        }
    ): Promise<Client | null> => {
        try {
            const payload: CreateClientRequest = {
                ...data,
                default_min_presence_pct: data.default_min_presence_pct ?? 0,
                config_json: data.config_json ?? {},
            };
            const created = await ApiService.createClient(payload);
            setClients(prev => [...prev, created]);
            showSuccess('Cliente criado com sucesso');
            return created;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Erro ao criar cliente';
            showError(msg);
            return null;
        }
    };

    const updateClient = async (
        id: number,
        data: UpdateClientRequest
    ): Promise<Client | null> => {
        try {
            const updated = await ApiService.updateClient(id, data);
            setClients(prev =>
                prev.map(c => (c.id === id ? updated : c))
            );
            showSuccess('Cliente atualizado com sucesso');
            return updated;
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : 'Erro ao atualizar cliente';
            showError(msg);
            return null;
        }
    };

    // Não há DELETE no backend; aqui apenas deixo um stub para futuro.
    const deleteClient = async (id: number): Promise<boolean> => {
        showError(
            'Exclusão não disponível',
            'O backend ainda não possui endpoint para excluir clientes.'
        );
        return false;
    };

    return {
        clients,
        loading,
        error,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
    };
}