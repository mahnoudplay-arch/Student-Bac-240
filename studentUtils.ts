import { UserProfile } from '../types';

/**
 * Derives a clean, official Academic Student ID (معرف الطالب)
 * e.g. STU-240-3456 instead of the raw activation voucher code (e.g. BAC-2026-SAIBAA-DEMO).
 */
export function getStudentDisplayId(user: Partial<UserProfile> | null | undefined): string {
  if (!user) return 'STU-240-2026';

  // If user already has a distinct, valid student ID
  if (user.id && user.id !== user.studentCode && !user.id.startsWith('BAC-202')) {
    return user.id;
  }

  // Derive from phone number if available (last 4 digits)
  if (user.phoneNumber) {
    const digits = user.phoneNumber.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `STU-240-${digits.slice(-4)}`;
    }
  }

  // Fallback: derive from activation code
  if (user.studentCode) {
    const parts = user.studentCode.split('-');
    const lastPart = parts[parts.length - 1] || '2026';
    return `STU-240-${lastPart.slice(-4)}`;
  }

  return 'STU-240-2026';
}
