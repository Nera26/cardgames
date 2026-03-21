import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUniversity } from '@fortawesome/free-solid-svg-icons';
import StatusBadge from '@/components/admin/StatusBadge';
import Pagination from '@/components/admin/Pagination';
import { ExtendedTransaction } from '@/hooks/useFinanceData';
import { getAvatarUrl } from '@/config/avatars';

interface UnifiedLogSectionProps {
    transactions: ExtendedTransaction[];
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onManageIban: () => void;
}

export default function UnifiedLogSection({
    transactions,
    currentPage,
    totalPages,
    onPageChange,
    onManageIban
}: UnifiedLogSectionProps) {
    return (
        <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Unified Transaction Log</h3>
                <div className="flex items-center gap-4">
                    <button className="bg-accent-blue hover:shadow-[0_0_20px_rgba(0,123,255,0.3)] px-4 py-2 rounded-xl font-semibold text-sm transition-all">
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />Export CSV
                    </button>
                    <button
                        onClick={onManageIban}
                        className="bg-accent-yellow text-black hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                    >
                        <FontAwesomeIcon icon={faUniversity} className="mr-2" />Manage IBANs
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th className="text-left py-3 px-2 text-text-secondary">Date & Time</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Type</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Amount</th>
                                <th className="text-left py-3 px-2 text-text-secondary">User</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Admin</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="border-b border-border-dark hover:bg-hover-bg">
                                    <td className="py-3 px-2 text-text-secondary">{new Date(txn.createdAt).toLocaleString()}</td>
                                    <td className="py-3 px-2">{txn.type}</td>
                                    <td className={`py-3 px-2 font-semibold ${txn.amount >= 0 ? 'text-accent-green' : 'text-danger-red'}`}>
                                        {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount)}
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={getAvatarUrl(txn.user?.avatarId, txn.user?.avatarUrl)}
                                                alt={txn.user?.username || 'User'}
                                                className="w-8 h-8 rounded-full object-cover bg-gray-600"
                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(txn.user?.avatarId); }}
                                            />
                                            <span>{txn.user?.username || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2">
                                        {(() => {
                                            const adminUser = txn.processedBy || txn.performedBy;
                                            if (!adminUser) {
                                                return <span className="text-text-secondary">-</span>;
                                            }
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={getAvatarUrl(adminUser.avatarId, adminUser.avatarUrl)}
                                                        alt={adminUser.username}
                                                        className="w-8 h-8 rounded-full object-cover bg-gray-600"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(adminUser.avatarId); }}
                                                    />
                                                    <span>{adminUser.username}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="py-3 px-2">
                                        <StatusBadge status={txn.status.toLowerCase() as any} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span className="text-text-secondary text-sm">Showing page {currentPage} of {totalPages}</span>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </section>
    );
}
