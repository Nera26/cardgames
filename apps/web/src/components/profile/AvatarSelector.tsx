'use client';

import React from 'react';
import { AVATARS, AvatarId } from '@/config/avatars';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarSelectorProps {
    currentAvatarId: string;
    onSelect: (avatarId: AvatarId) => void;
    disabled?: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
    currentAvatarId,
    onSelect,
    disabled = false,
}) => {
    return (
        <div className="grid grid-cols-5 gap-4">
            {(Object.keys(AVATARS) as AvatarId[]).map((id) => {
                const isSelected = id === currentAvatarId;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => !disabled && onSelect(id)}
                        disabled={disabled}
                        className={cn(
                            "relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 group",
                            isSelected
                                ? "border-poker-gold bg-poker-gold/10 ring-2 ring-poker-gold/50"
                                : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <div className="absolute inset-0 p-1">
                            <img
                                src={AVATARS[id]}
                                alt={`Avatar ${id}`}
                                className={cn(
                                    "w-full h-full object-cover transition-transform duration-300",
                                    !isSelected && "group-hover:scale-110"
                                )}
                            />
                        </div>

                        {isSelected && (
                            <div className="absolute top-1 right-1 bg-poker-gold rounded-full p-0.5 shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
