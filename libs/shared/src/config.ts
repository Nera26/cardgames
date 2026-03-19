import { z } from 'zod';


export const bankConfigSchema = z.object({
  iban: z.string().min(10, "IBAN is too short").max(34, "IBAN is too long"),
  bic: z.string().optional(),
  bankName: z.string().min(1, "Bank Name is required"),
  holderName: z.string().min(1, "Account Holder Name is required"),
  instructions: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type BankConfigDto = z.infer<typeof bankConfigSchema>;

export const bankHistorySchema = z.object({
  id: z.string(),
  date: z.string(),
  oldIban: z.string(),
  newIban: z.string(),
  updatedBy: z.string(),
  adminAvatar: z.string().optional(),
  notes: z.string(),
});

export type BankHistoryResponseDto = z.infer<typeof bankHistorySchema>;
