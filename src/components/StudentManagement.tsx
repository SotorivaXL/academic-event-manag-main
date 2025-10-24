import React, { useState } from 'react';
import { Student, Event, Enrollment } from '@/lib/types';
import { useStudents } from '@/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, UserPlus, QrCode, MagnifyingGlass, Trash, PencilSimple, CircleNotch, Hash } from '@phosphor-icons/react';
import { showSuccess, showError, confirm } from '@/lib/toast';
import {
  isValidEmail, 
  isValidCPF, 
  isValidPhone, 
  maskCPF, 
  maskPhone, 
  removeCPFMask, 
  removePhoneMask 
} from '@/lib/utils';

interface StudentManagementProps {
  events: Event[];
  enrollments: Enrollment[];
  onEnrollmentCreate: (enrollment: Enrollment) => void;
}

export function StudentManagement({ 
  events, 
  enrollments, 
  onEnrollmentCreate 
}: StudentManagementProps) {
  const {
    students,
    loading,
    error,
    totalStudents,
    currentPage,
    searchQuery,
    createStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    searchStudentById,
    loadPage,
  } = useStudents();

  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [searchIdInput, setSearchIdInput] = useState('');
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    cpf: '',
    ra: '',
    phone: ''
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: ''
  });

  const resetStudentForm = () => {
    setStudentForm({
      name: '',
      email: '',
      cpf: '',
      ra: '',
      phone: ''
    });
    setFormErrors({
      name: '',
      email: '',
      cpf: '',
      phone: ''
    });
    setIsCreatingStudent(false);
    setIsEditingStudent(false);
    setEditingStudent(null);
  };

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      cpf: '',
      phone: ''
    };

    // Validate name
    if (!studentForm.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (studentForm.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validate email
    if (!studentForm.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!isValidEmail(studentForm.email)) {
      errors.email = 'Email inválido';
    }

    // Validate CPF
    if (!studentForm.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!isValidCPF(studentForm.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    // Validate phone (if provided)
    if (studentForm.phone.trim() && !isValidPhone(studentForm.phone)) {
      errors.phone = 'Telefone inválido';
    }

    setFormErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== '');
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Erro', 'Corrija os erros no formulário');
      return;
    }

    const studentData = {
      name: studentForm.name.trim(),
      email: studentForm.email.trim(),
      cpf: removeCPFMask(studentForm.cpf),
      ra: studentForm.ra.trim(),
      phone: removePhoneMask(studentForm.phone)
    };

    if (editingStudent) {
      // Update existing student
      const success = await updateStudent(editingStudent.id, studentData);
      if (success) {
        resetStudentForm();
      }
    } else {
      // Create new student
      const success = await createStudent(studentData);
      if (success) {
        resetStudentForm();
      }
    }
  };

  const handleEditStudent = (student: Student) => {
    setStudentForm({
      name: student.name,
      email: student.email,
      cpf: maskCPF(student.cpf),
      ra: student.ra || '',
      phone: student.phone ? maskPhone(student.phone) : ''
    });
    setFormErrors({
      name: '',
      email: '',
      cpf: '',
      phone: ''
    });
    setEditingStudent(student);
    setIsEditingStudent(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    const ok = await confirm('Excluir estudante', `Tem certeza que deseja excluir o estudante ${student.name}?`)
    if (!ok) return

    await deleteStudent(student.id)
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents(searchInput);
  };

  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchIdInput.trim()) {
      showError('Erro', 'Digite um ID válido');
      return;
    }
    await searchStudentById(searchIdInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchIdInput('');
    searchStudents('');
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'cpf') {
      setStudentForm({ ...studentForm, [field]: maskCPF(value) });
    } else if (field === 'phone') {
      setStudentForm({ ...studentForm, [field]: maskPhone(value) });
    } else {
      setStudentForm({ ...studentForm, [field]: value });
    }

    // Clear error when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [field as keyof typeof formErrors]: '' });
    }
  };

  const handleEnrollment = () => {
    if (!selectedStudentId || !selectedEventId) {
      showError('Erro', 'Selecione um aluno e um evento');
      return;
    }

    const event = events.find(e => e.id === selectedEventId);
    if (!event) {
      showError('Erro', 'Evento não encontrado');
      return;
    }

    // Check if student is already enrolled
    const existingEnrollment = enrollments.find(
      e => e.studentId === selectedStudentId && e.eventId === selectedEventId
    );
    
    if (existingEnrollment) {
      showError('Erro', 'Aluno já está inscrito neste evento');
      return;
    }

    // For now, we'll use the existing enrollment creation logic
    // This would ideally also be connected to a web API
    const newEnrollment: Enrollment = {
      id: `enrollment-${Date.now()}`,
      studentId: selectedStudentId,
      eventId: selectedEventId,
      status: 'confirmed',
      enrolledAt: new Date().toISOString(),
      qrCode: `QR-${Date.now()}`
    };

    onEnrollmentCreate(newEnrollment);
    showSuccess('Aluno inscrito', 'Aluno inscrito com sucesso');

    setSelectedStudentId('');
    setSelectedEventId('');
    setIsEnrollingStudent(false);
  };

  const getStudentEnrollments = (studentId: string) => {
    return enrollments.filter(e => e.studentId === studentId);
  };

  const publishedEvents = events.filter(e => e.status === 'published');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gerenciamento de Alunos</h2>
            <p className="text-muted-foreground">Cadastre alunos e gerencie inscrições</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <CircleNotch className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando estudantes...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gerenciamento de Alunos</h2>
            <p className="text-muted-foreground">Cadastre alunos e gerencie inscrições</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2 text-destructive">Erro ao carregar dados</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Alunos</h2>
          <p className="text-muted-foreground">Cadastre alunos e gerencie inscrições ({totalStudents} total)</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEnrollingStudent} onOpenChange={setIsEnrollingStudent}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Inscrever Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inscrever Aluno em Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Selecionar Aluno</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} - {student.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Selecionar Evento</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {publishedEvents.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleEnrollment}>Inscrever</Button>
                  <Button variant="outline" onClick={() => setIsEnrollingStudent(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatingStudent} onOpenChange={setIsCreatingStudent}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="student-name">Nome Completo *</Label>
                  <Input
                    id="student-name"
                    value={studentForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome do aluno"
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-destructive text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="student-email">Email *</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-destructive text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="student-cpf">CPF *</Label>
                  <Input
                    id="student-cpf"
                    value={studentForm.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={formErrors.cpf ? 'border-destructive' : ''}
                  />
                  {formErrors.cpf && (
                    <p className="text-destructive text-sm mt-1">{formErrors.cpf}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="student-ra">RA/Matrícula</Label>
                  <Input
                    id="student-ra"
                    value={studentForm.ra}
                    onChange={(e) => handleInputChange('ra', e.target.value)}
                    placeholder="Número de matrícula"
                  />
                </div>
                <div>
                  <Label htmlFor="student-phone">Telefone</Label>
                  <Input
                    id="student-phone"
                    value={studentForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-destructive text-sm mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">Cadastrar Aluno</Button>
                  <Button type="button" variant="outline" onClick={resetStudentForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditingStudent} onOpenChange={setIsEditingStudent}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Editar Aluno</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-student-name">Nome Completo *</Label>
                  <Input
                    id="edit-student-name"
                    value={studentForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome do aluno"
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-destructive text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-student-email">Email *</Label>
                  <Input
                    id="edit-student-email"
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-destructive text-sm mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-student-cpf">CPF *</Label>
                  <Input
                    id="edit-student-cpf"
                    value={studentForm.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={formErrors.cpf ? 'border-destructive' : ''}
                  />
                  {formErrors.cpf && (
                    <p className="text-destructive text-sm mt-1">{formErrors.cpf}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="edit-student-ra">RA/Matrícula</Label>
                  <Input
                    id="edit-student-ra"
                    value={studentForm.ra}
                    onChange={(e) => handleInputChange('ra', e.target.value)}
                    placeholder="Número de matrícula"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-student-phone">Telefone</Label>
                  <Input
                    id="edit-student-phone"
                    value={studentForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-destructive text-sm mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit">Salvar Alterações</Button>
                  <Button type="button" variant="outline" onClick={resetStudentForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pesquisar Estudantes</CardTitle>
            {searchQuery && (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Limpar busca
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Digite nome, email ou CPF..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline" className="gap-2">
              <MagnifyingGlass className="h-4 w-4" />
              Pesquisar
            </Button>
          </form>
          
          <div className="border-t pt-4">
            <form onSubmit={handleSearchById} className="flex gap-2">
              <Input
                placeholder="Digite o ID do estudante..."
                value={searchIdInput}
                onChange={(e) => setSearchIdInput(e.target.value)}
                className="flex-1"
                type="number"
              />
              <Button type="submit" variant="outline" className="gap-2">
                <Hash className="h-4 w-4" />
                Buscar por ID
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-1">
              Busca direta por ID do estudante para encontrar um registro específico
            </p>
          </div>
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchQuery ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Tente ajustar os termos de busca' : 'Comece cadastrando seu primeiro aluno'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreatingStudent(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos ({students.length})</CardTitle>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Resultados para: {searchQuery}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>RA/Matrícula</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Inscrições</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const studentEnrollments = getStudentEnrollments(student.id.toString());
                  const activeEnrollments = studentEnrollments.filter(e => e.status === 'confirmed');
                  const waitlistEnrollments = studentEnrollments.filter(e => e.status === 'waitlist');
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.id}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{maskCPF(student.cpf)}</TableCell>
                      <TableCell>{student.ra || '-'}</TableCell>
                      <TableCell>{student.phone ? maskPhone(student.phone) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {activeEnrollments.length > 0 && (
                            <Badge variant="default" className="text-xs">
                              {activeEnrollments.length} Confirmada(s)
                            </Badge>
                          )}
                          {waitlistEnrollments.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {waitlistEnrollments.length} Lista de espera
                            </Badge>
                          )}
                          {studentEnrollments.length === 0 && (
                            <span className="text-muted-foreground text-xs">Nenhuma inscrição</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="gap-1"
                          >
                            <PencilSimple className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStudent(student)}
                            className="gap-1"
                          >
                            <Trash className="h-3 w-3" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inscrições Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrollments.slice(-10).reverse().map((enrollment) => {
                const student = students.find(s => s.id.toString() === enrollment.studentId);
                const event = events.find(e => e.id === enrollment.eventId);
                
                return (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{student?.name || 'Aluno não encontrado'}</p>
                      <p className="text-sm text-muted-foreground">{event?.title || 'Evento não encontrado'}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={enrollment.status === 'confirmed' ? 'default' : 'outline'}
                      >
                        {enrollment.status === 'confirmed' ? 'Confirmada' :
                         enrollment.status === 'waitlist' ? 'Lista de espera' :
                         enrollment.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

