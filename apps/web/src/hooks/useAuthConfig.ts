import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface AuthConfig {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    socialLogin: string[];
    passwordPolicy: {
        minLength: number;
    };
}

export const useAuthConfig = () => {
    return useQuery<AuthConfig>({
        queryKey: ['authConfig'],
        queryFn: async () => {
            const { data } = await api.get('/config/auth');
            return data;
        },
    });
};
