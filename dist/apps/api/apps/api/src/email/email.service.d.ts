export declare class EmailService {
    private readonly logger;
    sendPasswordResetEmail(email: string, code: string): Promise<void>;
}
