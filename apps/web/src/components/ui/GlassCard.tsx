import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    hoverEffect = true,
    ...props
}) => {
    return (
        <div
            className={cn(
                "relative bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-5",
                "flex flex-col justify-between font-sans shadow-2xl transition-all duration-300 group",
                hoverEffect && "hover:bg-surface-hover/60 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
