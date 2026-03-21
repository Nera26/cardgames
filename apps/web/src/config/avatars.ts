/**
 * Avatar Configuration
 * 
 * Maps avatar IDs to character image URLs.
 * Using DiceBear adventurer style for the preset library.
 */

export const AVATARS = {
    avatar_1: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
    avatar_2: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka',
    avatar_3: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Leo',
    avatar_4: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Luna',
    avatar_5: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver',
    avatar_6: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Milo',
    avatar_7: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Zoe',
    avatar_8: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jasper',
    avatar_9: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ruby',
    avatar_10: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Finn',
} as const;

export type AvatarId = keyof typeof AVATARS;

export const DEFAULT_AVATAR = AVATARS.avatar_1;

/**
 * Get avatar URL.
 * Priority: custom avatarUrl (uploaded WebP) → persona avatarId → default.
 */
export function getAvatarUrl(avatarIdOrUrl: string | null | undefined, avatarUrl?: string | null): string {
    // Custom uploaded avatar takes priority
    if (avatarUrl && (avatarUrl.startsWith('/api/') || avatarUrl.startsWith('http'))) {
        // For /api/ paths, prepend the API base URL
        if (avatarUrl.startsWith('/api/')) {
            const apiBase = typeof window !== 'undefined' 
                ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
                : '';
            return `${apiBase}${avatarUrl}`;
        }
        return avatarUrl;
    }

    // DiceBear persona lookup
    if (avatarIdOrUrl && avatarIdOrUrl in AVATARS) {
        return AVATARS[avatarIdOrUrl as AvatarId];
    }

    return DEFAULT_AVATAR;
}
