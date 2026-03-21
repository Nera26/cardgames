'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faSkullCrossbones, faWifi, faExclamationTriangle, faFire,
    faComments, faList, faUsers, faBan, faUserMinus, faPaperPlane,
    faSpinner, faCog, faEye, faEyeSlash, faLock, faSave, faPause, faPlay,
    faCopy, faCheck, faDatabase,
    faHandFist, faArrowDown, faArrowUp, faGavel, faLayerGroup, faHandPointer,
    faCoins, faBolt, faCrown, IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { GodModeTableDto, TableConfigDetails } from '@poker/shared';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getAvatarUrl } from '@/config/avatars';

interface InspectorDetails {
    tableId: string;
    phase: string;
    handNumber: number;
    pot: number;
    players: PlayerInfo[];
    liveLog: LogEntry[];
    chat: ChatMessage[];
    maxSeats: number;
}

interface PlayerInfo {
    seat: number;
    userId: string;
    name: string;
    chips: number;
    ip: string;
    status: string;
    isDuplicateIP: boolean;
    avatarId?: string;
    avatarUrl?: string | null;
}

interface LogEntry {
    action: string;
    time: string;
    type: string;
    handId?: number;
    phase?: string;
    meta?: { winners?: { name: string; amount: number; hand?: string }[] };
}

interface ChatMessage {
    message: string;
    time: string;
    user: string;
    userId?: string;
    avatarId?: string;
    avatarUrl?: string | null;
}

// ============================================================
// LOG TIMELINE: Parse structured log entries into visual data
// ============================================================
interface ParsedLogEntry {
    playerName: string | null;
    action: string;
    amount: string | null;
    time: string;
    type: string;
    phase: string;
    isSystem: boolean;
    meta?: LogEntry['meta'];
}

interface HandGroup {
    handId: number;
    events: ParsedLogEntry[];
    winners: { name: string; amount: number; hand?: string }[];
    isActive: boolean;
}

const ACTION_STYLES: Record<string, { color: string; bg: string; icon: IconDefinition; label?: string }> = {
    fold:     { color: 'text-red-400',      bg: 'bg-red-500/15',     icon: faArrowDown },
    check:    { color: 'text-gray-300',     bg: 'bg-gray-500/15',    icon: faHandPointer },
    call:     { color: 'text-emerald-400',  bg: 'bg-emerald-500/15', icon: faCoins },
    raise:    { color: 'text-amber-400',    bg: 'bg-amber-500/15',   icon: faArrowUp },
    allin:    { color: 'text-purple-400',   bg: 'bg-purple-500/15',  icon: faBolt,       label: 'ALL-IN' },
    deal:     { color: 'text-blue-400',     bg: 'bg-blue-500/15',    icon: faLayerGroup },
    phase:    { color: 'text-cyan-300',     bg: 'bg-cyan-500/10',    icon: faLayerGroup },
    showdown: { color: 'text-gold-500',     bg: 'bg-gold-500/15',    icon: faGavel },
    winner:   { color: 'text-gold-400',     bg: 'bg-gold-500/15',    icon: faCrown },
    system:   { color: 'text-gold-400',     bg: 'bg-gold-500/10',    icon: faCrown },
};

const PHASE_LABELS: Record<string, string> = {
    preflop: '\u2660 PRE-FLOP',
    flop: '\u2663 FLOP',
    turn: '\u2666 TURN',
    river: '\u2665 RIVER',
    showdown: '\u2694 SHOWDOWN',
};

function parseLogEntry(entry: LogEntry): ParsedLogEntry {
    const { action, time, type, phase = 'preflop', meta } = entry;
    if (type === 'deal' || type === 'system' || type === 'phase' || type === 'winner') {
        return { playerName: null, action, amount: null, time, type, phase, isSystem: true, meta };
    }
    const colonIdx = action.indexOf(':');
    if (colonIdx > 0) {
        const playerName = action.substring(0, colonIdx).trim();
        const rest = action.substring(colonIdx + 1).trim();
        const amountMatch = rest.match(/\$([\d,]+)/);
        const actionWord = rest.replace(/\$[\d,]+/, '').trim();
        return {
            playerName, action: actionWord,
            amount: amountMatch ? amountMatch[0] : null,
            time, phase, meta,
            type: type === 'fold' ? 'fold' : actionWord.toLowerCase().replace(/[^a-z-]/g, '').replace('all-in', 'allin'),
            isSystem: false,
        };
    }
    return { playerName: null, action, amount: null, time, type, phase, isSystem: false, meta };
}

function getActionStyle(type: string) {
    if (ACTION_STYLES[type]) return ACTION_STYLES[type];
    if (type.includes('raise') || type.includes('bet')) return ACTION_STYLES.raise;
    if (type.includes('call')) return ACTION_STYLES.call;
    if (type.includes('check')) return ACTION_STYLES.check;
    if (type.includes('fold')) return ACTION_STYLES.fold;
    if (type.includes('allin') || type.includes('all')) return ACTION_STYLES.allin;
    return ACTION_STYLES.system;
}

function groupLogsByHand(entries: LogEntry[]): HandGroup[] {
    const map = new Map<number, HandGroup>();
    // Entries come newest-first from Redis LPUSH; reverse for chronological order
    const chronological = [...entries].reverse();
    for (const entry of chronological) {
        const handId = entry.handId ?? 0;
        if (!map.has(handId)) {
            map.set(handId, { handId, events: [], winners: [], isActive: true });
        }
        const group = map.get(handId)!;
        const parsed = parseLogEntry(entry);
        group.events.push(parsed);
        if (entry.type === 'winner' && entry.meta?.winners) {
            group.winners = entry.meta.winners;
            group.isActive = false;
        }
    }
    // Return newest hand first
    return Array.from(map.values()).reverse();
}

interface GameInspectorDrawerProps {
    table: GodModeTableDto | null;
    isOpen: boolean;
    onClose: () => void;
    onTerminate: (tableId: string) => void;
    onBroadcast: (tableId: string, message: string) => void;
    onMutePlayer: (tableId: string, playerId: string) => void;
    onForceStand: (tableId: string, seat: number) => void;
}

type MainTabType = 'monitor' | 'config';
type MonitorSubTab = 'players' | 'log' | 'chat';

export const GameInspectorDrawer: React.FC<GameInspectorDrawerProps> = ({
    table,
    isOpen,
    onClose,
    onTerminate,
    onBroadcast,
    onMutePlayer,
    onForceStand,
}) => {
    const [mainTab, setMainTab] = useState<MainTabType>('monitor');
    const [monitorSubTab, setMonitorSubTab] = useState<MonitorSubTab>('players');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [details, setDetails] = useState<InspectorDetails | null>(null);
    const [config, setConfig] = useState<TableConfigDetails | null>(null);
    const [loading, setLoading] = useState(false);

    // Config edit state
    const [showPassword, setShowPassword] = useState(false);
    const [editedConfig, setEditedConfig] = useState<Partial<TableConfigDetails>>({});
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
    const [kickTarget, setKickTarget] = useState<PlayerInfo | null>(null);
    const [kickReason, setKickReason] = useState('');

    // Fetch data when drawer opens + auto-poll every 5s for live updates
    useEffect(() => {
        if (!isOpen || !table) return;

        const fetchData = (showLoading = false) => {
            if (showLoading) setLoading(true);
            Promise.all([
                api.get(`/admin/tables/${table.id}/inspector`),
                api.get(`/admin/tables/${table.id}/config`),
            ])
                .then(([inspectorRes, configRes]) => {
                    setDetails(inspectorRes.data);
                    // Only update config on initial load (don't overwrite user edits)
                    if (showLoading) {
                        setConfig(configRes.data);
                        setEditedConfig({});
                        setHasChanges(false);
                    }
                })
                .catch(err => console.error('Failed to fetch data:', err))
                .finally(() => { if (showLoading) setLoading(false); });
        };

        fetchData(true); // Initial load with spinner
        const interval = setInterval(() => fetchData(false), 5000);
        return () => clearInterval(interval);
    }, [isOpen, table?.id]);

    if (!table) return null;

    const statusColors = {
        RUNNING: 'bg-accent-green',
        PAUSED: 'bg-accent-yellow',
        ERROR: 'bg-danger-red',
        WAITING: 'bg-accent-blue',
    };

    const handleBroadcast = () => {
        if (broadcastMessage.trim()) {
            onBroadcast(table.id, broadcastMessage);
            setBroadcastMessage('');
        }
    };

    const handleConfigChange = (field: keyof TableConfigDetails, value: any) => {
        setEditedConfig(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSaveConfig = async () => {
        if (!hasChanges || !config) return;
        setSaving(true);
        try {
            await api.patch(`/admin/tables/${table.id}`, editedConfig);
            toast.success('Configuration saved!');
            // Refresh config
            const res = await api.get(`/admin/tables/${table.id}/config`);
            setConfig(res.data);
            setEditedConfig({});
            setHasChanges(false);
        } catch (err: any) {
            toast.error(`Save failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleForceSave = async () => {
        try {
            const res = await api.post(`/admin/tables/${table.id}/force-save`);
            toast.success(`State saved! Hand #${res.data.snapshot.handNumber}`);
        } catch (err: any) {
            toast.error(`Force save failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(table.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePauseResume = async () => {
        const isPaused = table.status === 'PAUSED';
        const newStatus = isPaused ? 'RUNNING' : 'PAUSED';
        try {
            await api.patch(`/admin/tables/${table.id}`, { status: newStatus });
            toast.success(isPaused ? 'Table resumed' : 'Table paused');
        } catch (err: any) {
            toast.error(`Action failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const mainTabs = [
        { id: 'monitor' as MainTabType, label: 'Live Monitor', icon: faList },
        { id: 'config' as MainTabType, label: 'Configuration', icon: faCog },
    ];

    const monitorTabs = [
        { id: 'players' as MonitorSubTab, label: 'Players', icon: faUsers },
        { id: 'log' as MonitorSubTab, label: 'Log', icon: faList },
        { id: 'chat' as MonitorSubTab, label: 'Chat', icon: faComments },
    ];

    // Generate empty seats
    const emptySeatNumbers = details
        ? Array.from({ length: details.maxSeats }, (_, i) => i + 1)
            .filter(seat => !details.players.some(p => p.seat === seat))
        : [];

    const getDisplayValue = (field: keyof TableConfigDetails): string | number | undefined => {
        const value = editedConfig[field] !== undefined ? editedConfig[field] : config?.[field];
        // Convert boolean/null to undefined (not valid for input value attribute)
        if (typeof value === 'boolean' || value === null) return undefined;
        return value;
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-surface border-l border-border-dark z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="relative px-5 py-4 border-b border-border-dark bg-gradient-to-r from-surface to-surface-hover">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${table.severity === 'CRITICAL' ? 'bg-danger-red' : table.severity === 'WARNING' ? 'bg-accent-yellow' : 'bg-accent-green'}`} />

                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                {table.name}
                                <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${statusColors[table.status]} text-background`}>
                                    {table.status}
                                </span>
                            </h3>
                            <p className="text-xs text-text-secondary mt-0.5">{table.variantDisplay} • {table.stakes}</p>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-danger-red/20 transition-all">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setShowTerminateConfirm(true)}
                            className="flex-1 py-2 px-3 bg-danger-red text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-danger-red/80 transition-all"
                        >
                            <FontAwesomeIcon icon={faSkullCrossbones} />
                            TERMINATE
                        </button>
                        <div className="flex-1 flex gap-1">
                            <input
                                type="text"
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                placeholder="Broadcast..."
                                className="flex-1 px-2 py-1 bg-surface-hover border border-border-dark rounded-lg text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue"
                                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                            />
                            <button
                                onClick={handleBroadcast}
                                className="px-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/80 transition-all"
                            >
                                <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-border-dark">
                    {mainTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setMainTab(tab.id)}
                            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${mainTab === tab.id ? 'text-accent-yellow border-b-2 border-accent-yellow bg-surface-hover' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            <FontAwesomeIcon icon={tab.icon} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-16">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FontAwesomeIcon icon={faSpinner} className="text-accent-yellow animate-spin text-2xl" />
                        </div>
                    ) : (
                        <>
                            {/* Live Monitor Tab */}
                            {mainTab === 'monitor' && (
                                <div className="flex flex-col h-full">
                                    {/* Vitals Strip — Live from Inspector Polling */}
                                    <div className="grid grid-cols-4 gap-2 p-3 bg-background/50 border-b border-border-dark flex-shrink-0">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
                                                {table.handsPerHour}
                                                {table.handsPerHour > 80 && <FontAwesomeIcon icon={faFire} className="text-accent-yellow text-xs" />}
                                            </p>
                                            <p className="text-xs text-text-secondary">H/hr</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-accent-yellow">${details?.pot ?? table.avgPot}</p>
                                            <p className="text-xs text-text-secondary">Pot</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-accent-green">${table.totalRake}</p>
                                            <p className="text-xs text-text-secondary">Rake</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-text-primary">{details ? `${details.players.length}/${details.maxSeats}` : table.occupancyDisplay}</p>
                                            <p className="text-xs text-text-secondary">Players</p>
                                        </div>
                                    </div>

                                    {/* Terminate Confirmation */}
                                    {showTerminateConfirm && (
                                        <div className="mx-3 mt-3 p-3 bg-danger-red/10 border-2 border-danger-red/50 rounded-lg flex-shrink-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FontAwesomeIcon icon={faSkullCrossbones} className="text-danger-red" />
                                                <span className="text-xs font-bold text-danger-red uppercase">Confirm Termination</span>
                                            </div>
                                            <p className="text-xs text-text-secondary mb-3">This will kick all players, refund active pots, and shut down the table engine. This action cannot be undone.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        onTerminate(table.id);
                                                        setShowTerminateConfirm(false);
                                                    }}
                                                    className="flex-1 py-1.5 bg-danger-red text-white rounded font-bold text-xs hover:bg-danger-red/80 transition-all flex items-center justify-center gap-1"
                                                >
                                                    <FontAwesomeIcon icon={faSkullCrossbones} /> CONFIRM KILL
                                                </button>
                                                <button
                                                    onClick={() => setShowTerminateConfirm(false)}
                                                    className="flex-1 py-1.5 bg-surface-hover text-text-secondary rounded font-bold text-xs hover:text-text-primary transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Security Alert */}
                                    {table.securityAlert && (
                                        <div className="mx-3 mt-3 p-3 bg-danger-red/10 border border-danger-red/30 rounded-lg flex items-center gap-2 animate-pulse flex-shrink-0">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger-red" />
                                            <div>
                                                <p className="text-xs text-danger-red font-bold">Security Alert</p>
                                                <p className="text-xs text-danger-red/80">{table.alertReason}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sub Tabs */}
                                    <div className="flex border-b border-border-dark flex-shrink-0 bg-surface">
                                        {monitorTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setMonitorSubTab(tab.id)}
                                                className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${monitorSubTab === tab.id ? 'text-accent-yellow border-b-2 border-accent-yellow' : 'text-text-secondary hover:text-text-primary'}`}
                                            >
                                                <FontAwesomeIcon icon={tab.icon} />
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sub Tab Content */}
                                    <div className="px-3 py-2 flex-1">
                                        {/* Players Tab */}
                                        {monitorSubTab === 'players' && (
                                            <>
                                            <div className="space-y-2">
                                                {details?.players.length === 0 && (
                                                    <p className="text-xs text-text-secondary text-center py-2">No players seated</p>
                                                )}
                                                {details?.players.map((player) => (
                                                    <div
                                                        key={player.seat}
                                                        className={`flex items-center justify-between p-2 rounded-lg border group ${player.isDuplicateIP ? 'bg-danger-red/10 border-danger-red/30' : 'bg-surface-hover border-border-dark'}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <img
                                                                src={getAvatarUrl(player.avatarId, player.avatarUrl)}
                                                                alt={player.name}
                                                                className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(player.avatarId); }}
                                                            />
                                                            <div>
                                                                <span className="text-sm font-semibold text-text-primary">{player.name}</span>
                                                                <div className={`text-xs font-mono flex items-center gap-1 ${player.isDuplicateIP ? 'text-danger-red' : 'text-text-secondary/60'}`}>
                                                                    <FontAwesomeIcon icon={faWifi} className="text-xs" />
                                                                    {player.ip}
                                                                    {player.isDuplicateIP && <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger-red" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-accent-green font-mono">${player.chips}</span>
                                                            <button
                                                                onClick={() => { setKickTarget(player); setKickReason(''); }}
                                                                className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-danger-red/10 text-danger-red rounded text-xs hover:bg-danger-red hover:text-white transition-all"
                                                                title="Remove player"
                                                            >
                                                                <FontAwesomeIcon icon={faUserMinus} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Empty seats */}
                                                {emptySeatNumbers.slice(0, 3).map((seat) => (
                                                    <div key={`empty-${seat}`} className="flex items-center justify-between p-2 rounded-lg border border-dashed border-border-dark bg-surface/50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-surface-hover text-text-secondary/50 text-xs font-bold flex items-center justify-center">
                                                                {seat}
                                                            </span>
                                                            <span className="text-xs text-text-secondary/50 italic">Empty</span>
                                                        </div>
                                                        <button className="px-2 py-1 bg-accent-blue/10 text-accent-blue rounded text-xs hover:bg-accent-blue hover:text-white transition-all">
                                                            Force Sit
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Kick Confirmation Modal */}
                                            {kickTarget && (
                                                <div className="mt-3 p-3 bg-danger-red/10 border border-danger-red/30 rounded-lg space-y-3 animate-fade-in">
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faUserMinus} className="text-danger-red" />
                                                        <span className="text-sm font-bold text-danger-red">Remove {kickTarget.name}?</span>
                                                    </div>
                                                    <textarea
                                                        value={kickReason}
                                                        onChange={(e) => setKickReason(e.target.value.substring(0, 200))}
                                                        placeholder="Reason / Note to player (optional)..."
                                                        className="w-full bg-surface border border-border-dark rounded-lg p-2 text-xs text-text-primary placeholder-text-secondary/50 resize-none h-16 focus:border-danger-red/50 outline-none"
                                                        maxLength={200}
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-text-secondary/50">{kickReason.length}/200</span>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setKickTarget(null)}
                                                                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-surface-hover rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await api.post(`/admin/tables/${table.id}/kick`, {
                                                                            seat: kickTarget.seat,
                                                                            playerId: kickTarget.userId,
                                                                            reason: kickReason || undefined,
                                                                        });
                                                                        toast.success(`${kickTarget.name} has been removed`);
                                                                        setKickTarget(null);
                                                                    } catch (err: any) {
                                                                        toast.error(`Kick failed: ${err.response?.data?.message || err.message}`);
                                                                    }
                                                                }}
                                                                className="px-3 py-1.5 text-xs font-bold bg-danger-red text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <FontAwesomeIcon icon={faSkullCrossbones} className="text-[10px]" />
                                                                Confirm Kick
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            </>
                                        )}

                                        {/* Log Tab — Hand-Grouped Accordion Timeline */}
                                        {monitorSubTab === 'log' && (
                                            <LogAccordionTab details={details} />
                                        )}

                                        {/* Chat Tab — Premium Bubble UI */}
                                        {monitorSubTab === 'chat' && (
                                            <div className="space-y-1">
                                                {(!details?.chat || details.chat.length === 0) && (
                                                    <div className="text-center py-8">
                                                        <FontAwesomeIcon icon={faComments} className="text-2xl text-text-secondary/30 mb-2" />
                                                        <p className="text-xs text-text-secondary/50">No chat messages</p>
                                                    </div>
                                                )}
                                                {(details?.chat || []).map((msg, i) => {
                                                    // Generate consistent color from username
                                                    const CHAT_COLORS = [
                                                        { bg: 'bg-rose-500/20', text: 'text-rose-400', ring: 'ring-rose-500/30' },
                                                        { bg: 'bg-cyan-500/20', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
                                                        { bg: 'bg-amber-500/20', text: 'text-amber-400', ring: 'ring-amber-500/30' },
                                                        { bg: 'bg-emerald-500/20', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
                                                        { bg: 'bg-violet-500/20', text: 'text-violet-400', ring: 'ring-violet-500/30' },
                                                        { bg: 'bg-blue-500/20', text: 'text-blue-400', ring: 'ring-blue-500/30' },
                                                        { bg: 'bg-pink-500/20', text: 'text-pink-400', ring: 'ring-pink-500/30' },
                                                        { bg: 'bg-orange-500/20', text: 'text-orange-400', ring: 'ring-orange-500/30' },
                                                    ];
                                                    const hash = msg.user.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                                                    const color = CHAT_COLORS[hash % CHAT_COLORS.length];
                                                    const initial = msg.user.charAt(0).toUpperCase();

                                                    return (
                                                        <div key={i} className="flex items-start gap-2.5 py-1.5 px-1 rounded-lg hover:bg-surface-hover/50 transition-colors group">
                                                            {/* Avatar */}
                                                            <img
                                                                src={getAvatarUrl(msg.avatarId, msg.avatarUrl)}
                                                                alt={msg.user}
                                                                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(msg.avatarId); }}
                                                            />
                                                            {/* Message Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-baseline gap-1.5">
                                                                    <span className={`text-xs font-bold ${color.text}`}>{msg.user}</span>
                                                                    <span className="text-[10px] text-text-secondary/30 font-mono">
                                                                        {new Date(msg.time).toLocaleTimeString('en-US', { hour12: false })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-text-primary/90 mt-0.5 break-words">{msg.message}</p>
                                                            </div>
                                                            {/* Mute Button */}
                                                            {msg.userId && (
                                                                <button
                                                                    onClick={() => onMutePlayer(table.id, msg.userId!)}
                                                                    className="opacity-0 group-hover:opacity-100 mt-1 px-1.5 py-0.5 bg-danger-red/10 text-danger-red rounded text-[10px] hover:bg-danger-red hover:text-white transition-all flex-shrink-0"
                                                                    title="Mute player"
                                                                >
                                                                    <FontAwesomeIcon icon={faBan} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Configuration Tab */}
                            {mainTab === 'config' && config && (
                                <div className="p-4 space-y-4">
                                    {/* Identity Section */}
                                    <div className="bg-surface-hover rounded-xl p-4 border border-border-dark">
                                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Identity</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-text-secondary">Name</span>
                                                <span className="text-sm text-text-primary font-semibold">{config.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-text-secondary">UUID</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-text-secondary">{config.id.slice(0, 8)}...</span>
                                                    <button onClick={handleCopyId} className="text-text-secondary hover:text-accent-yellow transition-colors">
                                                        <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-text-secondary">Variant</span>
                                                <span className="text-sm text-text-primary">{config.variant}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Locked Fields */}
                                    <div className="bg-surface-hover/50 rounded-xl p-4 border border-border-dark/50">
                                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faLock} className="text-text-secondary/50" />
                                            Structure (Locked)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 opacity-60">
                                            <div className="p-2 bg-surface rounded border border-border-dark">
                                                <p className="text-xs text-text-secondary">Blinds</p>
                                                <p className="text-sm text-text-primary font-mono">${config.smallBlind}/${config.bigBlind}</p>
                                            </div>
                                            <div className="p-2 bg-surface rounded border border-border-dark">
                                                <p className="text-xs text-text-secondary">Buy-in</p>
                                                <p className="text-sm text-text-primary font-mono">${config.minBuyIn}-${config.maxBuyIn}</p>
                                            </div>
                                            <div className="p-2 bg-surface rounded border border-border-dark">
                                                <p className="text-xs text-text-secondary">Max Seats</p>
                                                <p className="text-sm text-text-primary font-mono">{config.maxSeats}</p>
                                            </div>
                                            <div className="p-2 bg-surface rounded border border-border-dark">
                                                <p className="text-xs text-text-secondary">Ante</p>
                                                <p className="text-sm text-text-primary font-mono">${config.ante}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="bg-surface-hover rounded-xl p-4 border border-accent-yellow/20">
                                        <h4 className="text-xs font-bold text-accent-yellow uppercase tracking-wider mb-3">Editable (Hot)</h4>

                                        {/* Password */}
                                        <div className="mb-4">
                                            <label className="text-xs text-text-secondary mb-1 block">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={String(getDisplayValue('password') || '')}
                                                    onChange={(e) => handleConfigChange('password', e.target.value || null)}
                                                    placeholder="No password"
                                                    className="w-full px-3 py-2 pr-10 bg-surface border border-border-dark rounded-lg text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-yellow"
                                                />
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Rake */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div>
                                                <label className="text-xs text-text-secondary mb-1 block">Rake %</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    value={getDisplayValue('rakePercent') || 0}
                                                    onChange={(e) => handleConfigChange('rakePercent', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-surface border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-text-secondary mb-1 block">Rake Cap $</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={getDisplayValue('rakeCap') || 0}
                                                    onChange={(e) => handleConfigChange('rakeCap', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-surface border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                                />
                                            </div>
                                        </div>

                                        {/* Time Controls */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs text-text-secondary mb-1 block">Turn Time (s)</label>
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="120"
                                                    value={getDisplayValue('turnTime') || 30}
                                                    onChange={(e) => handleConfigChange('turnTime', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-surface border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-text-secondary mb-1 block">Time Bank (s)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="300"
                                                    value={getDisplayValue('timeBank') || 60}
                                                    onChange={(e) => handleConfigChange('timeBank', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 bg-surface border border-border-dark rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-yellow"
                                                />
                                            </div>
                                        </div>

                                        {/* Save Button */}
                                        {hasChanges && (
                                            <button
                                                onClick={handleSaveConfig}
                                                disabled={saving}
                                                className="w-full mt-4 py-2 bg-accent-yellow text-background rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-yellow/80 transition-all disabled:opacity-50"
                                            >
                                                <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? 'animate-spin' : ''} />
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-danger-red/5 rounded-xl p-4 border border-danger-red/30">
                                        <h4 className="text-xs font-bold text-danger-red uppercase tracking-wider mb-3">Danger Zone</h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={handlePauseResume}
                                                className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${table.status === 'PAUSED'
                                                    ? 'bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20'
                                                    : 'bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow hover:bg-accent-yellow/20'
                                                    }`}
                                            >
                                                <FontAwesomeIcon icon={table.status === 'PAUSED' ? faPlay : faPause} />
                                                {table.status === 'PAUSED' ? 'Resume Table' : 'Pause Table'}
                                            </button>
                                            <button
                                                onClick={handleForceSave}
                                                className="w-full py-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-accent-blue/20 transition-all"
                                            >
                                                <FontAwesomeIcon icon={faDatabase} />
                                                Force Save State
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-surface border-t border-border-dark text-xs text-text-secondary/50 font-mono">
                    <div className="flex justify-between">
                        <span>Uptime: {table.uptime}</span>
                        <span>Hand #{details?.handNumber || '—'}</span>
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================================
// LOG ACCORDION TAB — Hand-Grouped Collapsible Timeline
// ============================================================
const LogAccordionTab: React.FC<{ details: InspectorDetails | null }> = ({ details }) => {
    const [expandedHands, setExpandedHands] = useState<Set<number>>(new Set());

    const handGroups = useMemo(() => {
        if (!details?.liveLog || details.liveLog.length === 0) return [];
        return groupLogsByHand(details.liveLog);
    }, [details?.liveLog]);

    // Auto-expand the latest hand
    useEffect(() => {
        if (handGroups.length > 0) {
            setExpandedHands(prev => {
                const next = new Set(prev);
                next.add(handGroups[0].handId);
                return next;
            });
        }
    }, [handGroups.length > 0 ? handGroups[0]?.handId : null]);

    const toggleHand = (handId: number) => {
        setExpandedHands(prev => {
            const next = new Set(prev);
            if (next.has(handId)) next.delete(handId);
            else next.add(handId);
            return next;
        });
    };

    if (!details?.liveLog || details.liveLog.length === 0) {
        return (
            <div className="text-center py-8">
                <FontAwesomeIcon icon={faList} className="text-2xl text-text-secondary/30 mb-2" />
                <p className="text-xs text-text-secondary/50">No activity logged</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <AnimatePresence initial={false}>
                {handGroups.map((hand) => {
                    const isExpanded = expandedHands.has(hand.handId);
                    const winnerText = hand.winners.length > 0
                        ? hand.winners.map(w => `${w.name} $${w.amount}`).join(', ')
                        : null;

                    return (
                        <motion.div
                            key={hand.handId}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-lg border border-border-dark/60 overflow-hidden bg-surface/40"
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleHand(hand.handId)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-hover/50 transition-colors text-left"
                            >
                                {/* Expand indicator */}
                                <FontAwesomeIcon
                                    icon={faLayerGroup}
                                    className={`text-[10px] text-text-secondary/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                />
                                {/* Hand number */}
                                <span className="text-xs font-bold text-text-primary">Hand #{hand.handId}</span>

                                {/* Status indicator */}
                                {hand.isActive ? (
                                    <span className="flex items-center gap-1 ml-auto">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 font-semibold">LIVE</span>
                                    </span>
                                ) : winnerText ? (
                                    <span className="flex items-center gap-1 ml-auto text-[10px]">
                                        <FontAwesomeIcon icon={faCrown} className="text-gold-500 text-[9px]" />
                                        <span className="text-gold-400 font-bold truncate max-w-[120px]">{winnerText}</span>
                                    </span>
                                ) : null}
                            </button>

                            {/* Accordion Content */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-2 pb-2 pt-0.5">
                                            <div className="relative pl-4 border-l-2 border-border-dark/40 space-y-0.5">
                                                {hand.events.map((parsed, i) => {
                                                    const prevPhase = i > 0 ? hand.events[i - 1].phase : null;
                                                    const showPhaseSeparator = parsed.phase !== prevPhase && i > 0 && parsed.type !== 'deal';
                                                    const style = getActionStyle(parsed.type);
                                                    const timeStr = new Date(parsed.time).toLocaleTimeString('en-US', { hour12: false });

                                                    return (
                                                        <React.Fragment key={`${parsed.time}-${i}`}>
                                                            {/* Phase Separator */}
                                                            {showPhaseSeparator && (
                                                                <div className="relative -ml-4 pl-4 py-1">
                                                                    <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-400/20" />
                                                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/5 border border-dashed border-cyan-500/15">
                                                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300/80">
                                                                            {PHASE_LABELS[parsed.phase] || parsed.phase.toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Winner Row */}
                                                            {parsed.type === 'winner' ? (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="relative -ml-4 pl-4 py-1"
                                                                >
                                                                    <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold-500 ring-2 ring-gold-500/30" />
                                                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20">
                                                                        <FontAwesomeIcon icon={faCrown} className="text-xs text-gold-500" />
                                                                        <span className="text-xs font-bold text-gold-400">{parsed.action}</span>
                                                                        <span className="text-[10px] text-text-secondary/40 font-mono ml-auto">{timeStr}</span>
                                                                    </div>
                                                                </motion.div>
                                                            ) : parsed.type === 'deal' ? (
                                                                /* Deal Row */
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -6 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    className="relative -ml-4 pl-4 py-1"
                                                                >
                                                                    <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-blue-400/20" />
                                                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 border border-dashed border-blue-500/15">
                                                                        <FontAwesomeIcon icon={faLayerGroup} className="text-xs text-blue-400" />
                                                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{parsed.action}</span>
                                                                        <span className="text-[10px] text-text-secondary/40 font-mono ml-auto">{timeStr}</span>
                                                                    </div>
                                                                </motion.div>
                                                            ) : parsed.type === 'phase' ? (
                                                                /* Phase event from backend (already handled by separator — skip render) */
                                                                null
                                                            ) : parsed.type === 'system' ? (
                                                                /* System Row */
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -6 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    className="relative -ml-4 pl-4 py-1"
                                                                >
                                                                    <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold-500 ring-2 ring-gold-500/30" />
                                                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-gold-500/5 border border-dashed border-gold-500/15">
                                                                        <FontAwesomeIcon icon={style.icon} className={`text-xs ${style.color}`} />
                                                                        <span className={`text-xs font-bold uppercase tracking-wider ${style.color}`}>{parsed.action}</span>
                                                                        <span className="text-[10px] text-text-secondary/40 font-mono ml-auto">{timeStr}</span>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                /* Player Action Row */
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -4 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ duration: 0.15, delay: i * 0.015 }}
                                                                    className="relative py-0.5 group"
                                                                >
                                                                    <div className={`absolute -left-[9px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                                                                        parsed.type === 'fold' ? 'bg-red-400/60' : 'bg-text-secondary/25'
                                                                    } group-hover:scale-150 transition-transform`} />
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.color} ${style.bg}`}>
                                                                            <FontAwesomeIcon icon={style.icon} className="text-[9px]" />
                                                                            {style.label || parsed.action}
                                                                        </span>
                                                                        {parsed.playerName && (
                                                                            <span className="text-xs font-semibold text-text-primary/80">{parsed.playerName}</span>
                                                                        )}
                                                                        {parsed.amount && (
                                                                            <span className="text-xs font-bold text-emerald-400 font-mono">{parsed.amount}</span>
                                                                        )}
                                                                        <span className="text-[10px] text-text-secondary/25 font-mono ml-auto">{timeStr}</span>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
