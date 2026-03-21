'use client';

import { useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faSearch,
    faPlay,
    faClock,
    faInfoCircle,
    faSpinner,
    faTrophy,
    faCalendarAlt,
    faPause,
    faCheckCircle,
    faBan,
} from '@fortawesome/free-solid-svg-icons';
import DataTable, { Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import { useAdminTournaments } from '@/hooks/useAdminTournaments';
import {
    TournamentResponseDto,
    TournamentGameTypeEnum,
    TournamentGameTypeDisplayNames,
    TournamentEntryFormatEnum,
    TournamentEntryFormatDisplayNames,
    BlindStructureSpeedEnum,
    BlindStructureSpeedDisplayNames,
    LateRegistrationWindowEnum,
    PayoutStructureEnum,
    CreateTournamentDto,
} from '@poker/shared';
import LoadingScreen from '@/components/ui/LoadingScreen';

type FilterStatus = 'all' | 'ANNOUNCED' | 'REGISTERING' | 'RUNNING' | 'FINISHED' | 'CANCELLED';

const INITIAL_FORM: CreateTournamentDto = {
    name: '',
    description: '',
    password: null,
    gameType: 'TEXAS_HOLDEM',
    entryFormat: 'REGULAR',
    buyIn: 0,
    fee: 0,
    guaranteedPrizePool: 0,
    bountyAmount: null,
    startingChips: 10000,
    blindStructure: 'REGULAR',
    seatCap: null,
    minPlayersToStart: 2,
    payoutStructure: 'TOP_15_PERCENT',
    startTime: new Date(),
    lateRegistration: 'SIXTY_MINUTES',
    autoStart: true,
    rebuyEnabled: false,
    rebuyCost: null,
    rebuyChips: null,
    addonEnabled: false,
    addonCost: null,
    addonChips: null,
    maxReEntries: null,
    reEntryWindow: null,
};

const STATUS_ICON_MAP: Record<string, any> = {
    ANNOUNCED: faCalendarAlt,
    REGISTERING: faTrophy,
    LATE_REG: faClock,
    RUNNING: faPlay,
    ON_BREAK: faPause,
    PAUSED: faPause,
    FINISHED: faCheckCircle,
    CANCELLED: faBan,
};

const STATUS_COLOR_MAP: Record<string, string> = {
    ANNOUNCED: 'bg-accent-blue text-white',
    REGISTERING: 'bg-accent-green text-white',
    LATE_REG: 'bg-accent-yellow text-black',
    RUNNING: 'bg-accent-green text-white',
    ON_BREAK: 'bg-accent-yellow text-black',
    PAUSED: 'bg-accent-yellow text-black',
    FINISHED: 'bg-text-secondary text-black',
    CANCELLED: 'bg-danger-red text-white',
};

export default function TournamentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<TournamentResponseDto | null>(null);
    const [formData, setFormData] = useState<CreateTournamentDto>({ ...INITIAL_FORM });

    // React Query hook
    const {
        tournaments,
        totalPages,
        isLoading,
        createTournament,
        isCreating,
        updateTournament,
        isUpdating,
        deleteTournament,
        isDeleting,
    } = useAdminTournaments({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 20,
    });

    const updateField = useCallback(<K extends keyof CreateTournamentDto>(field: K, value: CreateTournamentDto[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const openEditModal = (tournament: TournamentResponseDto) => {
        setSelectedTournament(tournament);
        setFormData({
            name: tournament.name,
            description: tournament.description,
            password: null,
            gameType: tournament.gameType,
            entryFormat: tournament.entryFormat,
            buyIn: tournament.buyIn,
            fee: tournament.fee,
            guaranteedPrizePool: tournament.guaranteedPrizePool,
            bountyAmount: tournament.bountyAmount,
            startingChips: tournament.startingChips,
            blindStructure: tournament.blindStructure,
            seatCap: tournament.seatCap,
            minPlayersToStart: tournament.minPlayersToStart,
            payoutStructure: tournament.payoutStructure,
            startTime: new Date(tournament.startTime),
            lateRegistration: tournament.lateRegistration,
            autoStart: tournament.autoStart,
            rebuyEnabled: tournament.rebuyEnabled,
            rebuyCost: null,
            rebuyChips: null,
            addonEnabled: tournament.addonEnabled,
            addonCost: null,
            addonChips: null,
            maxReEntries: null,
            reEntryWindow: null,
        });
        setIsEditModalOpen(true);
    };

    const handleCreate = () => {
        createTournament(formData, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setFormData({ ...INITIAL_FORM });
            },
        });
    };

    const handleUpdate = () => {
        if (!selectedTournament) return;
        updateTournament({ id: selectedTournament.id, dto: formData }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedTournament(null);
            },
        });
    };

    const handleDelete = () => {
        if (!selectedTournament) return;
        deleteTournament(selectedTournament.id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedTournament(null);
            },
        });
    };

    const filterButtons: { status: FilterStatus; label: string; color: string }[] = [
        { status: 'all', label: 'All', color: 'bg-accent-yellow text-black' },
        { status: 'ANNOUNCED', label: 'Announced', color: 'border-accent-blue text-accent-blue hover:bg-accent-blue hover:text-white' },
        { status: 'REGISTERING', label: 'Registering', color: 'border-accent-green text-accent-green hover:bg-accent-green hover:text-white' },
        { status: 'RUNNING', label: 'Running', color: 'border-accent-green text-accent-green hover:bg-accent-green hover:text-white' },
        { status: 'FINISHED', label: 'Finished', color: 'border-text-secondary text-text-secondary hover:bg-text-secondary hover:text-black' },
    ];

    const columns: Column<TournamentResponseDto>[] = [
        {
            key: 'name',
            header: 'Tournament Name',
            width: '2fr',
            render: (row) => (
                <div>
                    <p className="font-bold">{row.name}</p>
                    <p className="text-text-secondary text-sm">
                        {TournamentGameTypeDisplayNames[row.gameType]} • {TournamentEntryFormatDisplayNames[row.entryFormat]}
                    </p>
                </div>
            ),
        },
        {
            key: 'startTime',
            header: 'Start Time',
            width: '1.5fr',
            render: (row) => {
                const date = new Date(row.startTime);
                return (
                    <div>
                        <p className="font-semibold">{date.toLocaleDateString()}</p>
                        <p className="text-text-secondary text-sm">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                );
            },
        },
        {
            key: 'buyIn',
            header: 'Buy-in & Fee',
            width: '1fr',
            render: (row) => (
                <div>
                    <p className="text-accent-yellow font-bold">
                        {row.buyIn === 0 ? 'FREE' : `$${row.buyIn.toLocaleString()}`}
                    </p>
                    <p className="text-text-secondary text-sm">
                        {row.fee > 0 ? `+$${row.fee} fee` : 'No fee'}
                    </p>
                </div>
            ),
        },
        {
            key: 'guaranteedPrizePool',
            header: 'Prize Pool',
            width: '1.2fr',
            render: (row) => (
                <div>
                    <p className="text-accent-yellow font-bold text-lg">
                        ${(row.actualPrizePool || row.guaranteedPrizePool).toLocaleString()}
                    </p>
                    <p className="text-text-secondary text-sm">
                        {row.totalEntries} entries
                    </p>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '1fr',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit ${STATUS_COLOR_MAP[row.status] || 'bg-text-secondary text-black'}`}>
                    <FontAwesomeIcon icon={STATUS_ICON_MAP[row.status] || faClock} className="text-xs" />
                    {row.status.replace('_', ' ')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '1fr',
            align: 'right',
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => openEditModal(row)}
                        className="bg-accent-yellow hover:bg-yellow-500 text-black px-3 py-2 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    >
                        <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                        onClick={() => { setSelectedTournament(row); setIsDeleteModalOpen(true); }}
                        className="bg-danger-red hover:bg-red-600 text-white px-3 py-2 rounded-xl transition-all"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return <LoadingScreen fullScreen={false} message="Loading tournaments..." className="h-64" />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Manage Tournaments</h2>
                    <p className="text-text-secondary">Admin panel to create, edit, delete, and monitor real-money poker tournaments</p>
                </div>
                <button
                    onClick={() => { setFormData({ ...INITIAL_FORM }); setIsCreateModalOpen(true); }}
                    className="bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)] px-6 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all"
                >
                    <FontAwesomeIcon icon={faPlus} />
                    New Tournament
                </button>
            </section>

            {/* Filters and Search */}
            <section className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.status}
                            onClick={() => { setFilterStatus(btn.status); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${filterStatus === btn.status
                                ? btn.color
                                : `bg-transparent border ${btn.color}`
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                    />
                    <input
                        type="text"
                        placeholder="Search tournaments..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="bg-card-bg border border-border-dark rounded-xl pl-10 pr-4 py-2 focus:border-accent-yellow focus:outline-none focus:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all"
                    />
                </div>
            </section>

            {/* Tournaments Table */}
            <DataTable
                columns={columns}
                data={tournaments}
                keyExtractor={(row) => row.id}
                emptyMessage="No tournaments found"
            />

            {/* Pagination */}
            <div className="flex justify-center">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages || 1}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Create Tournament Modal */}
            <AdminModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Tournament"
                maxWidth="2xl"
            >
                <TournamentForm
                    isEdit={false}
                    formData={formData}
                    updateField={updateField}
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateModalOpen(false)}
                    isSubmitting={isCreating}
                />
            </AdminModal>

            {/* Edit Tournament Modal */}
            <AdminModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={`Edit Tournament - ${selectedTournament?.name || ''}`}
                maxWidth="2xl"
            >
                <TournamentForm
                    isEdit={true}
                    formData={formData}
                    updateField={updateField}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsEditModalOpen(false)}
                    isSubmitting={isUpdating}
                />
            </AdminModal>

            {/* Delete Confirmation Modal */}
            <AdminModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Tournament"
                maxWidth="sm"
            >
                <div className="text-center">
                    <div className="text-danger-red text-4xl mb-4">
                        <FontAwesomeIcon icon={faTrash} />
                    </div>
                    <p className="text-text-secondary mb-6">
                        Are you sure you want to delete <strong>{selectedTournament?.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="bg-transparent border border-text-secondary text-text-secondary px-6 py-3 rounded-xl font-semibold hover:bg-text-secondary hover:text-black transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-danger-red hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {isDeleting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                            Confirm Delete
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}

// ============================================================
// TournamentForm — Extracted OUTSIDE the parent component to
// prevent React from unmounting/remounting on every keystroke.
// ============================================================
interface TournamentFormProps {
    formData: CreateTournamentDto;
    updateField: <K extends keyof CreateTournamentDto>(field: K, value: CreateTournamentDto[K]) => void;
    isEdit?: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

function TournamentForm({ formData, updateField, isEdit = false, onSubmit, onCancel, isSubmitting }: TournamentFormProps) {
    return (
        <div className="space-y-4">
            {/* Row 1: Name & Game Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Tournament Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Game Type</label>
                    <select
                        value={formData.gameType}
                        onChange={(e) => updateField('gameType', e.target.value as any)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                    >
                        {TournamentGameTypeEnum.options.map((v) => (
                            <option key={v} value={v}>{TournamentGameTypeDisplayNames[v]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 2: Entry Format & Seat Cap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">
                        Entry Format
                        <FontAwesomeIcon icon={faInfoCircle} className="ml-2 text-accent-blue cursor-help" title="Determines how players can enter the tournament" />
                    </label>
                    <select
                        value={formData.entryFormat}
                        onChange={(e) => updateField('entryFormat', e.target.value as any)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                    >
                        {TournamentEntryFormatEnum.options.map((v) => (
                            <option key={v} value={v}>{TournamentEntryFormatDisplayNames[v]}</option>
                        ))}
                    </select>
                    <p className="text-text-secondary text-xs mt-1">
                        {TournamentEntryFormatDisplayNames[formData.entryFormat]}
                    </p>
                </div>
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Seat Cap (Optional)</label>
                    <input
                        type="number"
                        placeholder="Unlimited"
                        value={formData.seatCap ?? ''}
                        onChange={(e) => updateField('seatCap', e.target.value ? Number(e.target.value) : null)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
            </div>

            {/* Row 3: Buy-in Structure */}
            {formData.entryFormat === 'FREEROLL' ? (
                <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
                    <p className="text-accent-green font-semibold">Freeroll - No buy-in required</p>
                    <p className="text-text-secondary text-sm">Players enter for free. Prize pool is sponsored.</p>
                    <div className="mt-3">
                        <label className="block text-text-secondary text-sm font-semibold mb-2">Sponsored Prize Pool ($)</label>
                        <input
                            type="number"
                            value={formData.guaranteedPrizePool}
                            onChange={(e) => updateField('guaranteedPrizePool', Number(e.target.value))}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-text-secondary text-sm font-semibold mb-2">
                            {(formData.entryFormat === 'PROGRESSIVE_KO' || formData.entryFormat === 'BOUNTY') ? 'Base Buy-in ($)' : 'Buy-in ($)'}
                        </label>
                        <input
                            type="number"
                            value={formData.buyIn}
                            onChange={(e) => updateField('buyIn', Number(e.target.value))}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    {(formData.entryFormat === 'PROGRESSIVE_KO' || formData.entryFormat === 'BOUNTY') && (
                        <div>
                            <label className="block text-text-secondary text-sm font-semibold mb-2">
                                {formData.entryFormat === 'PROGRESSIVE_KO' ? 'KO Bounty ($)' : 'Fixed Bounty ($)'}
                            </label>
                            <input
                                type="number"
                                value={formData.bountyAmount ?? ''}
                                onChange={(e) => updateField('bountyAmount', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-text-secondary text-sm font-semibold mb-2">Fee ($)</label>
                        <input
                            type="number"
                            value={formData.fee}
                            onChange={(e) => updateField('fee', Number(e.target.value))}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-text-secondary text-sm font-semibold mb-2">Guaranteed Prize Pool ($)</label>
                        <input
                            type="number"
                            value={formData.guaranteedPrizePool}
                            onChange={(e) => updateField('guaranteedPrizePool', Number(e.target.value))}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Row 4: Re-entry Options */}
            {formData.entryFormat === 'RE_ENTRY' && (
                <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
                    <p className="text-accent-blue font-semibold mb-3">Re-entry Settings</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-text-secondary text-sm font-semibold mb-2">Max Re-entries per Player</label>
                            <input
                                type="number"
                                value={formData.maxReEntries ?? ''}
                                onChange={(e) => updateField('maxReEntries', e.target.value ? Number(e.target.value) : null)}
                                placeholder="e.g. 3"
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-text-secondary text-sm font-semibold mb-2">Re-entry Window</label>
                            <select
                                value={formData.reEntryWindow ?? ''}
                                onChange={(e) => updateField('reEntryWindow', e.target.value || null)}
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                            >
                                <option value="">Until late registration closes</option>
                                <option value="First 3 levels">First 3 levels</option>
                                <option value="First 6 levels">First 6 levels</option>
                                <option value="First hour">First hour</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Row 5: Starting Chips & Min Players */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Starting Chips</label>
                    <input
                        type="number"
                        value={formData.startingChips}
                        onChange={(e) => updateField('startingChips', Number(e.target.value))}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Min Players to Start</label>
                    <input
                        type="number"
                        min={2}
                        value={formData.minPlayersToStart}
                        onChange={(e) => updateField('minPlayersToStart', Number(e.target.value))}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
            </div>

            {/* Row 6: Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Start Date</label>
                    <input
                        type="date"
                        value={formData.startTime instanceof Date ? formData.startTime.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                            const current = formData.startTime instanceof Date ? formData.startTime : new Date();
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            current.setFullYear(y, m - 1, d);
                            updateField('startTime', new Date(current));
                        }}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Start Time</label>
                    <input
                        type="time"
                        value={formData.startTime instanceof Date ? formData.startTime.toTimeString().slice(0, 5) : ''}
                        onChange={(e) => {
                            const current = formData.startTime instanceof Date ? new Date(formData.startTime) : new Date();
                            const [h, min] = e.target.value.split(':').map(Number);
                            current.setHours(h, min);
                            updateField('startTime', current);
                        }}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                    />
                </div>
            </div>

            {/* Row 7: Late Registration & Blind Structure */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Late Registration</label>
                    <select
                        value={formData.lateRegistration}
                        onChange={(e) => updateField('lateRegistration', e.target.value as any)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                    >
                        {LateRegistrationWindowEnum.options.map((v) => (
                            <option key={v} value={v}>{v.replace(/_/g, ' ').toLowerCase().replace(/^./, s => s.toUpperCase())}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-text-secondary text-sm font-semibold mb-2">Blind Structure</label>
                    <select
                        value={formData.blindStructure}
                        onChange={(e) => updateField('blindStructure', e.target.value as any)}
                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                    >
                        {BlindStructureSpeedEnum.options.map((v) => (
                            <option key={v} value={v}>{BlindStructureSpeedDisplayNames[v]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Row 8: Payout Structure */}
            <div>
                <label className="block text-text-secondary text-sm font-semibold mb-2">Payout Structure</label>
                <select
                    value={formData.payoutStructure}
                    onChange={(e) => updateField('payoutStructure', e.target.value as any)}
                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3"
                >
                    {PayoutStructureEnum.options.map((v) => (
                        <option key={v} value={v}>{v.replace(/_/g, ' ').toLowerCase().replace(/^./, s => s.toUpperCase())}</option>
                    ))}
                </select>
            </div>

            {/* Row 9: Checkboxes */}
            <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.rebuyEnabled}
                        onChange={(e) => updateField('rebuyEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-border-dark bg-primary-bg accent-accent-yellow"
                    />
                    <span>Rebuy Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.addonEnabled}
                        onChange={(e) => updateField('addonEnabled', e.target.checked)}
                        className="w-4 h-4 rounded border-border-dark bg-primary-bg accent-accent-yellow"
                    />
                    <span>Add-on Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.autoStart}
                        onChange={(e) => updateField('autoStart', e.target.checked)}
                        className="w-4 h-4 rounded border-border-dark bg-primary-bg accent-accent-yellow"
                    />
                    <span>Auto Start</span>
                </label>
            </div>

            {/* Rebuy/Addon Settings */}
            {(formData.rebuyEnabled || formData.addonEnabled) && (
                <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-4">
                    <p className="text-accent-yellow font-semibold mb-3">Rebuy & Add-on Settings</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formData.rebuyEnabled && (
                            <>
                                <div>
                                    <label className="block text-text-secondary text-sm font-semibold mb-2">Rebuy Cost ($)</label>
                                    <input
                                        type="number"
                                        value={formData.rebuyCost ?? ''}
                                        onChange={(e) => updateField('rebuyCost', e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-sm font-semibold mb-2">Chips for Rebuy</label>
                                    <input
                                        type="number"
                                        value={formData.rebuyChips ?? ''}
                                        onChange={(e) => updateField('rebuyChips', e.target.value ? Number(e.target.value) : null)}
                                        placeholder="e.g. 10000"
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                            </>
                        )}
                        {formData.addonEnabled && (
                            <>
                                <div>
                                    <label className="block text-text-secondary text-sm font-semibold mb-2">Add-on Cost ($)</label>
                                    <input
                                        type="number"
                                        value={formData.addonCost ?? ''}
                                        onChange={(e) => updateField('addonCost', e.target.value ? Number(e.target.value) : null)}
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-sm font-semibold mb-2">Chips for Add-on</label>
                                    <input
                                        type="number"
                                        value={formData.addonChips ?? ''}
                                        onChange={(e) => updateField('addonChips', e.target.value ? Number(e.target.value) : null)}
                                        placeholder="e.g. 15000"
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-transparent border border-text-secondary text-text-secondary px-6 py-3 rounded-xl font-semibold hover:bg-text-secondary hover:text-black transition-all"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)] text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Create Tournament'}
                </button>
            </div>
        </div>
    );
}
