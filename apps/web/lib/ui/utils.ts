import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes correctly
 * @param inputs Array of class names or conditional class name objects
 * @returns Single merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
