import { Request } from 'express';
export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    role: string;
    isVerified: boolean;
    userId?: string;
}
export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
