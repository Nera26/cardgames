'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBankConfig } from '@/hooks/useBankConfig';
import api from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faArrowLeft, faSpinner, faWallet, faBuildingColumns, faEye } from '@fortawesome/free-solid-svg-icons';

// ============================================================
// State Machine
// ============================================================
type ModalState = 'RELOAD' | 'PENDING_DEPOSIT' | 'AUTO_PROCESSING';

interface RebuyModalProps {
    tableId: string;
    isOpen: boolean;
    initialCountdown?: number;
    minBuyIn?: number;
    maxBuyIn?: number;
    onClose: () => void;
    /** Called when player stands up — parent should reset join state */
    onStandUp?: () => void;
    /** 🟣 Purple Cable: When true, the modal overlay is hidden but hooks stay alive */
    isMinimized?: boolean;
    /** 🟣 Purple Cable: Called when player clicks "Watch Table" */
    onMinimize?: () => void;
    /** 🟣 Purple Cable: Called to force-reopen when countdown expires */
    onRestore?: () => void;
}

export const RebuyModal: React.FC<RebuyModalProps> = ({
    tableId,
    isOpen,
    initialCountdown = 30,
    minBuyIn = 500,
    maxBuyIn = 2000,
    onClose,
    onStandUp,
    isMinimized = false,
    onMinimize,
    onRestore,
}) => {
    const { socket, extendSeatForDeposit } = useSocket();
    const { user } = useAuth();

    // ── State Machine ──
    const [state, setState] = useState<ModalState>('RELOAD');
    const [countdown, setCountdown] = useState(initialCountdown);
    const [buyInAmount, setBuyInAmount] = useState(minBuyIn);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [depositSent, setDepositSent] = useState(false);
    const [confirmCountdown, setConfirmCountdown] = useState(10);

    // ── Notification socket ref for PENDING_DEPOSIT ──
    // (Using DOM event from NotificationContext instead)

    // ── Bank Config (reuse from DepositModal) ──
    const { config: bankConfig, isLoading: bankConfigLoading } = useBankConfig();

    // Max slider value capped by wallet balance
    const effectiveMax = walletBalance !== null
        ? Math.min(maxBuyIn, walletBalance)
        : maxBuyIn;

    // Sync buyInAmount when minBuyIn prop changes
    useEffect(() => {
        setBuyInAmount(minBuyIn);
    }, [minBuyIn]);

    // ── Fetch wallet balance on open ──
    useEffect(() => {
        if (!isOpen) return;
        setBalanceLoading(true);
        api.get('/wallet/balance')
            .then(({ data }) => {
                setWalletBalance(data.realBalance ?? 0);
            })
            .catch(() => setWalletBalance(0))
            .finally(() => setBalanceLoading(false));
    }, [isOpen]);

    // ── Reset state on open ──
    useEffect(() => {
        if (!isOpen) return;
        setState('RELOAD');
        setCountdown(initialCountdown);
        setError(null);
        setCopied(false);
        setDepositSent(false);
        setConfirmCountdown(10);
    }, [isOpen, initialCountdown]);

    // ── Confirm countdown (10s safety before "I Have Sent" activates) ──
    useEffect(() => {
        if (state !== 'PENDING_DEPOSIT' || depositSent) return;
        setConfirmCountdown(10);
        const timer = setInterval(() => {
            setConfirmCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [state, depositSent]);

    // ── Countdown timer ──
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // 🟣 Auto-reopen if minimized so player sees they lost the seat
                    onRestore?.();
                    handleLeave();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, state]);

    // ── Handlers ──
    const handleRebuy = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data } = await api.post('/game/rebuy', {
                tableId,
                amount: buyInAmount,
            });

            if (data.success) {
                onClose();
            } else {
                setError(data.message || 'Failed to rebuy');
            }
        } catch (err: any) {
            console.error('Rebuy error:', err);
            setError(err?.response?.data?.message || 'Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [tableId, buyInAmount, onClose]);

    const handleAutoRebuy = useCallback(async (amount: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const { data } = await api.post('/game/rebuy', {
                tableId,
                amount,
            });

            if (data.success) {
                onClose();
            } else {
                setError(data.message || 'Auto-rebuy failed');
                setState('RELOAD');
            }
        } catch (err: any) {
            console.error('Auto-rebuy error:', err);
            setError(err?.response?.data?.message || 'Auto-rebuy failed');
            setState('RELOAD');
        } finally {
            setIsLoading(false);
        }
    }, [tableId, onClose]);

    const handleLeave = useCallback(() => {
        if (!socket) return;
        socket.emit('leave_table', { tableId }, () => {
            onClose();
            onStandUp?.();
        });
    }, [socket, tableId, onClose, onStandUp]);

    // ── PENDING_DEPOSIT: Listen for WALLET_BALANCE_UPDATED via DOM event ──
    // NotificationContext dispatches 'wallet:balance_updated' globally when
    // the backend pushes a balance change. This is the same signal path as
    // the Navbar, proven reliable.
    const buyInAmountRef = useRef(buyInAmount);
    buyInAmountRef.current = buyInAmount;

    useEffect(() => {
        if (state !== 'PENDING_DEPOSIT') return;

        const handleBalanceUpdate = (event: Event) => {
            const detail = (event as CustomEvent).detail as any;
            const newBalance = Number(detail?.newBalance);
            console.log('[RebuyModal] 💰 WALLET_BALANCE_UPDATED via DOM event:', newBalance, 'buyInAmount:', buyInAmountRef.current);

            if (!isNaN(newBalance) && newBalance > 0) {
                setWalletBalance(newBalance);

                // Check if we have enough for the pre-selected buy-in
                if (newBalance >= buyInAmountRef.current) {
                    console.log('[RebuyModal] 🔥 AUTO-REBUY TRIGGERED via WebSocket!');
                    setState('AUTO_PROCESSING');
                    handleAutoRebuy(buyInAmountRef.current);
                }
            }
        };

        window.addEventListener('wallet:balance_updated', handleBalanceUpdate);
        return () => window.removeEventListener('wallet:balance_updated', handleBalanceUpdate);
    }, [state, handleAutoRebuy]);

    // ── PENDING_DEPOSIT: HTTP Polling Fallback (every 5s) ──
    // The notification WebSocket is unreliable (disconnects under load).
    // This polling guarantees we detect the balance update within 5 seconds
    // even if the WebSocket event never arrives.
    const autoRebuyFiredRef = useRef(false);

    useEffect(() => {
        if (state !== 'PENDING_DEPOSIT') {
            autoRebuyFiredRef.current = false;
            return;
        }

        const pollBalance = async () => {
            if (autoRebuyFiredRef.current) return;
            try {
                const { data } = await api.get('/wallet/balance');
                const newBalance = Number(data.realBalance ?? 0);
                console.log('[RebuyModal] 📡 Poll balance:', newBalance, 'need:', buyInAmountRef.current);
                setWalletBalance(newBalance);

                if (newBalance >= buyInAmountRef.current) {
                    autoRebuyFiredRef.current = true;
                    console.log('[RebuyModal] 🔥 AUTO-REBUY TRIGGERED via polling!');
                    setState('AUTO_PROCESSING');
                    handleAutoRebuy(buyInAmountRef.current);
                }
            } catch (err) {
                console.warn('[RebuyModal] Poll balance failed:', err);
            }
        };

        // Initial poll immediately
        pollBalance();
        // Then every 5 seconds
        const interval = setInterval(pollBalance, 5000);
        return () => clearInterval(interval);
    }, [state, handleAutoRebuy]);

    const handleEnterDeposit = useCallback(async () => {
        setError(null);
        try {
            // Emit extend_seat_for_deposit to Red Cable
            await extendSeatForDeposit(tableId);
            // Set countdown to 180s
            setCountdown(180);
            setState('PENDING_DEPOSIT');
        } catch (err: any) {
            setError(err?.message || 'Failed to extend seat');
        }
    }, [extendSeatForDeposit, tableId]);

    const handleCancelDeposit = useCallback(() => {
        setState('RELOAD');
        setCountdown(initialCountdown);
        setDepositSent(false);
    }, [initialCountdown]);

    const handleConfirmDeposit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Create PENDING deposit transaction — same as wallet page DepositModal
            await api.post('/wallet/deposit', { amount: 0, method: 'Bank Transfer' });
            setDepositSent(true);
        } catch (err: any) {
            console.error('Deposit confirmation error:', err);
            setError(err?.response?.data?.message || 'Failed to register deposit');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    const timerMax = state === 'PENDING_DEPOSIT' ? 180 : initialCountdown;
    const timerPct = (countdown / timerMax) * 100;
    const canReload = walletBalance !== null && walletBalance >= minBuyIn;

    // 🟣 PURPLE CABLE: Non-destructive hide
    // All useEffect hooks above have already been declared and are running.
    // We simply skip the render when minimized — hooks stay alive.
    if (isMinimized) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 w-[92%] max-w-md shadow-2xl">

                {/* ═══════════ STATE: RELOAD ═══════════ */}
                {state === 'RELOAD' && (
                    <>
                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="text-5xl mb-2">💀</div>
                            <h2 className="text-2xl font-bold text-red-400">Out of Chips!</h2>
                            <p className="text-slate-400 mt-1">
                                Your seat is reserved for <span className="text-yellow-400 font-bold">{countdown}s</span>
                            </p>
                        </div>

                        {/* Timer Bar */}
                        <div className="w-full h-2 bg-slate-700 rounded-full mb-5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-yellow-500 transition-all duration-1000"
                                style={{ width: `${timerPct}%` }}
                            />
                        </div>

                        {/* Wallet Balance */}
                        <div className="bg-slate-800/60 rounded-xl p-3 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <FontAwesomeIcon icon={faWallet} className="text-blue-400" />
                                <span className="text-sm">Wallet Balance</span>
                            </div>
                            {balanceLoading ? (
                                <FontAwesomeIcon icon={faSpinner} className="text-blue-400 animate-spin" />
                            ) : (
                                <span className={`font-bold text-lg ${(walletBalance ?? 0) >= minBuyIn ? 'text-green-400' : 'text-red-400'}`}>
                                    ${(walletBalance ?? 0).toLocaleString()}
                                </span>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Buy-in Slider */}
                        {canReload && (
                            <div className="mb-4">
                                <label className="block text-slate-400 text-sm mb-2">
                                    Reload Amount: <span className="text-white font-bold">${buyInAmount.toLocaleString()}</span>
                                </label>
                                <input
                                    type="range"
                                    min={minBuyIn}
                                    max={effectiveMax}
                                    step={100}
                                    value={Math.min(buyInAmount, effectiveMax)}
                                    onChange={(e) => setBuyInAmount(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>${minBuyIn.toLocaleString()}</span>
                                    <span>${effectiveMax.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            {canReload && (
                                <button
                                    onClick={handleRebuy}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Loading...' : `Reload $${buyInAmount.toLocaleString()}`}
                                </button>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLeave}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Stand Up
                                </button>
                                <button
                                    onClick={handleEnterDeposit}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faBuildingColumns} />
                                    Deposit
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════ STATE: PENDING_DEPOSIT ═══════════ */}
                {state === 'PENDING_DEPOSIT' && (
                    <>
                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">🏦</div>
                            <h2 className="text-xl font-bold text-blue-400">Deposit & Auto-Reload</h2>
                            <p className="text-slate-400 mt-1 text-sm">
                                Seat held for <span className="text-yellow-400 font-bold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
                            </p>
                        </div>

                        {/* Timer Bar (Blue) */}
                        <div className="w-full h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000"
                                style={{ width: `${timerPct}%` }}
                            />
                        </div>

                        {/* Auto Buy-In Amount */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-center">
                            <p className="text-xs text-green-300">Auto-buy-in when deposit arrives</p>
                            <p className="text-2xl font-bold text-green-400">${buyInAmount.toLocaleString()}</p>
                        </div>

                        {/* Bank Transfer Details */}
                        {bankConfigLoading ? (
                            <div className="flex justify-center p-6">
                                <FontAwesomeIcon icon={faSpinner} className="text-blue-400 animate-spin text-2xl" />
                            </div>
                        ) : (
                            <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
                                {!bankConfig.isActive && (
                                    <div className="text-center text-red-400 font-bold py-2 mb-3 bg-red-500/10 rounded-lg">
                                        Deposits currently disabled
                                    </div>
                                )}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Bank</span>
                                        <span className="font-semibold text-white">{bankConfig.bankName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Holder</span>
                                        <span className="font-semibold text-white">{bankConfig.holderName || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">IBAN</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-yellow-400">{bankConfig.iban || 'N/A'}</span>
                                            {bankConfig.iban && (
                                                <button
                                                    onClick={() => copyToClipboard(bankConfig.iban)}
                                                    className="text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {bankConfig.bic && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">BIC</span>
                                            <span className="font-mono text-white">{bankConfig.bic}</span>
                                        </div>
                                    )}
                                </div>
                                {copied && (
                                    <p className="text-center text-green-400 text-xs mt-2">IBAN Copied!</p>
                                )}
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 text-xs text-amber-300/90 text-center">
                            ⚠️ If your deposit takes longer than 3 minutes, your seat will be opened — but your funds will still arrive in your wallet.
                        </div>

                        {/* Wallet Balance (live) */}
                        <div className="bg-slate-800/40 rounded-lg p-2 mb-4 flex items-center justify-between">
                            <span className="text-slate-400 text-xs flex items-center gap-1">
                                <FontAwesomeIcon icon={faWallet} className="text-blue-400" /> Current Balance
                            </span>
                            <span className="font-bold text-white">${(walletBalance ?? 0).toLocaleString()}</span>
                        </div>

                        {/* Buttons */}
                        {depositSent ? (
                            <>
                                {/* Waiting for admin */}
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 text-center">
                                    <FontAwesomeIcon icon={faSpinner} className="text-blue-400 animate-spin text-xl mb-2" />
                                    <p className="text-blue-300 text-sm font-semibold">Waiting for admin approval...</p>
                                    <p className="text-slate-400 text-xs mt-1">Your deposit will be credited automatically once approved.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelDeposit}
                                        className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                        Back
                                    </button>
                                    {onMinimize && (
                                        <button
                                            onClick={onMinimize}
                                            className="flex-1 py-3 px-4 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                            Watch Table
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLeave}
                                        className="flex-1 py-3 px-4 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors"
                                    >
                                        Stand Up
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleConfirmDeposit}
                                    disabled={isLoading || !bankConfig.isActive || confirmCountdown > 0}
                                    className={`w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 uppercase ${confirmCountdown === 0 && !isLoading && bankConfig.isActive ? 'shadow-lg shadow-emerald-500/40' : ''}`}
                                >
                                    {isLoading ? 'Processing...' : confirmCountdown > 0 ? `Please verify details (${confirmCountdown}s)` : 'I Have Sent the Deposit'}
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelDeposit}
                                        className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                        Back
                                    </button>
                                    {onMinimize && (
                                        <button
                                            onClick={onMinimize}
                                            className="flex-1 py-3 px-4 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                            Watch Table
                                        </button>
                                    )}
                                    <button
                                        onClick={handleLeave}
                                        className="flex-1 py-3 px-4 bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-colors"
                                    >
                                        Stand Up
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════ STATE: AUTO_PROCESSING ═══════════ */}
                {state === 'AUTO_PROCESSING' && (
                    <div className="text-center py-8">
                        <FontAwesomeIcon icon={faSpinner} className="text-green-400 animate-spin text-4xl mb-4" />
                        <h2 className="text-xl font-bold text-green-400 mb-2">Processing Auto-Reload...</h2>
                        <p className="text-slate-400 text-sm">Deposit received! Adding ${buyInAmount.toLocaleString()} chips to your stack.</p>
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mt-4 text-sm">
                                {error}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
