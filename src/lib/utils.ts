import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type ClassValue = string | number | boolean | undefined | null | { [key: string]: any };