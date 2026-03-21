import React from 'react';
import { cn } from '@/lib/utils';

interface StateWrapperProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const StateWrapper: React.FC<StateWrapperProps> = ({
    children,
    className,
    maxWidth = 'lg'
}) => {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    return (
        <section className="min-h-[calc(80vh-80px)] flex flex-col items-center justify-center text-center py-16 px-4">
            <div
                className={cn(
                    "bg-card-bg p-8 sm:p-12 rounded-2xl shadow-xl w-full transition-all duration-300",
                    maxWidthClasses[maxWidth],
                    className
                )}
            >
                {children}
            </div>
        </section>
    );
};
