import { useState, useEffect } from 'react';
import { Student } from '@/lib/types';
import { ApiService, CreateStudentRequest, UpdateStudentRequest } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudents = async (query = searchQuery, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.listStudents(query, page, 20);
      setStudents(response || []);
      setTotalStudents(response?.length || 0);
      setCurrentPage(page);
      setSearchQuery(query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estudantes';
      setError(errorMessage);
      showError('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData: CreateStudentRequest): Promise<Student | null> => {
    try {
      const newStudent = await ApiService.createStudent(studentData);
      // Refresh the list to show the new student
      await fetchStudents();
      showSuccess('Estudante criado', 'Estudante criado com sucesso');
      return newStudent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar estudante';
      showError('Erro', errorMessage);
      return null;
    }
  };

  const updateStudent = async (id: number, studentData: UpdateStudentRequest): Promise<Student | null> => {
    try {
      const updatedStudent = await ApiService.updateStudent(id.toString(), studentData);
      // Update the student in the local list
      setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
      showSuccess('Estudante atualizado', 'Estudante atualizado com sucesso');
      return updatedStudent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar estudante';
      showError('Erro', errorMessage);
      return null;
    }
  };

  const deleteStudent = async (id: number): Promise<boolean> => {
    try {
      await ApiService.deleteStudent(id.toString());
      // Remove student from local list
      setStudents(prev => prev.filter(s => s.id !== id));
      setTotalStudents(prev => prev - 1);
      showSuccess('Estudante excluído', 'Estudante excluído com sucesso');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir estudante';
      showError('Erro', errorMessage);
      return false;
    }
  };

  const searchStudents = async (query: string) => {
    setCurrentPage(1);
    await fetchStudents(query, 1);
  };

  const loadPage = async (page: number) => {
    await fetchStudents(searchQuery, page);
  };

  const searchStudentById = async (id: string): Promise<Student | null> => {
    try {
      setLoading(true);
      setError(null);
      const student = await ApiService.getStudent(id);
      // Replace the students list with just the found student for display
      setStudents([student]);
      setTotalStudents(1);
      setCurrentPage(1);
      setSearchQuery(`ID: ${id}`);
      return student;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Estudante não encontrado';
      setError(errorMessage);
      setStudents([]);
      setTotalStudents(0);
      showError('Erro', errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  return {
    students,
    loading,
    error,
    totalStudents,
    currentPage,
    searchQuery,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    searchStudents,
    searchStudentById,
    loadPage,
  };
}