import { formatCurrency } from './common-helper';

/**
 * Formats a full name from firstName, middleName, and lastName.
 * Handles empty/missing parts gracefully.
 */
export function formatFullName(
  firstName?: string,
  middleName?: string,
  lastName?: string,
): string {
  const parts = [firstName, middleName, lastName].filter(
    (part) => part && part.trim().length > 0,
  );
  return parts.join(' ').trim() || 'N/A';
}

/**
 * Gets initials from a full name string.
 */
export function getInitials(name: string): string {
  if (!name) return 'Z';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Formats ISO date string (e.g., "1985-11-30T00:00:00.000Z") to DD/MM/YYYY.
 */
export function formatDateOfBirth(dob?: string): string {
  if (!dob) return 'N/A';
  try {
    const date = new Date(dob);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
}

/**
 * Formats gender string to title case (e.g., "male" -> "Male").
 */
export function formatGender(gender?: string): string {
  if (!gender) return 'N/A';
  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

/**
 * Formats employment mode to title case (e.g., "salaried" -> "Salaried").
 */
export function formatEmploymentMode(mode?: string): string {
  if (!mode) return 'N/A';
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
}

/**
 * Formats salary value (number or string) to currency string.
 */
export function formatSalary(salary?: number | string): string {
  if (salary === undefined) return 'N/A';
  const numericValue = typeof salary === 'string' ? parseFloat(salary) : salary;
  if (isNaN(numericValue)) return 'N/A';
  return formatCurrency(numericValue);
}
