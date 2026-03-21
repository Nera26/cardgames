import React from 'react';
import { FilterType } from '@/hooks/useFinanceData';

interface FinanceFiltersProps {
    active: FilterType;
    onChange: (filter: FilterType) => void;
}

const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'deposits', label: 'Deposits' },
    { type: 'withdrawals', label: 'Withdrawals' },
    { type: 'manual', label: 'Manual Adjustments' },
];

export default function FinanceFilters({ active, onChange }: FinanceFiltersProps) {
    return (
        <section className="flex gap-3">
            {filterButtons.map((btn) => (
                <button
                    key={btn.type}
                    onClick={() => onChange(btn.type)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${active === btn.type
                        ? 'bg-accent-yellow text-black'
                        : 'bg-hover-bg text-white hover:bg-accent-green hover:text-white'
                        }`}
                >
                    {btn.label}
                </button>
            ))}
        </section>
    );
}
