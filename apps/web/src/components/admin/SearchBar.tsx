'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

interface SearchBarProps {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export default function SearchBar({
    placeholder = 'Search...',
    value = '',
    onChange,
    className = '',
}: SearchBarProps) {
    return (
        <div className={`relative ${className}`}>
            <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
            />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className="w-full bg-card-bg border border-border-dark rounded-xl pl-10 pr-4 py-3 text-sm focus:border-accent-yellow focus:outline-none focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
            />
        </div>
    );
}
