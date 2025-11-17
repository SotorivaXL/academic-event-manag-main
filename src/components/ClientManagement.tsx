// src/components/ClientManagement.tsx

import React, { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Buildings,
    PencilSimple,
    Trash,
    CircleNotch,
} from '@phosphor-icons/react';
import { showError } from '@/lib/toast';
import {
    isValidEmail,
    isValidPhone,
    maskPhone,
    removePhoneMask,
    maskCNPJ,
    removeCNPJMask,
    isValidCNPJ,
} from '@/lib/utils';

interface ClientFormState {
    name: string;
    cnpj: string;
    slug: string;
    logo_url: string; // guardamos base64 ou URL aqui
    contact_email: string;
    contact_phone: string;
    default_min_presence_pct: number;
    lgpd_policy_text: string;
    certificate_template_html: string;
}

interface ClientFormErrors {
    name: string;
    cnpj: string;
    slug: string;
    contact_email: string;
    contact_phone: string;
}

export function ClientManagement() {
    const {
        clients,
        loading,
        error,
        createClient,
        updateClient,
        deleteClient,
    } = useClients();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [form, setForm] = useState<ClientFormState>({
        name: '',
        cnpj: '',
        slug: '',
        logo_url: '',
        contact_email: '',
        contact_phone: '',
        default_min_presence_pct: 80,
        lgpd_policy_text: '',
        certificate_template_html:
            '<html><body><h1>{{ evento.titulo }}</h1><p>{{ aluno.nome }}</p><p>Verifique: {{ verify_url }}</p></body></html>',
    });
    const [formErrors, setFormErrors] = useState<ClientFormErrors>({
        name: '',
        cnpj: '',
        slug: '',
        contact_email: '',
        contact_phone: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [logoFileName, setLogoFileName] = useState<string>('');

    const resetForm = () => {
        setForm({
            name: '',
            cnpj: '',
            slug: '',
            logo_url: '',
            contact_email: '',
            contact_phone: '',
            default_min_presence_pct: 80,
            lgpd_policy_text: '',
            certificate_template_html:
                '<html><body><h1>{{ evento.titulo }}</h1><p>{{ aluno.nome }}</p><p>Verifique: {{ verify_url }}</p></body></html>',
        });
        setFormErrors({
            name: '',
            cnpj: '',
            slug: '',
            contact_email: '',
            contact_phone: '',
        });
        setLogoFileName('');
        setEditingClient(null);
    };

    const openCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const openEdit = (client: Client) => {
        setEditingClient(client);
        setForm({
            name: client.name,
            cnpj: maskCNPJ(client.cnpj),
            slug: client.slug,
            logo_url: client.logo_url || '',
            contact_email: client.contact_email,
            contact_phone: client.contact_phone ? maskPhone(client.contact_phone) : '',
            default_min_presence_pct: client.default_min_presence_pct,
            lgpd_policy_text: client.lgpd_policy_text,
            certificate_template_html: client.certificate_template_html,
        });
        setFormErrors({
            name: '',
            cnpj: '',
            slug: '',
            contact_email: '',
            contact_phone: '',
        });
        setLogoFileName('');
        setIsFormOpen(true);
    };

    const handleChange = (field: keyof ClientFormState, value: string) => {
        let newValue: string | number = value;

        if (field === 'cnpj') {
            newValue = maskCNPJ(value);
        } else if (field === 'contact_phone') {
            newValue = maskPhone(value);
        } else if (field === 'default_min_presence_pct') {
            const num = Number(value);
            newValue = isNaN(num) ? 0 : num;
        }

        setForm((prev) => ({
            ...prev,
            [field]: newValue,
        }));

        // limpa erro do campo quando o usuário começa a digitar
        if (field in formErrors) {
            setFormErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const handleLogoFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLogoFileName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                setForm((prev) => ({
                    ...prev,
                    logo_url: result, // base64 data URL
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const validateForm = (): boolean => {
        const errors: ClientFormErrors = {
            name: '',
            cnpj: '',
            slug: '',
            contact_email: '',
            contact_phone: '',
        };

        if (!form.name.trim()) {
            errors.name = 'Nome é obrigatório.';
        }

        if (!form.cnpj.trim()) {
            errors.cnpj = 'CNPJ é obrigatório.';
        } else if (!isValidCNPJ(form.cnpj)) {
            errors.cnpj = 'CNPJ inválido.';
        }

        if (!form.slug.trim()) {
            errors.slug = 'Slug é obrigatório.';
        }

        if (!form.contact_email.trim()) {
            errors.contact_email = 'Email de contato é obrigatório.';
        } else if (!isValidEmail(form.contact_email)) {
            errors.contact_email = 'Email inválido.';
        }

        if (form.contact_phone.trim() && !isValidPhone(form.contact_phone)) {
            errors.contact_phone = 'Telefone inválido.';
        }

        setFormErrors(errors);

        return !Object.values(errors).some((msg) => msg);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        if (!validateForm()) {
            showError('Corrija os erros no formulário antes de continuar.');
            return;
        }

        setSubmitting(true);

        const payload = {
            name: form.name.trim(),
            cnpj: removeCNPJMask(form.cnpj),
            slug: form.slug.trim(),
            logo_url: form.logo_url.trim(),
            contact_email: form.contact_email.trim(),
            contact_phone: form.contact_phone
                ? removePhoneMask(form.contact_phone)
                : null,
            default_min_presence_pct: form.default_min_presence_pct,
            lgpd_policy_text: form.lgpd_policy_text,
            certificate_template_html: form.certificate_template_html,
            // para criação precisamos enviar algum JSON (mesmo que vazio)
            config_json: {} as Record<string, unknown>,
        };

        try {
            if (editingClient) {
                await updateClient(editingClient.id, {
                    ...payload,
                    // em update, config_json pode ser omitido ou mantido
                });
            } else {
                await createClient(payload);
            }

            setIsFormOpen(false);
            resetForm();
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (client: Client) => {
        const ok = window.confirm(
            `Tem certeza que deseja excluir o cliente "${client.name}"?`
        );
        if (!ok) return;

        await deleteClient(client.id);
    };

    // Estados de loading/erro

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Clientes</h2>
                        <p className="text-muted-foreground">
                            Gerencie os dados dos clientes (instituições).
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <CircleNotch className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Carregando clientes...</span>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Clientes</h2>
                        <p className="text-muted-foreground">
                            Gerencie os dados dos clientes (instituições).
                        </p>
                    </div>
                </div>
                <Card>
                    <CardContent className="py-8">
                        <p className="text-destructive font-medium mb-2">
                            Erro ao carregar clientes
                        </p>
                        <p className="text-muted-foreground text-sm">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Buildings className="h-6 w-6" />
                        Clientes
                    </h2>
                    <p className="text-muted-foreground">
                        Cadastre e configure instituições (clientes) do sistema.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {clients.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Nenhum cliente cadastrado. Clique em &quot;Novo Cliente&quot; para
                            criar o primeiro.
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>CNPJ</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Presença mín. (%)</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-mono text-xs">
                                            {client.id}
                                        </TableCell>
                                        <TableCell>{client.name}</TableCell>
                                        <TableCell>{maskCNPJ(client.cnpj)}</TableCell>
                                        <TableCell>{client.slug}</TableCell>
                                        <TableCell>{client.contact_email}</TableCell>
                                        <TableCell>
                                            {client.contact_phone
                                                ? maskPhone(client.contact_phone)
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {client.default_min_presence_pct ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                    onClick={() => openEdit(client)}
                                                >
                                                    <PencilSimple className="h-3 w-3" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="gap-1"
                                                    onClick={() => handleDelete(client)}
                                                >
                                                    <Trash className="h-3 w-3" />
                                                    Excluir
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="client-name">Nome *</Label>
                                <Input
                                    id="client-name"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={formErrors.name ? 'border-destructive' : ''}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-destructive mt-1">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="client-cnpj">CNPJ *</Label>
                                <Input
                                    id="client-cnpj"
                                    value={form.cnpj}
                                    onChange={(e) => handleChange('cnpj', e.target.value)}
                                    maxLength={18}
                                    className={formErrors.cnpj ? 'border-destructive' : ''}
                                />
                                {formErrors.cnpj && (
                                    <p className="text-xs text-destructive mt-1">
                                        {formErrors.cnpj}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="client-slug">Slug/Subdomínio *</Label>
                                <Input
                                    id="client-slug"
                                    value={form.slug}
                                    onChange={(e) => handleChange('slug', e.target.value)}
                                    placeholder="ex: demo"
                                    className={formErrors.slug ? 'border-destructive' : ''}
                                />
                                {formErrors.slug && (
                                    <p className="text-xs text-destructive mt-1">
                                        {formErrors.slug}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="client-logo-file">Logo (imagem)</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="client-logo-file"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                    />
                                    {form.logo_url && (
                                        <div className="h-10 w-auto border rounded bg-muted flex items-center justify-center px-2">
                                            <img
                                                src={form.logo_url}
                                                alt="Pré-visualização da logo"
                                                className="h-8 object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                                {logoFileName && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Arquivo selecionado: {logoFileName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="client-email">Email de contato *</Label>
                                <Input
                                    id="client-email"
                                    type="email"
                                    value={form.contact_email}
                                    onChange={(e) =>
                                        handleChange('contact_email', e.target.value)
                                    }
                                    className={
                                        formErrors.contact_email ? 'border-destructive' : ''
                                    }
                                />
                                {formErrors.contact_email && (
                                    <p className="text-xs text-destructive mt-1">
                                        {formErrors.contact_email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="client-phone">Telefone de contato</Label>
                                <Input
                                    id="client-phone"
                                    value={form.contact_phone}
                                    onChange={(e) =>
                                        handleChange('contact_phone', e.target.value)
                                    }
                                    placeholder="(11) 99999-9999"
                                    maxLength={15}
                                    className={
                                        formErrors.contact_phone ? 'border-destructive' : ''
                                    }
                                />
                                {formErrors.contact_phone && (
                                    <p className="text-xs text-destructive mt-1">
                                        {formErrors.contact_phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="client-min-presence">
                                    Presença mínima para certificado (%)
                                </Label>
                                <Input
                                    id="client-min-presence"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.default_min_presence_pct}
                                    onChange={(e) =>
                                        handleChange('default_min_presence_pct', e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="client-lgpd">Política de LGPD</Label>
                            <Textarea
                                id="client-lgpd"
                                rows={3}
                                value={form.lgpd_policy_text}
                                onChange={(e) =>
                                    handleChange('lgpd_policy_text', e.target.value)
                                }
                            />
                        </div>

                        <div>
                            <Label htmlFor="client-template">
                                Template HTML do certificado
                            </Label>
                            <Textarea
                                id="client-template"
                                rows={5}
                                value={form.certificate_template_html}
                                onChange={(e) =>
                                    handleChange('certificate_template_html', e.target.value)
                                }
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use placeholders como{' '}
                                <code>{'{{ aluno.nome }}'}</code>,{' '}
                                <code>{'{{ evento.titulo }}'}</code> e{' '}
                                <code>{'{{ verify_url }}'}</code>.
                            </p>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={submitting}>
                                {submitting
                                    ? 'Salvando...'
                                    : editingClient
                                        ? 'Salvar alterações'
                                        : 'Criar cliente'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsFormOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}