'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PlayerAction = 'CHECK' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN' | 'BET';

interface ActionBadgeProps {
    action: PlayerAction | null | undefined;
}

const ACTION_STYLES: Record<PlayerAction, { bg: string; text: string; border: string; label: string }> = {
    FOLD: {
        bg: 'bg-red-600',
        text: 'text-white',
        border: 'border-red-800',
        label: 'FOLD',
    },
    CHECK: {
        bg: 'bg-blue-500',
        text: 'text-white',
        border: 'border-blue-700',
        label: 'CHECK',
    },
    CALL: {
        bg: 'bg-emerald-500',
        text: 'text-white',
        border: 'border-emerald-700',
        label: 'CALL',
    },
    BET: {
        bg: 'bg-amber-500',
        text: 'text-black',
        border: 'border-amber-700',
        label: 'BET',
    },
    RAISE: {
        bg: 'bg-amber-500',
        text: 'text-black',
        border: 'border-amber-700',
        label: 'RAISE',
    },
    ALL_IN: {
        bg: 'bg-purple-600',
        text: 'text-white',
        border: 'border-purple-800',
        label: 'ALL IN 🔥',
    },
};

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action }) => {
    if (!action) return null;

    const style = ACTION_STYLES[action];
    if (!style) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={action}
                className={`
                    ${style.bg} ${style.text} ${style.border}
                    px-2.5 py-0.5
                    rounded-full
                    border
                    text-[9px] font-extrabold uppercase tracking-wider
                    whitespace-nowrap
                    shadow-lg
                    pointer-events-none
                    select-none
                `}
                initial={{ scale: 0, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 20,
                }}
            >
                {style.label}
            </motion.div>
        </AnimatePresence>
    );
};
