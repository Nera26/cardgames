import React from 'react';
import { cn } from '@/lib/utils';
import { useUI, TableSkin } from '@/contexts/UIContext';

type ActionVariant = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

interface GameActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant: ActionVariant;
    fullWidth?: boolean;
}

// 🟣 Purple Cable: Raise button gradient adapts to table skin
const RAISE_THEME: Record<TableSkin, string> = {
    green:    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border-t border-white/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    blue:     "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg border-t border-white/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    red:      "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg border-t border-white/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    midnight: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg border-t border-white/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
};

export const GameActionButton: React.FC<GameActionButtonProps> = ({
    variant,
    className,
    children,
    fullWidth = true,
    ...props
}) => {
    const { tableSkin } = useUI();

    const baseStyles = "rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wide active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed touch-manipulation";

    const variants: Record<ActionVariant, string> = {
        fold: "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-transparent",
        check: "bg-slate-500/10 text-slate-300 border border-slate-500/20 hover:bg-slate-500 hover:text-white hover:border-transparent",
        call: "bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500 hover:text-white hover:border-transparent",
        raise: RAISE_THEME[tableSkin],
        "all-in": "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-lg border-t border-white/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]"
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                fullWidth ? "flex-1" : "",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

