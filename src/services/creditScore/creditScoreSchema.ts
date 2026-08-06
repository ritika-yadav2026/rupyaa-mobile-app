import { z } from 'zod';

// PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const mobileRegex = /^[1-9]\d{9}$/;

export const creditScoreSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Name is required')
    .refine((value) => /^[A-Za-z][A-Za-z\s.'-]*[A-Za-z]$/.test(value), {
      message: 'Enter a valid full name',
    }),
  panNumber: z
    .string()
    .transform((s) => s?.toUpperCase().replace(/\s/g, '') ?? '')
    .refine((s) => panRegex.test(s), 'Invalid PAN format'),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use dd/mm/yyyy format'),
  mobileNumber: z
    .string()
    .length(10, 'Must be 10 digits')
    .regex(mobileRegex, 'Enter a valid mobile number'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  consent: z.boolean().refine((v) => v === true, 'You must agree to the Terms of Service'),
});

export type CreditScoreFormData = z.input<typeof creditScoreSchema>;
