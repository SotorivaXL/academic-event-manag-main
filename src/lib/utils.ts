import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(value: string): string {
  const numericValue = value.replace(/\D/g, '')
  if (numericValue.length <= 7) return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`
  return `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`
}

export function validateCPF(cpf: string): boolean {
  const numericCPF = cpf.replace(/\D/g, '')
  
  if (numericCPF.length !== 11) return false
  if (/^(\d)\1+$/.test(numericCPF)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numericCPF[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numericCPF[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numericCPF[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numericCPF[10])) return false
  
  return true
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const numericPhone = phone.replace(/\D/g, '')
  return numericPhone.length >= 10 && numericPhone.length <= 11
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function calculateAttendancePercentage(attendances: Array<{ isValid: boolean }>): number {
  if (attendances.length === 0) return 0
  const validAttendances = attendances.filter(a => a.isValid)
  return Math.round((validAttendances.length / attendances.length) * 100)
}

export const isValidCPF = validateCPF
export const isValidEmail = validateEmail
export const isValidPhone = validatePhone

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function formatTime(timeString: string): string {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).toUpperCase().substr(2, 8)
}

export function isEligibleForCertificate(attendancePercentage: number, minRequired: number = 75): boolean {
  return attendancePercentage >= minRequired
}

export function maskCPF(cpf: string): string {
  const numericCPF = cpf.replace(/\D/g, '')
  if (numericCPF.length <= 3) return numericCPF
  if (numericCPF.length <= 6) return `${numericCPF.slice(0, 3)}.${numericCPF.slice(3)}`
  if (numericCPF.length <= 9) return `${numericCPF.slice(0, 3)}.${numericCPF.slice(3, 6)}.${numericCPF.slice(6)}`
  return `${numericCPF.slice(0, 3)}.${numericCPF.slice(3, 6)}.${numericCPF.slice(6, 9)}-${numericCPF.slice(9, 11)}`
}

export function maskPhone(phone: string): string {
  return formatPhone(phone)
}

export function removeCPFMask(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function removePhoneMask(phone: string): string {
  return phone.replace(/\D/g, '')
}
