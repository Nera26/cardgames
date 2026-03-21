import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface StatCardProps {
    title: string;
    value: string;
    trend?: string;
    trendColor?: 'green' | 'yellow' | 'red' | 'blue' | 'default';
    icon: IconDefinition;
    iconColor: string;
    onClick?: () => void;
}

export default function StatCard({
    title,
    value,
    trend,
    trendColor = 'default',
    icon,
    iconColor,
    onClick,
}: StatCardProps) {
    const trendColorClasses: Record<string, string> = {
        green: 'text-accent-green',
        yellow: 'text-accent-yellow',
        red: 'text-danger-red',
        blue: 'text-accent-blue',
        default: 'text-text-secondary',
    };

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={`
        bg-card-bg p-6 rounded-2xl shadow-lg
        ${onClick ? 'cursor-pointer hover:bg-hover-bg transition-colors' : ''}
      `}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-text-secondary text-sm">{title}</p>
                    <p className={`text-2xl font-bold ${iconColor}`}>{value}</p>
                    {trend && (
                        <p className={`text-xs ${trendColorClasses[trendColor]}`}>{trend}</p>
                    )}
                </div>
                <FontAwesomeIcon icon={icon} className={`text-3xl ${iconColor}`} />
            </div>
        </Component>
    );
}
