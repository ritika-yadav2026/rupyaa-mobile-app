import { z } from 'zod';
import { BANK_ACCOUNT_TYPE_VALUES, RELATIONSHIP_VALUES } from '@/src/types/kyc';

const emailSchema = z.string().min(1, 'Email is required').email('Enter a valid email');
const locationNameSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .regex(/^[A-Za-z0-9 ]+$/, `${fieldName} can contain only letters, numbers, and spaces`);

const addressLineSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .min(3, `${fieldName} must be at least 3 characters`)
    .max(100, `${fieldName} cannot exceed 100 characters`)
    .regex(
      /^(?=.*[A-Za-z0-9])[A-Za-z0-9\s,./#'()&-]+$/,
      `${fieldName} contains invalid characters`
    );

/**
 * alternate_mobile and officeEmail allow empty strings at the schema level
 * because their "required" status is driven by backend contactFieldOptions.
 * The component enforces required-ness via the button disabled state.
 */
export const contactDetailsSchema = z.object({
  email: emailSchema,
  alternate_mobile: z.string().refine(
    (val) => val === '' || /^[1-9]\d{9}$/.test(val),
    { message: 'Enter a valid 10-digit mobile number' }
  ),
  officeEmail: z.string().refine(
    (val) => {
      const trimmed = val.trim();
      return trimmed === '' || z.string().email().safeParse(trimmed).success;
    },
    { message: 'Enter a valid email' }
  ),
});

export const addressDetailsSchema = z.object({
  addressLine1: addressLineSchema('Address Line 1'),
  addressLine2: addressLineSchema('Address Line 2'),
  pinCode: z
    .string()
    .length(6, 'Pincode must be 6 digits')
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  city: locationNameSchema('City'),
  state: locationNameSchema('State'),
});

const phoneRegex = /^[1-9]\d{9}$/;

const relationshipEnum = z.enum(RELATIONSHIP_VALUES, {
  message: 'Please select a relationship',
});
const accountTypeEnum = z.enum(BANK_ACCOUNT_TYPE_VALUES, {
  message: 'Please select account type',
});

export const familyDetailsSchema = z
  .object({
    name: z.string().min(2, 'Name is required').trim(),
    relation: relationshipEnum.optional(),
    mobile: z
    .string()
    .length(10, 'Must be 10 digits')
    .regex(phoneRegex, 'Enter a valid mobile number'),
  })
  .refine((data) => data.relation != null, {
    message: 'Please select a relationship',
    path: ['relation'],
  });

export const referenceDetailsSchema = z.object({
  ref1Name: z.string().min(2, 'Name is required').trim(),
  ref1Mobile: z
    .string()
    .length(10, 'Must be 10 digits')
    .regex(phoneRegex, 'Enter a valid mobile number'),
  ref2Name: z.string().min(2, 'Name is required').trim(),
  ref2Mobile: z
    .string()
    .length(10, 'Must be 10 digits')
    .regex(phoneRegex, 'Enter a valid mobile number'),
});

/** IFSC: 4 letters + 0 + 6 alphanumeric. Validated after uppercase transform. */
export const bankDetailsSchema = z
  .object({
    accountNumber: z
      .string()
      .min(9, 'Account number must be at least 9 digits')
      .max(18, 'Account number cannot exceed 18 digits')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    confirmAccountNumber: z
      .string()
      .min(1, 'Please re-enter your account number'),
    accountHolderName: z
      .string()
      .trim()
      .min(2, 'Account holder name must be at least 2 characters')
      .max(100, 'Account holder name cannot exceed 100 characters')
      .refine((value) => /^[A-Za-z][A-Za-z\s.'-]*[A-Za-z]$/.test(value), {
        message: 'Enter a valid account holder name',
      }),
    accountType: accountTypeEnum,
    ifscCode: z
      .string()
      .length(11, 'IFSC code must be 11 characters')
      .transform((v) => v.toUpperCase())
      .refine((v) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v), 'Invalid IFSC code format'),
    bankName: z.string().min(2, 'Bank name is required').trim(),
    branchName: z.string().min(2, 'Branch name is required').trim(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmAccountNumber !== data.accountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account numbers do not match',
        path: ['confirmAccountNumber'],
      });
    }
  });

export type ContactDetailsSchema = z.infer<typeof contactDetailsSchema>;
export type AddressDetailsSchema = z.infer<typeof addressDetailsSchema>;
export type FamilyDetailsSchema = z.infer<typeof familyDetailsSchema>;
export type ReferenceDetailsSchema = z.infer<typeof referenceDetailsSchema>;
export type BankDetailsSchema = z.infer<typeof bankDetailsSchema>;
