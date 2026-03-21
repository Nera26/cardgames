import React from 'react';
import { ExtendedTransaction } from '@/hooks/useFinanceData';
import { TransactionType } from '@poker/shared';
import StatusBadge from '@/components/admin/StatusBadge';
import { getAvatarUrl } from '@/config/avatars';

interface TransactionSectionProps {
    title: string;
    data: ExtendedTransaction[];
    type: TransactionType;
    onApprove: (id: string, type: TransactionType) => void;
    onReject: (id: string) => void;
}

export default function TransactionSection({ title, data, type, onApprove, onReject }: TransactionSectionProps) {
    // Removed early return to ensure section always renders

    return (
        <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th className="text-left py-3 px-2 text-text-secondary">Player</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Amount</th>
                                <th className="text-left py-3 px-2 text-text-secondary">
                                    {type === TransactionType.DEPOSIT ? 'Method' : 'Details'}
                                </th>
                                <th className="text-left py-3 px-2 text-text-secondary">Date</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Status</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((tx) => (
                                    <tr key={tx.id} className="border-b border-border-dark hover:bg-hover-bg">
                                        <td className="py-3 px-2">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={getAvatarUrl(tx.user?.avatarId, tx.user?.avatarUrl)}
                                                    alt={tx.user?.username || 'User'}
                                                    className="w-8 h-8 rounded-full object-cover bg-gray-600"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(tx.user?.avatarId); }}
                                                />
                                                <span>{tx.user?.username || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className={`py-3 px-2 font-semibold ${type === TransactionType.DEPOSIT ? 'text-accent-green' : 'text-danger-red'}`}>
                                            {tx.amount === 0 && tx.status === 'PENDING' ? (
                                                <span className="text-text-secondary opacity-50">---</span>
                                            ) : (
                                                `$${Math.abs(tx.amount)}`
                                            )}
                                        </td>
                                        <td className="py-3 px-2 text-xs text-text-secondary">
                                            {tx.description || (type === TransactionType.DEPOSIT ? 'Standard' : 'Winnings/Payout')}
                                        </td>
                                        <td className="py-3 px-2 text-text-secondary">{new Date(tx.createdAt).toLocaleString()}</td>
                                        <td className="py-3 px-2">
                                            <StatusBadge status={tx.status.toLowerCase() as any} />
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className="flex gap-1">
                                                {type === TransactionType.WITHDRAW ? (
                                                    <button
                                                        onClick={() => onApprove(tx.id, type)}
                                                        className="bg-accent-blue hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] px-2 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Process
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => onApprove(tx.id, type)}
                                                        className="bg-accent-green hover:shadow-[0_0_15px_rgba(28,139,76,0.3)] px-2 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onReject(tx.id)}
                                                    className="bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-text-secondary">
                                        No pending {type === TransactionType.DEPOSIT ? 'deposits' : 'withdrawals'} found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
