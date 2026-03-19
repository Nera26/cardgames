import { z } from 'zod';
export declare const bankConfigSchema: z.ZodObject<{
    iban: z.ZodString;
    bic: z.ZodOptional<z.ZodString>;
    bankName: z.ZodString;
    holderName: z.ZodString;
    instructions: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type BankConfigDto = z.infer<typeof bankConfigSchema>;
export declare const bankHistorySchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    oldIban: z.ZodString;
    newIban: z.ZodString;
    updatedBy: z.ZodString;
    adminAvatar: z.ZodOptional<z.ZodString>;
    notes: z.ZodString;
}, z.core.$strip>;
export type BankHistoryResponseDto = z.infer<typeof bankHistorySchema>;
