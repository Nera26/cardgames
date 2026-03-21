'use client';

import { ReactNode } from 'react';

export type StatusVariant =
    | 'active'
    | 'frozen'
    | 'banned'
    | 'pending'
    | 'running'
    | 'scheduled'
    | 'finished'
    | 'completed'
    | 'failed'
    | 'full'
    | 'inactive'
    | 'paused'
    | 'expired'
    | 'success'
    | 'warning'
    | 'rejected'
    | 'approved'
    | 'user'
    | 'admin'
    | 'superadmin';

interface StatusBadgeProps {
    status: StatusVariant;
    children?: ReactNode;
    className?: string;
}

const statusStyles: Record<StatusVariant, { bg: string; text: string; glow?: string }> = {
    active: { bg: 'bg-accent-green', text: 'text-white', glow: 'shadow-[0_0_20px_rgba(28,139,76,0.3)]' },
    frozen: { bg: 'bg-accent-yellow', text: 'text-black' },
    banned: { bg: 'bg-danger-red', text: 'text-white' },
    pending: { bg: 'bg-accent-yellow', text: 'text-black', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]' },
    running: { bg: 'bg-accent-green', text: 'text-white', glow: 'shadow-[0_0_20px_rgba(28,139,76,0.3)]' },
    scheduled: { bg: 'bg-accent-blue', text: 'text-white', glow: 'shadow-[0_0_20px_rgba(0,123,255,0.3)]' },
    finished: { bg: 'bg-text-secondary', text: 'text-black' },
    completed: { bg: 'bg-accent-green', text: 'text-white' },
    failed: { bg: 'bg-danger-red', text: 'text-white' },
    full: { bg: 'bg-accent-yellow', text: 'text-black' },
    inactive: { bg: 'bg-text-secondary', text: 'text-black' },
    paused: { bg: 'bg-text-secondary', text: 'text-black' },
    expired: { bg: 'bg-danger-red/30', text: 'text-danger-red' },
    success: { bg: 'bg-accent-green', text: 'text-white' },
    warning: { bg: 'bg-accent-yellow', text: 'text-black' },
    rejected: { bg: 'bg-danger-red', text: 'text-white' },
    approved: { bg: 'bg-accent-green', text: 'text-white' },
    // Roles
    user: { bg: 'bg-card-bg border border-border-dark', text: 'text-text-secondary' },
    admin: { bg: 'bg-accent-blue', text: 'text-white', glow: 'shadow-[0_0_10px_rgba(0,123,255,0.5)]' },
    superadmin: { bg: 'bg-accent-purple', text: 'text-white', glow: 'shadow-[0_0_15px_rgba(147,51,234,0.5)]' },
};

const statusLabels: Record<StatusVariant, string> = {
    active: 'Active',
    frozen: 'Frozen',
    banned: 'Banned',
    pending: 'Pending',
    running: 'Running',
    scheduled: 'Scheduled',
    finished: 'Finished',
    completed: 'Completed',
    failed: 'Failed',
    full: 'Full',
    inactive: 'Inactive',
    paused: 'Paused',
    expired: 'Expired',
    success: 'Success',
    warning: 'Warning',
    rejected: 'Rejected',
    approved: 'Approved',
    user: 'User',
    admin: 'Admin',
    superadmin: 'Super Admin',
};

export default function StatusBadge({ status, children, className = '' }: StatusBadgeProps) {
    const styles = statusStyles[status] || statusStyles.inactive;
    const label = children || statusLabels[status] || status;

    return (
        <span
            className={`
                ${styles.bg} ${styles.text} ${styles.glow || ''}
                px-2 py-1 rounded-lg text-xs font-semibold
                ${className}
            `}
        >
            {label}
        </span>
    );
}
