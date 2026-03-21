"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { getAvatarUrl } from "@/config/avatars";
import { TIER_CONFIG, Tier } from "@poker/shared";
import { TierProgressBar } from "@/components/profile/TierProgressBar";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { HandReplayDetail } from "@/components/game/HandReplayDetail";

export default function ProfilePage() {
    // Context & API Data
    const { user, refreshWallet } = useGame();
    const { logout } = useAuth();
    const { profile, isLoading: profileLoading, updateProfile: updateApiProfile } = useProfile();

    // Tab State
    const [activeTab, setActiveTab] = useState<'transaction-history' | 'game-history' | 'tournament-history'>('transaction-history');

    // Modal States
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [selectedHand, setSelectedHand] = useState<{ tableId: string; handId: string } | null>(null);

    // Derived data
    const displayUser = profile || user;
    const tierColor = displayUser?.tier ? TIER_CONFIG[displayUser.tier as Tier]?.color ?? '#FFD700' : '#FFD700';
    const avatarSrc = getAvatarUrl(displayUser?.avatarId, displayUser?.avatarUrl);

    // Format balance
    const formattedBalance = displayUser
        ? `$${(displayUser.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00';

    // Format join date
    const joinDate = displayUser?.createdAt
        ? new Date(displayUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

    // Real transactions from useGame()
    const transactions = user?.transactions ?? [];

    // Hand history state (paginated from /game/my-history)
    const [handHistory, setHandHistory] = useState<any[]>([]);
    const [handsLoading, setHandsLoading] = useState(false);
    const [handsLoadingMore, setHandsLoadingMore] = useState(false);
    const [handsMeta, setHandsMeta] = useState<{ total: number; page: number; totalPages: number }>({ total: 0, page: 1, totalPages: 1 });

    // Fetch hand history page 1 when Game History tab is activated
    useEffect(() => {
        if (activeTab !== 'game-history') return;
        const fetchHands = async () => {
            setHandsLoading(true);
            try {
                const { data } = await api.get('/game/my-history?page=1&limit=20');
                setHandHistory(data.data || []);
                setHandsMeta(data.meta || { total: 0, page: 1, totalPages: 1 });
            } catch (err) {
                console.error('[Profile] Failed to fetch hand history:', err);
                setHandHistory([]);
            } finally {
                setHandsLoading(false);
            }
        };
        fetchHands();
    }, [activeTab]);

    // Load more pages
    const loadMoreHands = async () => {
        const nextPage = handsMeta.page + 1;
        setHandsLoadingMore(true);
        try {
            const { data } = await api.get(`/game/my-history?page=${nextPage}&limit=20`);
            setHandHistory(prev => [...prev, ...(data.data || [])]);
            setHandsMeta(data.meta || handsMeta);
        } catch (err) {
            console.error('[Profile] Failed to load more hands:', err);
        } finally {
            setHandsLoadingMore(false);
        }
    };

    // Game stats (fetched from /game/my-stats)
    const [stats, setStats] = useState<{ handsPlayed: number; winRate: number; tournamentsPlayed: number; top3Rate: number } | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const { data } = await api.get('/game/my-stats');
                setStats(data);
            } catch (err) {
                console.error('[Profile] Failed to fetch stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const openEditProfile = () => setIsEditOpen(true);

    const handleLogout = () => {
        setIsLogoutOpen(false);
        logout();
    };

    if (profileLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent-yellow border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 md:py-12">

            {/* Profile Section */}
            <section className="bg-card-bg rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
                    <div className="flex-shrink-0 relative flex flex-col items-center md:items-start mb-6 md:mb-0">
                        {/* Avatar with Tier Ring */}
                        <div
                            className="w-32 h-32 rounded-full p-[3px] cursor-pointer hover:scale-105 transition-transform"
                            onClick={openEditProfile}
                            style={{ background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)` }}
                        >
                            <img
                                src={avatarSrc}
                                alt={displayUser?.username ?? 'Avatar'}
                                className="w-full h-full rounded-full border-2 border-black object-cover bg-neutral-800"
                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(displayUser?.avatarId); }}
                            />
                        </div>

                        {/* Username */}
                        <h1
                            onClick={openEditProfile}
                            className="text-2xl font-bold text-text-primary mt-4 cursor-pointer hover:text-accent-yellow transition-colors"
                        >
                            {displayUser?.username ?? 'Player'}
                        </h1>

                        {/* Tier Badge */}
                        <span
                            className="text-xs font-bold uppercase tracking-wider mt-1"
                            style={{ color: tierColor }}
                        >
                            {displayUser?.tier ?? 'BRONZE'} Member
                        </span>

                        {/* Email */}
                        <p className="text-text-secondary text-sm mt-2">
                            <i className="fa-solid fa-envelope mr-2 text-accent-yellow/60"></i>
                            {displayUser?.email ?? '—'}
                        </p>

                        {/* Bank Info */}
                        {displayUser?.accountNumber && (
                            <p className="text-text-secondary text-sm mt-1">
                                <i className="fa-solid fa-building-columns mr-2 text-accent-yellow/60"></i>
                                {displayUser.bankName ?? 'Bank'}: •••• {displayUser.accountNumber.slice(-4)}
                            </p>
                        )}

                        {/* Join Date */}
                        <p className="text-text-secondary text-xs mt-1">
                            <i className="fa-solid fa-calendar mr-2 text-accent-yellow/60"></i>
                            Joined {joinDate}
                        </p>

                        {/* Bio */}
                        {displayUser?.bio && (
                            <p className="text-text-secondary text-sm mt-3 max-w-xs text-center md:text-left italic">
                                "{displayUser.bio}"
                            </p>
                        )}

                        {/* Tier Progress Bar */}
                        {profile ? (
                            <TierProgressBar
                                currentTier={profile.tier}
                                nextTierProgress={profile.nextTierProgress}
                                rakeToNextTier={profile.rakeToNextTier}
                                lifetimeRake={profile.lifetimeRake}
                            />
                        ) : null}
                    </div>

                    {/* Right: Balance + Actions */}
                    <div className="flex-grow flex flex-col md:items-end space-y-6">
                        <div
                            className="w-full md:w-auto text-center md:text-right cursor-pointer group"
                            onClick={() => setActiveTab('transaction-history')}
                        >
                            <p className="text-text-secondary text-sm uppercase tracking-wider">Current Balance</p>
                            <p className="text-3xl lg:text-4xl font-bold text-accent-yellow mt-1 tabular-nums group-hover:scale-105 transition-transform">
                                {formattedBalance}
                            </p>
                        </div>
                        <button
                            onClick={openEditProfile}
                            className="w-full md:w-auto border-2 border-accent-yellow text-accent-yellow font-bold py-3 px-6 rounded-xl hover:bg-accent-yellow hover:text-primary-bg transition duration-200 text-sm uppercase"
                        >
                            <i className="fa-solid fa-pencil mr-2"></i>Edit Profile
                        </button>
                    </div>
                </div>
            </section>

            {/* Game Statistics */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Game Statistics</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        value={statsLoading ? '—' : (stats?.handsPlayed?.toLocaleString() ?? '0')}
                        label="Hands Played"
                        icon="fa-hand"
                        onClick={() => setActiveTab('game-history')}
                    />
                    <StatCard
                        value={statsLoading ? '—' : (stats?.winRate !== undefined ? `${stats.winRate}%` : '0%')}
                        label="Win Rate"
                        icon="fa-chart-pie"
                        onClick={() => setActiveTab('game-history')}
                    />
                    <StatCard
                        value={statsLoading ? '—' : (stats?.tournamentsPlayed?.toLocaleString() ?? '0')}
                        label="Tournaments"
                        icon="fa-trophy"
                        onClick={() => setActiveTab('tournament-history')}
                    />
                    <StatCard
                        value={statsLoading ? '—' : (stats?.top3Rate !== undefined ? `${stats.top3Rate}%` : '0%')}
                        label="Top 3 Rate"
                        icon="fa-medal"
                        onClick={() => setActiveTab('tournament-history')}
                    />
                </div>
            </section>

            {/* History Tabs */}
            <section className="mb-8">
                <div className="border-b border-border-dark mb-6">
                    <div className="flex space-x-8">
                        {(['transaction-history', 'game-history', 'tournament-history'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 border-b-2 font-semibold transition-colors duration-200 ${activeTab === tab
                                    ? 'border-accent-yellow text-accent-yellow'
                                    : 'border-transparent text-text-secondary hover:text-accent-yellow'
                                    }`}
                            >
                                {tab === 'transaction-history' ? 'Wallet Activity' : tab === 'game-history' ? 'Game History' : 'Tournaments'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Transaction History — LIVE DATA */}
                {activeTab === 'transaction-history' && (
                    <div className="bg-card-bg rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">
                                Wallet Activity
                                <span className="text-xs text-text-secondary ml-2 font-normal">
                                    ({transactions.length} transactions)
                                </span>
                            </h3>
                        </div>
                        {transactions.length > 0 ? (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {transactions.map((tx) => {
                                    const amount = Number(tx.amount);
                                    const isPositive = amount > 0;
                                    const displayDate = new Date(tx.createdAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    });
                                    const displayTime = new Date(tx.createdAt).toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface hover:bg-surface-hover transition-colors border border-border-dark/30"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isPositive
                                                    ? 'bg-accent-green/15 text-accent-green'
                                                    : 'bg-danger-red/15 text-danger-red'
                                                    }`}>
                                                    <i className={`fa-solid ${isPositive ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">
                                                        {tx.description || tx.type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-xs text-text-secondary">{displayDate} · {displayTime}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold tabular-nums ${isPositive ? 'text-accent-green' : 'text-danger-red'}`}>
                                                    {isPositive ? '+' : ''}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${tx.status === 'COMPLETED' ? 'bg-accent-green/15 text-accent-green'
                                                    : tx.status === 'PENDING' ? 'bg-accent-yellow/15 text-accent-yellow'
                                                        : 'bg-danger-red/15 text-danger-red'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState icon="fa-receipt" message="No transactions yet. Deposit funds to get started." />
                        )}
                    </div>
                )}

                {/* Game History — LIVE from /game/my-history */}
                {activeTab === 'game-history' && (
                    <div className="bg-card-bg rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">
                                Game History
                                <span className="text-xs text-text-secondary ml-2 font-normal">
                                    ({handsMeta.total} hands)
                                </span>
                            </h3>
                        </div>

                        {handsLoading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-2 border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin" />
                            </div>
                        )}

                        {!handsLoading && handHistory.length === 0 && (
                            <EmptyState icon="fa-gamepad" message="No hand history yet. Play some hands to see your history here." />
                        )}

                        {!handsLoading && handHistory.length > 0 && (
                            <>
                            <div className="space-y-2.5 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {handHistory.map((hand: any) => {
                                    const isProfit = hand.heroNetProfit > 0;
                                    const isLoss = hand.heroNetProfit < 0;
                                    const topWinner = hand.winners?.[0];
                                    const displayDate = new Date(hand.endTime).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric',
                                    });
                                    const displayTime = new Date(hand.endTime).toLocaleTimeString('en-US', {
                                        hour: '2-digit', minute: '2-digit',
                                    });

                                    return (
                                        <div
                                            key={hand.handId}
                                            onClick={() => setSelectedHand({ tableId: hand.tableId, handId: hand.handId })}
                                            className="rounded-xl p-4 bg-surface border border-border-dark/30 hover:bg-surface-hover transition-all cursor-pointer"
                                        >
                                            {/* Row 1: Table name + Time + Profit */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-text-primary text-sm font-semibold">{hand.tableName}</span>
                                                    <span className="text-text-secondary text-[10px]">{hand.stakes}</span>
                                                    <span className="text-text-secondary/40 text-[10px]">·</span>
                                                    <span className="text-text-secondary text-[10px]">{displayDate} {displayTime}</span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'text-sm font-bold tabular-nums',
                                                        isProfit && 'text-accent-green',
                                                        isLoss && 'text-danger-red',
                                                        !isProfit && !isLoss && 'text-text-secondary'
                                                    )}
                                                >
                                                    {isProfit ? '+' : isLoss ? '-' : ''}${Math.abs(hand.heroNetProfit).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Row 2: Hero Cards | Board */}
                                            <div className="flex items-center gap-1 mb-2">
                                                {hand.heroCards?.length > 0 && (
                                                    <>
                                                        <div className="flex items-center gap-0.5">
                                                            {hand.heroCards.map((card: string, i: number) => (
                                                                <MiniCard key={`${hand.handId}-hc-${i}`} card={card} isHero />
                                                            ))}
                                                        </div>
                                                        {hand.communityCards?.length > 0 && (
                                                            <div className="w-px h-5 bg-border-dark mx-1" />
                                                        )}
                                                    </>
                                                )}
                                                {hand.communityCards?.length > 0 && (
                                                    <div className="flex items-center gap-0.5">
                                                        {hand.communityCards.map((card: string, i: number) => (
                                                            <MiniCard key={`${hand.handId}-cc-${i}`} card={card} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 3: Pot + Winner */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-text-secondary text-[10px]">Pot: ${hand.pot?.toLocaleString()}</span>
                                                {topWinner && (
                                                    <div className="flex items-center gap-1.5">
                                                        <i className="fa-solid fa-trophy text-accent-yellow/60 text-[9px]"></i>
                                                        <span className="text-text-secondary text-[10px] max-w-[200px] truncate">
                                                            {topWinner.handDescription || topWinner.name || `Seat ${topWinner.seat} won`}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Row 4: Hero Hand Description */}
                                            {hand.heroHandDescription && (
                                                <div className="mt-1.5 pt-1.5 border-t border-border-dark/30">
                                                    <span className="text-accent-yellow/60 text-[10px] italic">
                                                        Your hand: {hand.heroHandDescription}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Load More Button */}
                            {handsMeta.page < handsMeta.totalPages && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={loadMoreHands}
                                        disabled={handsLoadingMore}
                                        className="px-6 py-2.5 rounded-xl bg-surface border border-border-dark/30 text-text-secondary hover:text-accent-yellow hover:border-accent-yellow/30 transition-all font-semibold text-sm disabled:opacity-50"
                                    >
                                        {handsLoadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            `Load More (${handsMeta.total - handHistory.length} remaining)`
                                        )}
                                    </button>
                                </div>
                            )}
                            </>
                        )}
                    </div>
                )}

                {/* Tournament History — Backend not built yet */}
                {activeTab === 'tournament-history' && (
                    <div className="bg-card-bg rounded-2xl p-6">
                        <EmptyState icon="fa-trophy" message="Tournament results will appear here when tournaments go live." />
                    </div>
                )}
            </section>

            {/* Logout Button */}
            <button
                onClick={() => setIsLogoutOpen(true)}
                className="fixed bottom-24 right-8 md:bottom-8 bg-danger-red text-white font-bold py-3 px-6 rounded-xl hover:bg-danger-red/80 transition duration-200 shadow-lg"
            >
                <i className="fa-solid fa-right-from-bracket mr-2"></i>Logout
            </button>

            {/* ---- MODALS ---- */}

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                user={profile || user || {}}
                onSave={async (data) => {
                    try {
                        await updateApiProfile({
                            bio: data.bio,
                            avatarUrl: data.avatarUrl,
                            avatarId: data.avatarId,
                            bankName: data.bankName || undefined,
                            accountNumber: data.accountNumber || undefined,
                            accountHolderName: data.accountHolderName || undefined,
                            iban: data.iban || undefined,
                        });
                        setIsEditOpen(false);
                        toast.success("Profile updated successfully!");
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to update profile");
                    }
                }}
            />

            {/* Hand Replay Modal */}
            {selectedHand && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedHand(null); }}
                >
                    <div className="bg-card-bg rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-border-dark shadow-2xl custom-scrollbar">
                        <HandReplayDetail
                            tableId={selectedHand.tableId}
                            handId={selectedHand.handId}
                            onBack={() => setSelectedHand(null)}
                        />
                    </div>
                </div>
            )}
            {/* Logout Confirm Modal */}
            {isLogoutOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
                    <div className="bg-card-bg rounded-2xl p-6 w-full max-w-md border border-border-dark shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-red/15 flex items-center justify-center">
                                <i className="fa-solid fa-right-from-bracket text-2xl text-danger-red"></i>
                            </div>
                            <h3 className="text-xl font-bold text-text-primary">Confirm Logout</h3>
                            <p className="text-text-secondary mt-2 text-sm">
                                Are you sure you want to log out? Active table sessions will be preserved.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLogoutOpen(false)}
                                className="flex-1 py-2.5 rounded-xl text-text-secondary font-semibold bg-surface hover:bg-surface-hover transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2.5 bg-danger-red text-white font-bold rounded-xl hover:bg-danger-red/80 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ value, label, icon, onClick }: {
    value: string; label: string; icon: string; onClick?: () => void;
}) {
    return (
        <div
            className="bg-card-bg rounded-2xl p-6 text-center hover:border-accent-yellow/30 border border-transparent cursor-pointer transition-all hover:scale-[1.02]"
            onClick={onClick}
        >
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent-yellow/10 flex items-center justify-center">
                <i className={`fa-solid ${icon} text-accent-yellow`}></i>
            </div>
            <p className="text-2xl font-bold text-accent-yellow tabular-nums">{value}</p>
            <p className="text-text-secondary text-sm mt-1">{label}</p>
        </div>
    );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="py-16 text-center">
            <i className={`fa-solid ${icon} text-5xl text-text-secondary/20 mb-4`}></i>
            <p className="text-text-secondary text-sm">{message}</p>
        </div>
    );
}

const SUIT_MAP: Record<string, { symbol: string; color: string }> = {
    s: { symbol: '♠', color: 'text-white' },
    h: { symbol: '♥', color: 'text-red-400' },
    d: { symbol: '♦', color: 'text-blue-400' },
    c: { symbol: '♣', color: 'text-emerald-400' },
};

function MiniCard({ card, isHero }: { card: string; isHero?: boolean }) {
    if (!card || card.length < 2) return null;
    const rank = card.slice(0, -1).toUpperCase();
    const suitKey = card.slice(-1).toLowerCase();
    const suit = SUIT_MAP[suitKey] || { symbol: '?', color: 'text-white' };

    return (
        <span
            className={cn(
                'inline-flex items-center justify-center',
                'w-6 h-8 rounded-[3px] text-[10px] font-bold leading-none',
                isHero
                    ? 'bg-accent-yellow/20 border border-accent-yellow/30'
                    : 'bg-white/10 border border-white/10',
                suit.color
            )}
        >
            {rank}{suit.symbol}
        </span>
    );
}
