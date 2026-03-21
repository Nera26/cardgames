'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShieldAlt,
    faLock,
    faUnlock,
    faExclamationTriangle,
    faCheckCircle,
    faBalanceScale,
    faWallet,
    faCoins,
    faLandmark,
    faArrowDown,
    faArrowUp,
    faRefresh,
    faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { useSystemControls } from '@/hooks/useSystemControls';

// ════════════════════════════════════════════════════════════════
// 🛡️ EMERGENCY CONTROLS PANEL
//
// The Admin Citadel's command center for the Global Financial
// Invariant. Displays live audit status and provides the
// Red Button (lockdown) / Green Button (lift) controls.
// ════════════════════════════════════════════════════════════════

export default function EmergencyControls() {
    const {
        lockdownStatus,
        latestReport,
        isActivating,
        isLifting,
        isAuditing,
        activateLockdown,
        liftLockdown,
        forceAudit,
        refresh,
    } = useSystemControls();

    const [showLockdownModal, setShowLockdownModal] = useState(false);
    const [showLiftModal, setShowLiftModal] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const result = await forceAudit();
            if (result) {
                toast.success('Audit complete', {
                    description: `Status: ${result.status} | Pool: $${Number(result.expectedBalance).toLocaleString()}`,
                    duration: 3000,
                });
            }
        } finally {
            setIsRefreshing(false);
        }
    };

    // ── Lockdown action with confirmation ──
    const handleLockdown = async () => {
        const success = await activateLockdown('MANUAL_ADMIN_LOCKDOWN');
        if (success) {
            toast.error('🔒 PLATFORM LOCKDOWN ACTIVATED', {
                description: 'All tables are frozen. No game actions can be processed.',
                duration: 10000,
            });
        }
        setShowLockdownModal(false);
        setConfirmText('');
    };

    // ── Lift action with confirmation ──
    const handleLift = async () => {
        const success = await liftLockdown();
        if (success) {
            toast.success('🔓 LOCKDOWN LIFTED', {
                description: 'All tables have resumed normal operations.',
                duration: 5000,
            });
        }
        setShowLiftModal(false);
        setConfirmText('');
    };

    // Parse financial data from the report
    const report = latestReport;
    const isDrift = report?.status === 'DRIFT';
    const details = report?.details;

    const pool = details?.netPool || report?.expectedBalance || '0';
    const playerWallets = details?.playerWallets || '0';
    const houseBalance = details?.houseBalance || '0';
    const redisChips = details?.redisChips ?? 0;
    const discrepancy = report?.systemDiscrepancy || '0';
    const deposits = details?.deposits || '0';
    const withdrawals = details?.withdrawals || '0';
    const adminCredits = details?.adminCredits || '0';
    const adminDebits = details?.adminDebits || '0';

    return (
        <>
            <div className="space-y-6">
                {/* ═══ LOCKDOWN STATUS BANNER ═══ */}
                {lockdownStatus.locked && (
                    <div className="bg-danger-red/10 border-2 border-danger-red rounded-2xl p-6 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-danger-red/20 rounded-2xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faLock} className="text-danger-red text-2xl" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-danger-red">
                                    ⚠️ PLATFORM LOCKDOWN ACTIVE
                                </h3>
                                <p className="text-danger-red/80 text-sm mt-1">
                                    All game tables are frozen. No buy-ins, actions, or chip reloads are being processed.
                                </p>
                                {lockdownStatus.details?.triggeredAt && (
                                    <p className="text-danger-red/60 text-xs mt-1">
                                        Activated: {new Date(lockdownStatus.details.triggeredAt).toLocaleString()}
                                        {lockdownStatus.details.reason && ` • Reason: ${lockdownStatus.details.reason}`}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => { setConfirmText(''); setShowLiftModal(true); }}
                                disabled={isLifting}
                                className="bg-accent-green hover:bg-accent-green/80 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(0,200,83,0.4)] disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faUnlock} className="mr-2" />
                                {isLifting ? 'Lifting...' : 'LIFT LOCKDOWN'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ TWO-COLUMN: INVARIANT DISPLAY + EMERGENCY CONTROLS ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ── Financial Invariant Card ── */}
                    <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FontAwesomeIcon icon={faBalanceScale} className="text-accent-blue" />
                                Financial Invariant
                            </h3>
                            <div className="flex items-center gap-3">
                                {report ? (
                                    isDrift ? (
                                        <span className="px-3 py-1 bg-danger-red/20 text-danger-red rounded-full text-xs font-bold animate-pulse">
                                            DRIFT: ${Number(discrepancy).toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-accent-green/20 text-accent-green rounded-full text-xs font-bold">
                                            ✓ BALANCED
                                        </span>
                                    )
                                ) : (
                                    <span className="px-3 py-1 bg-hover-bg text-text-secondary rounded-full text-xs">
                                        No data
                                    </span>
                                )}
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isAuditing}
                                    className="text-text-secondary hover:text-white transition-colors disabled:opacity-50"
                                    title="Force recalculate audit"
                                >
                                    <FontAwesomeIcon icon={faRefresh} className={(isRefreshing || isAuditing) ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        {report ? (
                            <div className="space-y-4">
                                {/* THE EQUATION */}
                                <div className="bg-hover-bg rounded-xl p-4">
                                    <p className="text-text-secondary text-xs font-mono mb-3 tracking-wide">THE MASTER EQUATION</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Left side: The Pool */}
                                        <div className="flex items-center gap-3 p-3 bg-primary-bg rounded-lg">
                                            <div className="w-8 h-8 bg-accent-blue/20 rounded-lg flex items-center justify-center">
                                                <FontAwesomeIcon icon={faLandmark} className="text-accent-blue text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-text-secondary text-xs">The Pool (Deposits + Credits − Withdrawals − Debits)</p>
                                                <p className="text-lg font-bold font-mono">${Number(pool).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Equals sign */}
                                        <div className="flex items-center justify-center">
                                            <span className={`text-lg font-bold ${isDrift ? 'text-danger-red' : 'text-accent-green'}`}>
                                                {isDrift ? '≠' : '='}
                                            </span>
                                        </div>

                                        {/* Right side: Liabilities breakdown */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 p-2 bg-primary-bg rounded-lg">
                                                <div className="w-7 h-7 bg-accent-green/20 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faWallet} className="text-accent-green text-xs" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between">
                                                    <p className="text-text-secondary text-xs">Player Wallets</p>
                                                    <p className="font-semibold font-mono text-sm">${Number(playerWallets).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-primary-bg rounded-lg">
                                                <div className="w-7 h-7 bg-accent-yellow/20 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faLandmark} className="text-accent-yellow text-xs" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between">
                                                    <p className="text-text-secondary text-xs">House Profit</p>
                                                    <p className="font-semibold font-mono text-sm">${Number(houseBalance).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-primary-bg rounded-lg">
                                                <div className="w-7 h-7 bg-accent-blue/20 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faCoins} className="text-accent-blue text-xs" />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between">
                                                    <p className="text-text-secondary text-xs">Chips on Tables</p>
                                                    <p className="font-semibold font-mono text-sm">${Number(redisChips).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pool breakdown */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-hover-bg rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon icon={faArrowDown} className="text-accent-green text-xs" />
                                            <span className="text-text-secondary text-xs">Deposits</span>
                                        </div>
                                        <p className="font-bold font-mono">${Number(deposits).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-hover-bg rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon icon={faArrowUp} className="text-danger-red text-xs" />
                                            <span className="text-text-secondary text-xs">Withdrawals</span>
                                        </div>
                                        <p className="font-bold font-mono">${Number(withdrawals).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-hover-bg rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon icon={faArrowDown} className="text-accent-blue text-xs" />
                                            <span className="text-text-secondary text-xs">Admin Credits</span>
                                        </div>
                                        <p className="font-bold font-mono">${Number(adminCredits).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-hover-bg rounded-xl p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FontAwesomeIcon icon={faArrowUp} className="text-accent-yellow text-xs" />
                                            <span className="text-text-secondary text-xs">Admin Debits</span>
                                        </div>
                                        <p className="font-bold font-mono">${Number(adminDebits).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Last audit time */}
                                {report.timestamp && (
                                    <p className="text-text-secondary text-xs text-center">
                                        Last audit: {new Date(report.timestamp).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-text-secondary">
                                <FontAwesomeIcon icon={faBalanceScale} className="text-3xl mb-3 opacity-30" />
                                <p className="text-sm">No audit data available yet.</p>
                                <p className="text-xs opacity-60">The cron auditor runs every 5 minutes.</p>
                            </div>
                        )}
                    </div>

                    {/* ── Emergency Controls Card ── */}
                    <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <FontAwesomeIcon icon={faShieldAlt} className="text-accent-yellow" />
                            Emergency Controls
                        </h3>

                        <div className="space-y-4">
                            {/* Status indicator */}
                            <div className={`p-4 rounded-xl border-2 ${lockdownStatus.locked
                                ? 'bg-danger-red/5 border-danger-red/30'
                                : 'bg-accent-green/5 border-accent-green/30'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-4 h-4 rounded-full ${lockdownStatus.locked
                                        ? 'bg-danger-red animate-pulse'
                                        : 'bg-accent-green'
                                        }`} />
                                    <div>
                                        <p className="font-bold">
                                            {lockdownStatus.locked ? 'System LOCKED DOWN' : 'System OPERATIONAL'}
                                        </p>
                                        <p className="text-text-secondary text-xs">
                                            {lockdownStatus.locked
                                                ? 'All game tables are frozen. Players cannot perform actions.'
                                                : 'All systems normal. Tables and transactions are active.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-hover-bg rounded-xl p-4">
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {lockdownStatus.locked ? (
                                        <>
                                            The Kill Switch has frozen all game tables. Players cannot join tables,
                                            place bets, fold, or reload chips. Investigate the financial drift in
                                            the Invariant panel before lifting the lockdown.
                                        </>
                                    ) : (
                                        <>
                                            Use the Kill Switch to instantly freeze all game tables across the platform.
                                            This blocks all buy-ins, game actions (bet/fold/call/raise), and chip reloads.
                                            Use this in emergencies when financial integrity is compromised.
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Action Button */}
                            {!lockdownStatus.locked ? (
                                <button
                                    id="lockdown-button"
                                    onClick={() => { setConfirmText(''); setShowLockdownModal(true); }}
                                    className="w-full bg-danger-red/90 hover:bg-danger-red text-white py-4 px-6 rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-[0.98] border-2 border-danger-red"
                                >
                                    <FontAwesomeIcon icon={faLock} className="mr-3" />
                                    INITIATE PLATFORM LOCKDOWN
                                </button>
                            ) : (
                                <button
                                    id="lift-lockdown-button"
                                    onClick={() => { setConfirmText(''); setShowLiftModal(true); }}
                                    disabled={isLifting}
                                    className="w-full bg-accent-green/90 hover:bg-accent-green text-white py-4 px-6 rounded-xl font-bold text-lg transition-all hover:shadow-[0_0_30px_rgba(0,200,83,0.5)] active:scale-[0.98] border-2 border-accent-green disabled:opacity-50"
                                >
                                    <FontAwesomeIcon icon={faUnlock} className="mr-3" />
                                    {isLifting ? 'LIFTING...' : 'LIFT LOCKDOWN (RESUME OPERATIONS)'}
                                </button>
                            )}

                            {/* Redis CLI hint */}
                            <p className="text-text-secondary text-xs text-center opacity-60">
                                CLI: <code className="bg-hover-bg px-2 py-0.5 rounded text-xs">
                                    PUBLISH system:maintenance &quot;MANUAL_TEST&quot;
                                </code>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ LOCKDOWN CONFIRMATION MODAL ═══ */}
            {showLockdownModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-card-bg border border-danger-red/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-danger-red/20 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger-red text-xl" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-danger-red">Confirm Lockdown</h4>
                                    <p className="text-text-secondary text-xs">This will freeze ALL tables</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLockdownModal(false)}
                                className="text-text-secondary hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-danger-red/10 border border-danger-red/20 rounded-xl p-4">
                                <p className="text-sm text-danger-red/90">
                                    ⚠️ This action will immediately freeze all game tables. Players will be unable
                                    to join, bet, fold, call, or reload chips until the lockdown is manually lifted.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-text-secondary mb-2">
                                    Type <span className="font-mono font-bold text-danger-red">LOCKDOWN</span> to confirm:
                                </label>
                                <input
                                    id="lockdown-confirm-input"
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type LOCKDOWN here..."
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-danger-red transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLockdownModal(false)}
                                    className="flex-1 bg-hover-bg hover:bg-border-dark text-text-secondary py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="lockdown-confirm-button"
                                    onClick={handleLockdown}
                                    disabled={confirmText !== 'LOCKDOWN' || isActivating}
                                    className="flex-1 bg-danger-red hover:bg-danger-red/80 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {isActivating ? 'ACTIVATING...' : '🔒 CONFIRM LOCKDOWN'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ LIFT LOCKDOWN CONFIRMATION MODAL ═══ */}
            {showLiftModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-card-bg border border-accent-green/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCheckCircle} className="text-accent-green text-xl" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-accent-green">Confirm Resume</h4>
                                    <p className="text-text-secondary text-xs">This will unfreeze ALL tables</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLiftModal(false)}
                                className="text-text-secondary hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-4">
                                <p className="text-sm text-accent-green/90">
                                    ✅ Ensure the financial drift has been resolved before resuming operations.
                                    All tables will immediately accept new joins and actions.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm text-text-secondary mb-2">
                                    Type <span className="font-mono font-bold text-accent-green">RESUME</span> to confirm:
                                </label>
                                <input
                                    id="lift-confirm-input"
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="Type RESUME here..."
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-accent-green transition-colors"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLiftModal(false)}
                                    className="flex-1 bg-hover-bg hover:bg-border-dark text-text-secondary py-3 rounded-xl font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="lift-confirm-button"
                                    onClick={handleLift}
                                    disabled={confirmText !== 'RESUME' || isLifting}
                                    className="flex-1 bg-accent-green hover:bg-accent-green/80 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    {isLifting ? 'RESUMING...' : '🔓 CONFIRM RESUME'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
