import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function validatePesel(pesel: string): boolean {
  if (!pesel || pesel.length !== 11) return false;
  if (!/^\d{11}$/.test(pesel)) return false;

  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel[i]) * weights[i];
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(pesel[10]);
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}


export function formatPeselMasked(pesel: string): string {
  if (!pesel || pesel.length !== 11) return pesel;
  return `XXX-XXX-XX-${pesel.slice(-3)}`;
}


export function validatePostalCode(postalCode: string): boolean {
  return /^\d{2}-\d{3}$/.test(postalCode);
}

export function formatPostalCode(postalCode: string): string {
  const digits = postalCode.replace(/\D/g, '');
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return postalCode;
}

