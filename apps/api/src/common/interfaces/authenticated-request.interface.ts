
import { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    role: string;
    isVerified: boolean;
    userId?: string; // Add alias if some code uses it, though Strategy returns 'id'
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}
