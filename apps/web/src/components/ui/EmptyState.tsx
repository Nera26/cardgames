import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils';

export type StateVariant = 'yellow' | 'blue' | 'green' | 'red' | 'gray';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: IconDefinition;
    variant?: StateVariant;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    variant = 'gray',
    action,
    className,
}) => {
    const variantClasses = {
        yellow: {
            icon: 'text-accent-yellow',
            glow: 'hover-glow-yellow',
            button: 'border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-primary-bg'
        },
        blue: {
            icon: 'text-accent-blue',
            glow: 'hover-glow-blue', // Assuming we add this to globals or keep it simple
            button: 'bg-accent-blue text-text-primary hover:brightness-110'
        },
        green: {
            icon: 'text-accent-green',
            glow: 'hover-glow-green',
            button: 'bg-accent-green text-text-primary hover:brightness-110'
        },
        red: {
            icon: 'text-danger-red',
            glow: '',
            button: 'bg-danger-red text-text-primary hover:brightness-110'
        },
        gray: {
            icon: 'text-text-secondary',
            glow: '',
            button: 'bg-hover-bg text-text-primary hover:brightness-110'
        }
    };

    const colors = variantClasses[variant];

    return (
        <div className={cn("flex flex-col items-center text-center", className)}>
            <FontAwesomeIcon
                icon={icon}
                className={cn("text-6xl sm:text-7xl mb-6 opacity-80", colors.icon)}
            />
            <h3 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
                {title}
            </h3>
            <p className="text-text-secondary text-base sm:text-lg mb-8 max-w-md">
                {description}
            </p>
            {action && (
                <div className="w-full sm:w-auto">
                    {React.isValidElement(action) && action.type === 'button' ? (
                        React.cloneElement(action as React.ReactElement<any>, {
                            className: cn(
                                "font-bold py-3 px-8 rounded-xl transition-all duration-200 text-base sm:text-lg uppercase",
                                colors.button,
                                (action.props as any).className
                            )
                        })
                    ) : (
                        action
                    )}
                </div>
            )}
        </div>
    );
};
