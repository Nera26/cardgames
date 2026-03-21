'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type FilterPeriod = 'today' | 'week' | 'month' | 'all';

interface FilterData {
    value: string;
    trend: string;
}

interface FilterableStatCardProps {
    title: string;
    icon: IconDefinition;
    iconColor: string;
    trendColor: 'green' | 'yellow' | 'red';
    data: Record<FilterPeriod, FilterData>;
    onClick?: () => void;
}

const filterLabels: Record<FilterPeriod, string> = {
    today: 'Today',
    week: '7 Days',
    month: 'Month',
    all: 'All-Time',
};

export default function FilterableStatCard({
    title,
    icon,
    iconColor,
    trendColor,
    data,
    onClick,
}: FilterableStatCardProps) {
    const [filter, setFilter] = useState<FilterPeriod>('today');

    const trendColorClasses: Record<string, string> = {
        green: 'text-accent-green',
        yellow: 'text-accent-yellow',
        red: 'text-danger-red',
    };

    const selectColorClasses: Record<string, string> = {
        green: 'text-accent-green border-accent-green',
        yellow: 'text-accent-yellow border-accent-yellow',
        red: 'text-danger-red border-danger-red',
    };

    const currentData = data[filter];

    return (
        <div
            onClick={onClick}
            className={`
        bg-card-bg p-6 rounded-2xl shadow-lg
        ${onClick ? 'cursor-pointer hover:bg-hover-bg transition-colors' : ''}
      `}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-text-secondary text-sm">{title}</p>
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-2xl font-bold ${iconColor}`}>{currentData.value}</p>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterPeriod)}
                            onClick={(e) => e.stopPropagation()}
                            className={`bg-primary-bg text-xs px-2 py-1 rounded border cursor-pointer ${selectColorClasses[trendColor]}`}
                        >
                            {Object.entries(filterLabels).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className={`text-xs ${trendColorClasses[trendColor]}`}>{currentData.trend}</p>
                </div>
                <FontAwesomeIcon icon={icon} className={`text-3xl ${iconColor}`} />
            </div>
        </div>
    );
}
