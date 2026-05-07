import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// src/lib/utils.ts
export function formatPhoneNumber(phone: string): string {
  // Elimina todo lo que no sea número
  const cleaned = ('' + phone).replace(/\D/g, '');

  // Aplica formato (123) 456-7890 si tiene 10 dígitos
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  // Si no cumple con el patrón, devuelve el original
  return phone;
}
