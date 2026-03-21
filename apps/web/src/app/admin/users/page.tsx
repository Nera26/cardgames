'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faCoins,
    faScroll,
    faCheck,
    faExclamationTriangle,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import DataTable, { Column } from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import SearchBar from '@/components/admin/SearchBar';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import { useAdminUsers } from '@/hooks/useAdminUsers';

import { UserResponse, TIER_CONFIG, CreateUserDto, AdminUpdateUserDto } from '@poker/shared';
import { getAvatarUrl } from '@/config/avatars';
import { sampleTransactions, Transaction } from '@/data/admin/mockData';

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: 'createdAt' | 'balance'; direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    });

    // Form State
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('USER');
    const [status, setStatus] = useState('active');
    const [balance, setBalance] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
    const [balanceError, setBalanceError] = useState('');

    // Sync state when selectedUser changes
    useEffect(() => {
        if (selectedUser) {
            setUsername(selectedUser.username);
            setEmail(selectedUser.email);
            setRole(selectedUser.role);
            setStatus(selectedUser.isBanned ? 'banned' : 'active');
        } else {
            // Reset is handled by "Add User" button, but good to have defaults
            // setUsername(''); setEmail(''); setRole('USER');
        }
    }, [selectedUser]);

    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch users from API
    const { users, total, totalPages, isLoading, error, refetch, banUser, unbanUser } = useAdminUsers({
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        sortBy: sortConfig.key,
        order: sortConfig.direction,
    });

    // Real Transaction State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loadingTx, setLoadingTx] = useState(false);

    // Fetch transactions when history modal opens
    useEffect(() => {
        if (isHistoryModalOpen && selectedUser) {
            setLoadingTx(true);
            api.get(`/admin/wallet/transactions?userId=${selectedUser.id}`)
                .then(res => setTransactions(res.data.data))
                .catch(err => console.error(err))
                .finally(() => setLoadingTx(false));
        }
    }, [isHistoryModalOpen, selectedUser]);

    // Format currency helper
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Withdrawal columns


    // User columns - adapted for API UserResponse
    const userColumns: Column<UserResponse>[] = [
        {
            key: 'id',
            header: 'ID',
            width: '0.5fr',
            render: (row) => <span className="text-sm text-text-secondary">{row.id.slice(0, 8)}...</span>
        },
        {
            key: 'name',
            header: 'Name',
            width: '2fr',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <img
                        src={getAvatarUrl(row.avatarId, row.avatarUrl)}
                        alt={row.username}
                        className="w-10 h-10 rounded-full object-cover border border-border-light"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = getAvatarUrl(row.avatarId);
                        }}
                    />
                    <div>
                        <p className="font-semibold">{row.username}</p>
                        <p className="text-xs text-text-secondary">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'tier',
            header: 'Tier',
            width: '1fr',
            render: (row) => (
                <span
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: TIER_CONFIG[row.tier]?.color ?? '#333', color: row.tier === 'GOLD' ? '#000' : '#fff' }}
                >
                    {TIER_CONFIG[row.tier]?.label ?? row.tier}
                </span>
            )
        },
        {
            key: 'balance',
            header: 'Balance',
            width: '1fr',
            render: (row) => (
                <span className={`font-bold ${row.balance > 0 ? 'text-accent-green' : 'text-text-secondary'}`}>
                    {formatCurrency(row.balance)}
                </span>
            )
        },
        {
            key: 'role',
            header: 'Role',
            width: '0.8fr',
            render: (row) => <StatusBadge status={row.role.toLowerCase() as any} />
        },
        {
            key: 'status',
            header: 'Status',
            width: '0.8fr',
            render: (row) => <StatusBadge status={row.isBanned ? 'banned' : 'active'} />
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '2fr',
            render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectedUser(row); setIsEditModalOpen(true); }}
                        className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,123,255,0.3)]"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => { setSelectedUser(row); setIsBanModalOpen(true); }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${row.isBanned
                            ? 'bg-accent-green hover:bg-green-600 hover:shadow-[0_0_20px_rgba(28,139,76,0.3)]'
                            : 'bg-danger-red hover:bg-red-600'
                            }`}
                    >
                        {row.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                        onClick={() => { setSelectedUser(row); setIsBalanceModalOpen(true); }}
                        className="bg-accent-yellow hover:bg-yellow-500 text-black px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    >
                        <FontAwesomeIcon icon={faCoins} />
                    </button>
                    <button
                        onClick={() => { setSelectedUser(row); setIsHistoryModalOpen(true); }}
                        className="bg-accent-blue hover:bg-blue-600 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,123,255,0.3)]"
                    >
                        <FontAwesomeIcon icon={faScroll} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Manage Users</h2>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setUsername('');
                        setEmail('');
                        setPassword('');
                        setRole('USER');
                        setBalance('');
                        setIsEditModalOpen(true);
                    }}
                    className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl font-semibold transition-all hover:shadow-[0_0_20px_rgba(0,123,255,0.3)]"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add New User
                </button>
            </section>

            {/* Search */}
            <div className="flex gap-4">
                <SearchBar
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="max-w-md flex-1"
                />
                <select
                    className="bg-primary-bg border border-border-dark rounded-xl px-4 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                    value={`${sortConfig.key}_${sortConfig.direction}`}
                    onChange={(e) => {
                        const [key, direction] = e.target.value.split('_');
                        setSortConfig({
                            key: key as 'createdAt' | 'balance',
                            direction: direction as 'asc' | 'desc'
                        });
                    }}
                >
                    <option value="createdAt_desc">Newest First</option>
                    <option value="balance_desc">Highest Balance</option>
                    <option value="balance_asc">Lowest Balance</option>
                </select>
            </div>

            {/* Pending Withdrawals */}


            {/* Users Table */}
            <section>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <FontAwesomeIcon icon={faSpinner} className="text-4xl text-accent-yellow animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-danger-red">
                        <p>{error}</p>
                        <button onClick={() => refetch()} className="mt-4 text-accent-blue hover:underline">Retry</button>
                    </div>
                ) : (
                    <DataTable
                        columns={userColumns}
                        data={users}
                        keyExtractor={(row) => row.id}
                        emptyMessage="No users found"
                    />
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    showingFrom={(currentPage - 1) * 10 + 1}
                    showingTo={Math.min(currentPage * 10, total)}
                    totalItems={total}
                    itemName="users"
                />
            </section>

            {/* Edit User Modal */}
            <AdminModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`${selectedUser ? 'Edit User' : 'Add New User'} ${selectedUser ? '- ' + selectedUser.username : ''}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    {!selectedUser && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                placeholder="Min. 6 characters"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-semibold mb-2">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        >
                            <option value="USER">Player</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    {!selectedUser && (
                        <div>
                            <label className="block text-sm font-semibold mb-2">Initial Balance</label>
                            <input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                    )}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={async () => {


                                try {
                                    setActionLoading(true);

                                    if (selectedUser) {
                                        // Update Logic
                                        const dto: AdminUpdateUserDto = {
                                            username,
                                            email,
                                            role: role.toUpperCase() as any,
                                        };

                                        await api.patch(`/users/admin/${selectedUser.id}`, dto);
                                    } else {
                                        // Create Logic
                                        const dto: CreateUserDto = {
                                            username,
                                            email,
                                            password,
                                            role: role.toUpperCase() as any,
                                            balance: Number(balance) || 0,
                                        };
                                        await api.post('/users/admin', dto);
                                    }

                                    await refetch();
                                    setIsEditModalOpen(false);
                                    // Reset form
                                    setUsername('');
                                    setEmail('');
                                    setPassword('');
                                    setBalance('');
                                } catch (err: any) {
                                    alert(err.response?.data?.message || 'Failed to create user');
                                } finally {
                                    setActionLoading(false);
                                }
                            }}
                            disabled={actionLoading}
                            className={`flex-1 bg-accent-green hover:bg-green-600 px-4 py-3 rounded-xl font-semibold transition-all ${actionLoading ? 'opacity-50' : ''}`}
                        >
                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                            {actionLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="flex-1 bg-card-bg hover:bg-hover-bg border border-border-dark px-4 py-3 rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </AdminModal>

            {/* Balance Modal */}
            <AdminModal
                isOpen={isBalanceModalOpen}
                onClose={() => setIsBalanceModalOpen(false)}
                title={`Manage Balance - ${selectedUser?.username || ''}`}
            >
                <div className="space-y-4">
                    <div className="bg-primary-bg rounded-xl p-4 text-center">
                        <p className="text-sm text-text-secondary mb-1">User Tier</p>
                        <p className="text-2xl font-bold text-accent-yellow">
                            {selectedUser ? (TIER_CONFIG[selectedUser.tier]?.label ?? selectedUser.tier) : '-'}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">Lifetime Rake: {selectedUser?.lifetimeRake.toLocaleString()} MNT</p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Amount</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-4 text-xl font-bold text-accent-white focus:border-accent-yellow focus:outline-none placeholder-text-secondary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Action</label>
                        <select
                            id="balance-action"
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm font-semibold text-accent-white"
                        >
                            <option value="CREDIT" className="text-accent-green">Add Balance (Credit)</option>
                            <option value="DEBIT" className="text-danger-red">Remove Balance (Debit)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Notes</label>
                        <textarea
                            id="balance-notes"
                            rows={3}
                            placeholder="Reason for balance change..."
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none resize-none"
                        />
                        {balanceError && (
                            <p className="text-danger-red text-sm mt-2 font-semibold">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                {balanceError}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={async () => {
                                if (!selectedUser) return;
                                const amountVal = Number(balance);
                                const actionEl = document.getElementById('balance-action') as HTMLSelectElement;
                                const notesEl = document.getElementById('balance-notes') as HTMLTextAreaElement;
                                const action = actionEl?.value || 'CREDIT';
                                const notes = notesEl?.value || '';

                                if (!amountVal || amountVal <= 0) {
                                    setBalanceError('Please enter a valid amount');
                                    return;
                                }
                                if (!notes) {
                                    setBalanceError('Please enter a reason/note (min 3 chars)');
                                    return;
                                }
                                if (notes.length < 3) {
                                    setBalanceError('Notes must be at least 3 characters');
                                    return;
                                }

                                setActionLoading(true);
                                setBalanceError('');
                                try {
                                    await api.post('/admin/wallet/adjustment', {
                                        userId: selectedUser.id,
                                        amount: action === 'DEBIT' ? -amountVal : amountVal,
                                        type: action === 'DEBIT' ? 'PENALTY' : 'BONUS',
                                        reason: notes
                                    });
                                    await refetch();
                                    // Trigger force audit so the Financial Invariant dashboard updates immediately
                                    api.post('/admin/system/audit/force').catch(() => { /* non-blocking */ });
                                    setIsBalanceModalOpen(false);
                                    setBalance('');
                                    setBalanceError('');
                                } catch (err: any) {
                                    setBalanceError(err.response?.data?.message || 'Failed to adjust balance');
                                } finally {
                                    setActionLoading(false);
                                }
                            }}
                            disabled={actionLoading}
                            className={`flex-1 bg-accent-yellow hover:bg-yellow-500 text-black px-4 py-3 rounded-xl font-semibold transition-all ${actionLoading ? 'opacity-50' : ''}`}
                        >
                            {actionLoading ? 'Processing...' : 'Submit'}
                        </button>
                        <button
                            onClick={() => setIsBalanceModalOpen(false)}
                            className="flex-1 bg-card-bg hover:bg-hover-bg border border-border-dark px-4 py-3 rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </AdminModal>

            {/* Withdrawal Review Modal */}


            {/* Ban/Unban Confirmation Modal */}
            <AdminModal
                isOpen={isBanModalOpen}
                onClose={() => setIsBanModalOpen(false)}
                title="Confirm Action"
                maxWidth="sm"
            >
                <div className="text-center">
                    <div className="text-accent-yellow text-4xl mb-4">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                    </div>
                    <p className="text-text-secondary mb-6">
                        Are you sure you want to {selectedUser?.isBanned ? 'unban' : 'ban'} <strong>{selectedUser?.username}</strong>?
                    </p>
                    <div className="flex gap-3">
                        <button

                            onClick={async () => {
                                if (selectedUser) {
                                    setActionLoading(true);
                                    try {
                                        // Toggle ban status using generic generic update endpoint
                                        await api.patch(`/users/admin/${selectedUser.id}`, {
                                            isBanned: !selectedUser.isBanned,
                                        });

                                        await refetch();
                                        setIsBanModalOpen(false);
                                    } catch (err: any) {
                                        alert(err.response?.data?.message || 'Failed to update ban status');
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }
                            }}
                            disabled={actionLoading}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${selectedUser?.isBanned
                                ? 'bg-accent-green hover:bg-green-600 hover:shadow-[0_0_20px_rgba(28,139,76,0.3)]'
                                : 'bg-danger-red hover:bg-red-600'
                                } ${actionLoading ? 'opacity-50' : ''}`}
                        >
                            {actionLoading ? 'Processing...' : (selectedUser?.isBanned ? 'Unban User' : 'Ban User')}
                        </button>
                        <button
                            onClick={() => setIsBanModalOpen(false)}
                            className="flex-1 bg-card-bg hover:bg-hover-bg border border-border-dark px-4 py-3 rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </AdminModal>

            {/* Transaction History Modal */}
            <AdminModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title={`Transaction History - ${selectedUser?.username || ''}`}
                maxWidth="4xl"
            >
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-4 flex-wrap">
                        <input type="date" className="bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm" />
                        <input type="date" className="bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm" />
                        <select className="bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm">
                            <option>All Types</option>
                            <option>Deposit</option>
                            <option>Withdrawal</option>
                            <option>Bonus</option>
                            <option>Game Buy-in</option>
                            <option>Winnings</option>
                        </select>
                        <select className="bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm">
                            <option>Performed By: All</option>
                            <option>Admin</option>
                            <option>System</option>
                            <option>User</option>
                        </select>
                        <button className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                            Apply
                        </button>
                    </div>

                    {/* Transaction Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border-dark bg-hover-bg">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Date & Time</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Action</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Amount</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Performed By</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Notes</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-accent-blue">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingTx ? (
                                    <tr><td colSpan={6} className="text-center py-4"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl text-accent-blue" /></td></tr>
                                ) : transactions.map((tx: any) => (
                                    <tr key={tx.id} className="border-b border-border-dark hover:bg-hover-bg">
                                        <td className="py-3 px-4 text-sm">
                                            <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                                            <div className="text-text-secondary text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium">{tx.type}</td>
                                        <td className={`py-3 px-4 font-semibold ${Number(tx.amount) > 0 ? 'text-accent-green' : 'text-danger-red'}`}>
                                            {Number(tx.amount) > 0 ? '+' : ''}${Math.abs(Number(tx.amount)).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {tx.performedBy ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-accent-blue/20 flex items-center justify-center text-[10px] text-accent-blue">
                                                        {tx.performedBy.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{tx.performedBy.username}</span>
                                                </div>
                                            ) : (
                                                <span className="text-text-secondary">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-text-secondary text-sm max-w-xs truncate" title={tx.description}>{tx.description}</td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={tx.status} />
                                        </td>
                                    </tr>
                                ))}
                                {!loadingTx && transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-text-secondary">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}
