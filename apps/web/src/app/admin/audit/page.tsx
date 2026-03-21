'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList,
    faRefresh,
    faSort,
    faShieldAlt,
    faFlag,
    faDownload
} from '@fortawesome/free-solid-svg-icons';
import api from '@/lib/api';
import StatusBadge from '@/components/admin/StatusBadge';
import Pagination from '@/components/admin/Pagination';

interface AuditLog {
    id: string;
    action: string;
    userId: string;
    ipAddress: string | null;
    createdAt: string;
    user: {
        username: string;
        email: string;
    };
    payload: any;
}

// Map action types to display colors
function getActionColor(action: string): string {
    if (action.includes('DEPOSIT') || action.includes('ADD')) return 'text-accent-green';
    if (action.includes('WITHDRAW') || action.includes('REMOVE')) return 'text-danger-red';
    if (action.includes('BAN')) return 'text-danger-red';
    if (action.includes('TABLE') || action.includes('SETTING') || action.includes('CONFIG')) return 'text-accent-yellow';
    if (action.includes('APPROVAL') || action.includes('APPROVED')) return 'text-accent-blue';
    return 'text-accent-blue';
}

// Determine status from action/payload
function getStatus(action: string): 'success' | 'warning' | 'failed' {
    if (action.includes('FAILED') || action.includes('ERROR')) return 'failed';
    if (action.includes('SETTING') || action.includes('CONFIG') || action.includes('CHANGE')) return 'warning';
    return 'success';
}

export default function AdminAuditPage() {
    const { user, isAuthenticated } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [dateFilter, setDateFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [performerFilter, setPerformerFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');

    const fetchLogs = async (currentPage: number) => {
        setIsLoading(true);
        try {
            const { data } = await api.get(`/admin/audit?page=${currentPage}&limit=10`);
            setLogs(data.data);
            setTotalPages(data.meta.totalPages);
            setTotalCount(data.meta.total);
        } catch (error) {
            console.error('Error fetching logs', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchLogs(page);
        }
    }, [isAuthenticated, page]);

    const handleApplyFilters = () => {
        fetchLogs(1);
        setPage(1);
    };

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-danger-red text-4xl mb-4" />
                    <h2 className="text-xl font-bold text-danger-red">Access Denied</h2>
                    <p className="text-text-secondary mt-2">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Date Range</label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Action Type</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="add-balance">Add Balance</option>
                            <option value="remove-balance">Remove Balance</option>
                            <option value="withdrawal">Withdrawal Approval</option>
                            <option value="ban">Ban User</option>
                            <option value="table">New Table Created</option>
                            <option value="settings">Setting Change</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Performed By</label>
                        <select
                            value={performerFilter}
                            onChange={(e) => setPerformerFilter(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        >
                            <option value="">All</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-text-secondary mb-2">Affected User</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleApplyFilters}
                            className="w-full bg-accent-blue hover:shadow-[0_0_20px_rgba(0,123,255,0.3)] py-2 rounded-xl font-semibold transition-all duration-200"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </section>

            {/* System Audit Log Table */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">System Audit Log</h3>
                    <div className="flex gap-2">
                        <button className="bg-accent-yellow hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] text-black px-4 py-2 rounded-xl font-semibold text-sm transition-all">
                            <FontAwesomeIcon icon={faDownload} className="mr-2" />Export
                        </button>
                        <button
                            onClick={() => fetchLogs(page)}
                            className="bg-card-bg hover:bg-hover-bg border border-border-dark px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                        >
                            <FontAwesomeIcon icon={faRefresh} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border-dark">
                                    <th className="text-left py-3 px-2 text-text-secondary cursor-pointer hover:text-accent-yellow">
                                        Timestamp <FontAwesomeIcon icon={faSort} className="ml-1" />
                                    </th>
                                    <th className="text-left py-3 px-2 text-text-secondary cursor-pointer hover:text-accent-yellow">
                                        Admin <FontAwesomeIcon icon={faSort} className="ml-1" />
                                    </th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Affected User</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Action Type</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Description</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-text-secondary">Loading audit logs...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-text-secondary">
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="border-b border-border-dark hover:bg-hover-bg">
                                        <td className="py-3 px-2 text-text-secondary">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center font-bold text-xs text-accent-blue">
                                                    {log.user?.username?.charAt(0)?.toUpperCase() || 'S'}
                                                </div>
                                                <span>{log.user?.username || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">{log.payload?.affectedUser || '-'}</td>
                                        <td className="py-3 px-2">
                                            <span className={getActionColor(log.action)}>{log.action}</span>
                                        </td>
                                        <td className="py-3 px-2 max-w-xs truncate" title={log.payload?.description || JSON.stringify(log.payload)}>
                                            {log.payload?.description || JSON.stringify(log.payload).substring(0, 50)}
                                        </td>
                                        <td className="py-3 px-2">
                                            <StatusBadge status={getStatus(log.action)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <span className="text-text-secondary text-sm">
                        Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalCount)} of {totalCount} logs
                    </span>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </section>

            {/* Admin Activity Overview */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Admin Activity Overview</h3>
                    <button className="bg-accent-blue hover:shadow-[0_0_20px_rgba(0,123,255,0.3)] px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200">
                        View Full Activity
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border-dark">
                                    <th className="text-left py-3 px-2 text-text-secondary">Admin Name</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Last Action</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Total Actions (24h)</th>
                                    <th className="text-left py-3 px-2 text-text-secondary">Login History</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-border-dark hover:bg-hover-bg cursor-pointer">
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-accent-yellow/20 flex items-center justify-center font-bold text-sm text-accent-yellow">
                                                S
                                            </div>
                                            <span className="font-semibold hover:text-accent-yellow">SuperAdmin</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-text-secondary">Balance adjustment - 2 mins ago</td>
                                    <td className="py-3 px-2 font-semibold text-accent-green">47</td>
                                    <td className="py-3 px-2 text-text-secondary">2024-01-15 08:30 - Active</td>
                                </tr>
                                <tr className="border-b border-border-dark hover:bg-hover-bg cursor-pointer">
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center font-bold text-sm text-accent-blue">
                                                A
                                            </div>
                                            <span className="font-semibold hover:text-accent-yellow">Admin_2</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-text-secondary">Withdrawal approval - 1 hour ago</td>
                                    <td className="py-3 px-2 font-semibold text-accent-green">23</td>
                                    <td className="py-3 px-2 text-text-secondary">2024-01-15 14:15 - Active</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Site Configuration Logs */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Site Configuration Logs</h3>
                <div className="space-y-3">
                    <div className="p-4 bg-hover-bg rounded-xl border-l-4 border-accent-yellow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Max Buy-in</p>
                                <p className="text-sm text-text-secondary">
                                    <span className="text-danger-red">$1,000</span> → <span className="text-accent-green">$2,000</span>
                                </p>
                            </div>
                            <div className="text-right text-sm text-text-secondary">
                                <p>Changed by <span className="text-accent-blue">Admin_2</span></p>
                                <p>2024-01-15 14:55:18</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-hover-bg rounded-xl border-l-4 border-accent-blue">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Rake Percentage</p>
                                <p className="text-sm text-text-secondary">
                                    <span className="text-danger-red">4.5%</span> → <span className="text-accent-green">5.0%</span>
                                </p>
                            </div>
                            <div className="text-right text-sm text-text-secondary">
                                <p>Changed by <span className="text-accent-blue">SuperAdmin</span></p>
                                <p>2024-01-14 16:30:45</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security Alert Feed */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faShieldAlt} className="text-danger-red" />
                    Security Alert Feed
                </h3>
                <div className="space-y-3">
                    <div className="p-4 bg-danger-red/10 border border-danger-red rounded-xl">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faFlag} className="text-danger-red" />
                            <div className="flex-1">
                                <p className="font-semibold text-danger-red">Bank Account Mismatch</p>
                                <p className="text-sm text-text-secondary">User Mike_P attempted withdrawal to unverified bank account</p>
                                <p className="text-xs text-text-secondary">2024-01-15 18:30:22</p>
                            </div>
                            <button className="bg-danger-red hover:shadow-[0_0_20px_rgba(255,77,79,0.3)] px-3 py-1 rounded text-xs font-semibold transition-all duration-200">
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-accent-yellow/10 border border-accent-yellow rounded-xl">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faFlag} className="text-accent-yellow" />
                            <div className="flex-1">
                                <p className="font-semibold text-accent-yellow">Multiple Login Attempts</p>
                                <p className="text-sm text-text-secondary">5 failed login attempts for user Alex_R from different IPs</p>
                                <p className="text-xs text-text-secondary">2024-01-15 17:45:12</p>
                            </div>
                            <button className="bg-accent-yellow hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] text-black px-3 py-1 rounded text-xs font-semibold transition-all duration-200">
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-danger-red/10 border border-danger-red rounded-xl">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faFlag} className="text-danger-red" />
                            <div className="flex-1">
                                <p className="font-semibold text-danger-red">Withdrawal Over Balance</p>
                                <p className="text-sm text-text-secondary">User Sarah_K attempted to withdraw $1,500 with only $750 balance</p>
                                <p className="text-xs text-text-secondary">2024-01-15 16:22:45</p>
                            </div>
                            <button className="bg-danger-red hover:shadow-[0_0_20px_rgba(255,77,79,0.3)] px-3 py-1 rounded text-xs font-semibold transition-all duration-200">
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
