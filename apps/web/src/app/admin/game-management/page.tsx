'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { GodModeDashboardResponse, GodModeTableDto, AdminTableActionDto } from '@poker/shared';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faTable,
    faFire,
    faExclamationTriangle,
    faShieldAlt,
    faUsers,
    faCoins,
    faCircle,
    faChartLine,
    faBolt,
    faSort,
    faSortUp,
    faSortDown,
    faLock
} from '@fortawesome/free-solid-svg-icons';
import { CreateTableModal } from '@/components/modals/CreateTableModal';
import { GameInspectorDrawer } from '@/components/admin/GameInspectorDrawer';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { toast } from 'sonner';

type SortKey = 'name' | 'status' | 'handsPerHour' | 'activePlayers' | 'totalRake';
type SortDirection = 'asc' | 'desc';

export default function GameManagementPage() {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTable, setSelectedTable] = useState<GodModeTableDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Sorting state
    const [sortKey, setSortKey] = useState<SortKey>('handsPerHour');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Fetch God Mode Dashboard
    const { data, isLoading, error, refetch, isFetching } = useQuery<GodModeDashboardResponse>({
        queryKey: ['god-mode-dashboard'],
        queryFn: async () => {
            const { data } = await api.get('/admin/tables/dashboard');
            return data;
        },
        refetchInterval: 5000,
    });

    // Sorted tables
    const sortedTables = useMemo(() => {
        if (!data?.tables) return [];
        return [...data.tables].sort((a, b) => {
            let aVal: any = a[sortKey];
            let bVal: any = b[sortKey];

            // Handle status sorting
            if (sortKey === 'status') {
                const statusOrder = { RUNNING: 0, PAUSED: 1, WAITING: 2, ERROR: 3 };
                aVal = statusOrder[a.status] ?? 99;
                bVal = statusOrder[b.status] ?? 99;
            }

            if (typeof aVal === 'string') {
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [data?.tables, sortKey, sortDirection]);

    // Handle column sort
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    // Action Mutation
    const actionMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: AdminTableActionDto['action'] }) => {
            await api.post(`/admin/tables/${id}/status`, { action });
        },
        onSuccess: (_, variables) => {
            toast.success(`Table ${variables.action} successful`);
            queryClient.invalidateQueries({ queryKey: ['god-mode-dashboard'] });
        },
        onError: (err: any) => {
            toast.error(`Action failed: ${err.response?.data?.message || err.message}`);
        },
    });

    const handleRowClick = (table: GodModeTableDto) => {
        setSelectedTable(table);
        setIsDrawerOpen(true);
    };

    const handleTerminate = async (tableId: string) => {
        actionMutation.mutate({ id: tableId, action: 'CLOSE' });
        setIsDrawerOpen(false);
    };

    const handleBroadcast = async (tableId: string, message: string) => {
        try {
            await api.post(`/admin/tables/${tableId}/broadcast`, { message });
            toast.success('Broadcast sent!');
        } catch (err: any) {
            toast.error(`Broadcast failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleMutePlayer = async (tableId: string, playerId: string) => {
        try {
            await api.post(`/admin/tables/${tableId}/players/${playerId}/mute`, { durationMinutes: 10 });
            toast.success('Player muted for 10 minutes');
        } catch (err: any) {
            toast.error(`Mute failed: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleForceStand = async (tableId: string, seat: number) => {
        try {
            await api.post(`/admin/tables/${tableId}/players/${seat}/force-stand`);
            toast.success('Player removed from seat');
            refetch();
        } catch (err: any) {
            toast.error(`Force stand failed: ${err.response?.data?.message || err.message}`);
        }
    };

    // 🟡 AGGREGATION ENGINE: Dynamic reduction of live tables array
    // All global cards are derived from this memo — when tables array updates
    // (via 5s refetch or socket push), all cards re-render automatically.
    const globalStats = useMemo(() => {
        const tables = data?.tables ?? [];
        const runningTables = tables.filter(t => t.status === 'RUNNING');
        const totalPlayers = tables.reduce((sum, t) => sum + t.activePlayers, 0);
        const totalRake = tables.reduce((sum, t) => sum + t.totalRake, 0);
        const totalHandsPerHour = tables.reduce((sum, t) => sum + t.handsPerHour, 0);
        const avgHandsPerHour = runningTables.length > 0
            ? Math.round(totalHandsPerHour / runningTables.length)
            : 0;
        const alertCount = tables.filter(t => t.securityAlert).length;

        return {
            totalTables: tables.length,
            runningTables: runningTables.length,
            totalPlayers,
            totalRake,
            avgHandsPerHour,
            alertCount,
        };
    }, [data?.tables]);

    if (isLoading) {
        return <LoadingScreen fullScreen={false} message="Loading Command Center..." className="h-64" />;
    }

    if (error) {
        return (
            <div className="bg-danger-red/10 border border-danger-red p-6 rounded-xl text-center">
                <h2 className="text-xl font-bold text-danger-red mb-2">Failed to Load Dashboard</h2>
                <p className="text-text-secondary mb-4">The aggregator could not reach the backend.</p>
                <button
                    onClick={() => refetch()}
                    className="bg-danger-red text-white px-4 py-2 rounded-lg hover:bg-opacity-80 transition"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                        <FontAwesomeIcon icon={faBolt} className="text-accent-yellow" />
                        Command Center
                    </h1>
                    <p className="text-text-secondary">Real-time table monitoring and operator controls.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-hover rounded-lg">
                        <span className={`w-2 h-2 rounded-full ${isFetching ? 'bg-accent-yellow animate-pulse' : 'bg-accent-green'}`} />
                        <span className="text-xs text-text-secondary">LIVE</span>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gold-gradient text-background px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-accent-yellow/20 transition-all flex items-center gap-2 font-bold"
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        Create Table
                    </button>
                </div>
            </div>

            <CreateTableModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <GameInspectorDrawer
                table={selectedTable}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onTerminate={handleTerminate}
                onBroadcast={handleBroadcast}
                onMutePlayer={handleMutePlayer}
                onForceStand={handleForceStand}
            />

            {/* Summary Cards — Bound to useMemo aggregation engine */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <SummaryCard icon={faTable} label="Tables" value={globalStats.totalTables.toString()} subtext={`${globalStats.runningTables} running`} color="text-accent-blue" />
                <SummaryCard icon={faUsers} label="Players" value={globalStats.totalPlayers.toString()} color="text-accent-green" />
                <SummaryCard icon={faCoins} label="Total Rake" value={`$${globalStats.totalRake}`} color="text-accent-yellow" />
                <SummaryCard icon={faChartLine} label="Avg H/hr" value={globalStats.avgHandsPerHour.toString()} color="text-accent-blue" />
                <SummaryCard icon={faExclamationTriangle} label="Alerts" value={globalStats.alertCount.toString()} color={globalStats.alertCount > 0 ? 'text-danger-red' : 'text-accent-green'} highlight={globalStats.alertCount > 0} />
            </div>

            {/* Sortable Data Grid */}
            <div className="bg-surface rounded-2xl border border-border-dark overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border-dark bg-surface-hover">
                            <SortableHeader label="Status" sortKey="status" currentKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Table" sortKey="name" currentKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Vitals" sortKey="handsPerHour" currentKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Players" sortKey="activePlayers" currentKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            <SortableHeader label="Rake" sortKey="totalRake" currentKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            <th className="text-left py-2 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Security</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTables.map((table) => (
                            <tr
                                key={table.id}
                                onClick={() => handleRowClick(table)}
                                className={`border-b border-border-dark hover:bg-surface-hover cursor-pointer transition-colors group ${table.securityAlert ? 'bg-danger-red/5' : ''}`}
                            >
                                <td className="py-2 px-4"><StatusBadge status={table.status} /></td>
                                <td className="py-2 px-4">
                                    <div className="font-semibold text-sm text-text-primary group-hover:text-accent-yellow transition-colors flex items-center gap-2">
                                        {table.name}
                                        {table.isPrivate && (
                                            <FontAwesomeIcon icon={faLock} className="text-[10px] text-amber-400" title="Private Table" />
                                        )}
                                    </div>
                                    <div className="text-xs text-text-secondary">{table.variantDisplay} • {table.stakes}</div>
                                </td>
                                <td className="py-2 px-4 text-xs">
                                    <span className="text-text-primary font-semibold">{table.handsPerHour}</span>
                                    <span className="text-text-secondary"> H/hr</span>
                                    {table.handsPerHour > 80 && <FontAwesomeIcon icon={faFire} className="ml-1 text-accent-yellow" />}
                                    <span className="text-text-secondary"> | </span>
                                    <span className="text-accent-yellow">${table.avgPot}</span>
                                </td>
                                <td className="py-2 px-4"><OccupancyBar current={table.activePlayers} max={table.maxSeats} /></td>
                                <td className="py-2 px-4 text-xs">
                                    <span className="text-accent-green font-bold">${table.totalRake}</span>
                                    <span className="text-text-secondary ml-1">({table.rakePercent}%)</span>
                                </td>
                                <td className="py-2 px-4">
                                    {table.securityAlert ? (
                                        <div className="flex items-center gap-1.5 text-danger-red">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="animate-pulse" />
                                            <span className="text-xs font-bold">ALERT</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-accent-green/60">
                                            <FontAwesomeIcon icon={faShieldAlt} className="text-xs" />
                                            <span className="text-xs">OK</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sortedTables.length === 0 && (
                    <div className="py-12 text-center">
                        <FontAwesomeIcon icon={faTable} className="text-4xl text-text-secondary/30 mb-4" />
                        <p className="text-text-secondary">No active tables. Create one to start monitoring.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================
// Sub-Components
// ============================================================

function SortableHeader({
    label,
    sortKey,
    currentKey,
    direction,
    onSort
}: {
    label: string;
    sortKey: SortKey;
    currentKey: SortKey;
    direction: SortDirection;
    onSort: (key: SortKey) => void;
}) {
    const isActive = currentKey === sortKey;
    return (
        <th
            className="text-left py-2 px-4 text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary transition-colors select-none"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                <FontAwesomeIcon
                    icon={isActive ? (direction === 'asc' ? faSortUp : faSortDown) : faSort}
                    className={`text-xs ${isActive ? 'text-accent-yellow' : 'text-text-secondary/50'}`}
                />
            </div>
        </th>
    );
}

function SummaryCard({ icon, label, value, subtext, color, highlight }: { icon: any; label: string; value: string; subtext?: string; color: string; highlight?: boolean; }) {
    return (
        <div className={`p-4 rounded-xl border ${highlight ? 'bg-danger-red/10 border-danger-red/30 animate-pulse' : 'bg-surface border-border-dark'}`}>
            <div className="flex items-center gap-2 text-text-secondary mb-2">
                <FontAwesomeIcon icon={icon} className={color} />
                <span className="text-xs font-semibold uppercase">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            {subtext && <div className="text-xs text-text-secondary mt-1">{subtext}</div>}
        </div>
    );
}

function StatusBadge({ status }: { status: GodModeTableDto['status'] }) {
    const config = {
        RUNNING: { bg: 'bg-accent-green', text: 'text-background', label: 'RUN' },
        PAUSED: { bg: 'bg-accent-yellow', text: 'text-background', label: 'PAUSE' },
        ERROR: { bg: 'bg-danger-red', text: 'text-white', label: 'ERR' },
        WAITING: { bg: 'bg-accent-blue/20', text: 'text-accent-blue', label: 'WAIT' },
    }[status];
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.bg} ${config.text}`}>{config.label}</span>;
}

function OccupancyBar({ current, max }: { current: number; max: number }) {
    const percentage = (current / max) * 100;
    const isFull = current >= max;
    return (
        <div className="flex items-center gap-2">
            <div className="w-12 h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${isFull ? 'bg-danger-red' : percentage > 70 ? 'bg-accent-yellow' : 'bg-accent-green'}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`text-xs font-mono ${isFull ? 'text-danger-red' : 'text-text-secondary'}`}>{current}/{max}</span>
        </div>
    );
}
