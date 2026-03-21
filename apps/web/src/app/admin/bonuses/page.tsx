'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faPause,
    faPlay,
    faSearch,
    faExclamationTriangle,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminModal from '@/components/admin/AdminModal';

type StatusFilter = '' | 'active' | 'paused' | 'expired';

interface Bonus {
    id: string;
    name: string;
    description: string;
    type: string;
    status: 'active' | 'paused' | 'expired';
    expiryDate: string;
    totalClaims: number;
    totalPayout: number;
}

// Mock Data
const mockBonuses: Bonus[] = [
    {
        id: 'bonus-001',
        name: 'Welcome Deposit Bonus',
        description: '100% match bonus up to $500 for new players on their first deposit',
        type: 'Deposit Match',
        status: 'active',
        expiryDate: '2024-12-31',
        totalClaims: 347,
        totalPayout: 86050,
    },
    {
        id: 'bonus-002',
        name: 'Weekly Rakeback',
        description: '15% rakeback every Monday for VIP players',
        type: 'Rakeback',
        status: 'active',
        expiryDate: 'Ongoing',
        totalClaims: 89,
        totalPayout: 12450,
    },
    {
        id: 'bonus-003',
        name: 'Tournament Tickets',
        description: 'Free $50 tournament entry for completing daily challenges',
        type: 'Tournament Tickets',
        status: 'active',
        expiryDate: '2025-01-15',
        totalClaims: 156,
        totalPayout: 7800,
    },
    {
        id: 'bonus-004',
        name: 'Loyalty Rewards',
        description: 'Monthly bonus based on total hands played',
        type: 'Rebate',
        status: 'paused',
        expiryDate: '2025-03-30',
        totalClaims: 234,
        totalPayout: 45000,
    },
    {
        id: 'bonus-005',
        name: 'First Time Depositor',
        description: '50% bonus on first deposit up to $200',
        type: 'First Deposit Only',
        status: 'active',
        expiryDate: '2025-02-28',
        totalClaims: 421,
        totalPayout: 32975,
    },
];

const promotionStats = {
    totalActive: 4,
    claimsThisWeek: 89,
    totalPayout: 179350,
    conversionRate: 23.4,
};

export default function BonusesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
    const [bonuses, setBonuses] = useState(mockBonuses);

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editType, setEditType] = useState('');
    const [editExpiryDate, setEditExpiryDate] = useState('');
    const [editBonusPercent, setEditBonusPercent] = useState('');
    const [editMaxAmount, setEditMaxAmount] = useState('');

    // Create form state
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formBonusPercent, setFormBonusPercent] = useState('');
    const [formMaxAmount, setFormMaxAmount] = useState('');
    const [formExpiryDate, setFormExpiryDate] = useState('');
    const [formEligibility, setFormEligibility] = useState('All Players');
    const [formError, setFormError] = useState('');

    // Filter bonuses
    const filteredBonuses = bonuses.filter(bonus => {
        if (statusFilter && bonus.status !== statusFilter) return false;
        if (searchTerm && !bonus.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const activeCount = bonuses.filter(b => b.status === 'active').length;

    const toggleBonusStatus = (id: string) => {
        setBonuses(prev => prev.map(bonus => {
            if (bonus.id === id) {
                return {
                    ...bonus,
                    status: bonus.status === 'active' ? 'paused' as const : 'active' as const
                };
            }
            return bonus;
        }));
    };

    const openEditModal = (bonus: Bonus) => {
        setEditingBonus(bonus);
        setEditName(bonus.name);
        setEditDescription(bonus.description);
        setEditType(bonus.type);
        setEditExpiryDate(bonus.expiryDate === 'Ongoing' ? '' : bonus.expiryDate);
        setEditBonusPercent('');
        setEditMaxAmount('');
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingBonus(null);
    };

    const handleSaveEdit = () => {
        if (!editingBonus || !editName.trim()) return;

        setBonuses(prev => prev.map(bonus => {
            if (bonus.id === editingBonus.id) {
                return {
                    ...bonus,
                    name: editName,
                    description: editDescription,
                    type: editType,
                    expiryDate: editExpiryDate || 'Ongoing',
                };
            }
            return bonus;
        }));
        closeEditModal();
    };

    const handleCreatePromotion = () => {
        if (!formName.trim() || !formType) {
            setFormError('Please fill in required fields');
            return;
        }
        setFormError('');
        // Reset form
        setFormName('');
        setFormType('');
        setFormDescription('');
        setFormBonusPercent('');
        setFormMaxAmount('');
        setFormExpiryDate('');
        setFormEligibility('All Players');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Bonus Manager</h2>
                    <p className="text-text-secondary">Manage bonuses and promotional campaigns</p>
                </div>
            </section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Bonus List (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Header with filter */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold">Active Bonuses</h3>
                            <span className="bg-accent-green px-2 py-1 rounded text-xs font-semibold">{activeCount} Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="bg-primary-bg border border-border-dark rounded-xl px-3 py-2 text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="expired">Expired</option>
                            </select>
                            <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder="Search bonuses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-primary-bg border border-border-dark rounded-xl pl-10 pr-4 py-2 text-sm w-48"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bonus Cards */}
                    {filteredBonuses.map((bonus) => (
                        <div key={bonus.id} className="bg-card-bg p-6 rounded-2xl shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-bold text-lg">{bonus.name}</h4>
                                    <p className="text-text-secondary text-sm">{bonus.description}</p>
                                </div>
                                <StatusBadge status={bonus.status} />
                            </div>

                            {/* Bonus Details Row */}
                            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                                <div>
                                    <span className="text-text-secondary">Type</span>
                                    <p className="font-semibold">{bonus.type}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Expiry Date</span>
                                    <p className="font-semibold">{bonus.expiryDate}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Total Claims</span>
                                    <p className="font-semibold text-accent-blue">{bonus.totalClaims}</p>
                                </div>
                                <div>
                                    <span className="text-text-secondary">Total Payout</span>
                                    <p className="font-semibold text-accent-green">${bonus.totalPayout.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Action Buttons - Edit is OUTLINE style */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => openEditModal(bonus)}
                                    className="border-2 border-accent-yellow text-accent-yellow bg-transparent hover:bg-accent-yellow/10 py-2 rounded-xl font-semibold transition-all"
                                >
                                    <FontAwesomeIcon icon={faEdit} className="mr-2" />Edit
                                </button>
                                <button
                                    onClick={() => toggleBonusStatus(bonus.id)}
                                    className={`py-2 rounded-xl font-semibold transition-all ${bonus.status === 'active'
                                            ? 'bg-danger-red hover:bg-red-600'
                                            : 'bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)]'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={bonus.status === 'active' ? faPause : faPlay} className="mr-2" />
                                    {bonus.status === 'active' ? 'Pause' : 'Resume'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RIGHT COLUMN - Create Form + Stats (1/3 width) */}
                <div className="space-y-6">
                    {/* Create New Promotion Form */}
                    <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Create New Promotion</h3>

                        {formError && (
                            <div className="bg-danger-red/20 border border-danger-red text-danger-red p-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {formError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-text-secondary text-sm block mb-2">Promotion Name</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Enter promotion name..."
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-text-secondary text-sm block mb-2">Promotion Type</label>
                                <select
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value)}
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                >
                                    <option value="">Select promotion type...</option>
                                    <option value="deposit-match">Deposit Match</option>
                                    <option value="rakeback">Rakeback</option>
                                    <option value="tournament">Tournament Tickets</option>
                                    <option value="rebate">Rebate</option>
                                    <option value="first-deposit">First Deposit Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-text-secondary text-sm block mb-2">Description</label>
                                <textarea
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Enter promotion description..."
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm h-20 focus:border-accent-yellow focus:outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-text-secondary text-sm block mb-2">Bonus Amount (%)</label>
                                    <input
                                        type="number"
                                        value={formBonusPercent}
                                        onChange={(e) => setFormBonusPercent(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-text-secondary text-sm block mb-2">Max $</label>
                                    <input
                                        type="number"
                                        value={formMaxAmount}
                                        onChange={(e) => setFormMaxAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-text-secondary text-sm block mb-2">Expiry Date</label>
                                <input
                                    type="date"
                                    value={formExpiryDate}
                                    onChange={(e) => setFormExpiryDate(e.target.value)}
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-text-secondary text-sm block mb-2">Player Eligibility</label>
                                <select
                                    value={formEligibility}
                                    onChange={(e) => setFormEligibility(e.target.value)}
                                    className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                                >
                                    <option value="All Players">All Players</option>
                                    <option value="New Players">New Players</option>
                                    <option value="VIP Only">VIP Only</option>
                                    <option value="Inactive Players">Inactive Players</option>
                                </select>
                            </div>

                            <button
                                onClick={handleCreatePromotion}
                                className="w-full bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)] py-3 rounded-xl font-semibold transition-all"
                            >
                                + CREATE PROMOTION
                            </button>
                        </div>
                    </section>

                    {/* Promotion Statistics */}
                    <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Promotion Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Total Active</span>
                                <span className="font-semibold">{promotionStats.totalActive}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Claims This Week</span>
                                <span className="font-semibold text-accent-blue">{promotionStats.claimsThisWeek}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Total Payout</span>
                                <span className="font-semibold text-accent-green">${promotionStats.totalPayout.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary">Conversion Rate</span>
                                <span className="font-semibold text-danger-red">{promotionStats.conversionRate}%</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Edit Modal */}
            <AdminModal
                isOpen={isEditModalOpen}
                onClose={closeEditModal}
                title={`Edit: ${editingBonus?.name || ''}`}
                maxWidth="lg"
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-text-secondary text-sm block mb-2">Promotion Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-text-secondary text-sm block mb-2">Promotion Type</label>
                        <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        >
                            <option value="Deposit Match">Deposit Match</option>
                            <option value="Rakeback">Rakeback</option>
                            <option value="Tournament Tickets">Tournament Tickets</option>
                            <option value="Rebate">Rebate</option>
                            <option value="First Deposit Only">First Deposit Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-text-secondary text-sm block mb-2">Description</label>
                        <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm h-20 focus:border-accent-yellow focus:outline-none resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-text-secondary text-sm block mb-2">Bonus Amount (%)</label>
                            <input
                                type="number"
                                value={editBonusPercent}
                                onChange={(e) => setEditBonusPercent(e.target.value)}
                                placeholder="100"
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-text-secondary text-sm block mb-2">Max $</label>
                            <input
                                type="number"
                                value={editMaxAmount}
                                onChange={(e) => setEditMaxAmount(e.target.value)}
                                placeholder="500"
                                className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-text-secondary text-sm block mb-2">Expiry Date</label>
                        <input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className="w-full bg-primary-bg border border-border-dark rounded-xl px-3 py-3 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleSaveEdit}
                            className="flex-1 bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)] py-3 rounded-xl font-semibold transition-all"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={closeEditModal}
                            className="flex-1 bg-hover-bg hover:bg-gray-600 py-3 rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </AdminModal>
        </div>
    );
}
