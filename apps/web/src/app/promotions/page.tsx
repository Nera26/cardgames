"use client";

import React, { useState, useEffect } from "react";

// Types
interface PromoCard {
    id: string; // e.g., 'daily-1', 'weekly-1'
    category: 'daily' | 'weekly' | 'special';
    title: string;
    description: string;
    reward: string;
    unlockCondition: string;

    // Status/Progress Fields
    status: 'ready' | 'active' | 'claimed' | 'locked';
    statusLabel?: string;

    // Progress
    progressCurrent?: number;
    progressMax?: number;
    progressLabel?: string; // e.g. "$350 / $500 Wagered" or "7/7 Days"

    // Buttons
    buttonText: string;
    buttonAction: 'claim' | 'track' | 'details' | 'disabled';

    // Icon classes (optional customization)
    rewardIcon?: string;
    unlockIcon?: string;
}

// Initial Mock Data
const initialPromotions: PromoCard[] = [
    {
        id: 'daily-1',
        category: 'daily',
        title: 'Daily Login Streak',
        description: 'Log in for 7 consecutive days to earn a mystery prize!',
        reward: 'Mystery Box',
        rewardIcon: 'fa-gift',
        unlockCondition: 'Log in daily',
        unlockIcon: 'fa-key',
        status: 'ready',
        progressCurrent: 7,
        progressMax: 7,
        progressLabel: '7/7 Days',
        buttonText: 'Claim Reward',
        buttonAction: 'claim'
    },
    {
        id: 'weekly-1',
        category: 'weekly',
        title: 'Weekend Wager Warrior',
        description: 'Wager $500 on any cash game table this weekend for a bonus.',
        reward: '$25 Bonus Cash',
        rewardIcon: 'fa-dollar-sign',
        unlockCondition: 'Wager $500 on cash games',
        unlockIcon: 'fa-key',
        status: 'active',
        progressCurrent: 350,
        progressMax: 500,
        progressLabel: '$350 / $500 Wagered',
        buttonText: 'Track Progress',
        buttonAction: 'track'
    },
    {
        id: 'special-1',
        category: 'special',
        title: 'First Deposit Boost',
        description: 'Make your first deposit and get a 100% match up to $200!',
        reward: '100% up to $200',
        rewardIcon: 'fa-percent',
        unlockCondition: 'First-time deposit',
        unlockIcon: 'fa-key',
        status: 'claimed',
        progressCurrent: 100,
        progressMax: 100,
        progressLabel: 'Claimed',
        buttonText: 'Claimed',
        buttonAction: 'disabled'
    },
    {
        id: 'special-2',
        category: 'special',
        title: 'Tournament Titan Ticket',
        description: 'Play 5 tournaments this week to receive a free $10 ticket.',
        reward: '$10 Ticket',
        rewardIcon: 'fa-ticket',
        unlockCondition: 'Play 5 tournaments',
        unlockIcon: 'fa-key',
        status: 'locked',
        progressCurrent: 2,
        progressMax: 5,
        progressLabel: '2 / 5 Tournaments',
        buttonText: 'View Details',
        buttonAction: 'details'
    }
];

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<PromoCard[]>(initialPromotions);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'special'>('daily');
    const [bonusCode, setBonusCode] = useState('');
    const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [shakeInput, setShakeInput] = useState(false);

    // Modals
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [unlockModalOpen, setUnlockModalOpen] = useState(false);

    // For specific modal content binding if needed (simplified for this demo)
    // In a real app, we'd pass the specific promo object to the modal.

    // Toast Helper
    const showToast = (text: string, isError = false) => {
        setToastMessage({ text, isError });
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Filter Logic
    const filteredPromotions = promotions.filter(p => p.category === activeTab);

    // Redeem Logic
    const handleRedeem = () => {
        const code = bonusCode.trim().toUpperCase();
        if (!code) return;

        const validCodes = ['WEEKEND25', 'DAILY7', 'SPECIAL100'];

        if (validCodes.includes(code)) {
            showToast('✅ Bonus successfully added!');
            setBonusCode('');

            // Add a new dummy daily card
            const newId = `daily-${Date.now()}`;
            const newPromo: PromoCard = {
                id: newId,
                category: 'daily',
                title: `Redeemed Bonus ${code}`,
                description: `You redeemed code ${code} successfully!`,
                reward: '$10 Bonus Cash',
                rewardIcon: 'fa-gift',
                unlockCondition: 'Code Redemption',
                status: 'ready',
                progressCurrent: 0,
                progressMax: 1,
                progressLabel: '0/1 Claim',
                buttonText: 'Claim Reward',
                buttonAction: 'claim'
            };

            // Prepend new promo, switch to daily tab to see it
            setPromotions([newPromo, ...promotions]);
            setActiveTab('daily');

        } else {
            showToast('❌ Invalid or expired code.', true);
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), 400); // 400ms matching CSS animation
        }
    };

    const handleClaim = (id: string) => {
        // Find promo and update status
        setPromotions(prev => prev.map(p => {
            if (p.id === id) {
                return { ...p, status: 'claimed', buttonText: 'Claimed', buttonAction: 'disabled', progressLabel: 'Claimed', progressCurrent: p.progressMax };
            }
            return p;
        }));

        const promo = promotions.find(p => p.id === id);
        const rewardName = promo ? promo.reward : 'Reward';
        showToast(`✅ Reward claimed! ${rewardName} added to your account.`);
    };

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24px md:py-32px">

            {/* TOAST */}
            {toastMessage && (
                <div
                    id="toast"
                    className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-md z-50 text-white animate-fade-in-toast ${toastMessage.isError ? 'bg-danger-red' : 'bg-accent-green'}`}
                >
                    {toastMessage.text}
                </div>
            )}

            {/* HEADER */}
            <section className="mb-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">Promotions & Bonuses</h1>
                <p className="text-text-secondary text-sm">Browse daily, weekly, and special bonuses. Track your progress and claim rewards!</p>
            </section>

            {/* REDEEM CODE */}
            <section id="redeem-code-section" className="bg-card-bg rounded-2xl p-6 mb-10">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Redeem Bonus Code</h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                    <input
                        type="text"
                        value={bonusCode}
                        onChange={(e) => setBonusCode(e.target.value)}
                        placeholder="Enter your bonus code"
                        className={`flex-grow bg-primary-bg text-text-primary border border-border-dark rounded-xl p-3 focus:border-accent-yellow focus-glow-yellow text-sm h-[48px] ${shakeInput ? 'shake' : ''}`}
                    />
                    <button
                        onClick={handleRedeem}
                        className="w-full sm:w-auto border-2 border-accent-yellow text-accent-yellow font-bold py-3 px-6 rounded-xl hover:bg-accent-yellow hover:text-primary-bg hover-glow-yellow transition-all duration-200 text-sm uppercase h-[48px] flex items-center justify-center min-w-[120px]"
                    >
                        Redeem
                    </button>
                </div>
            </section>

            {/* TABS */}
            <section id="bonus-filter-tabs-section" className="mb-10">
                <div className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2">
                    {['daily', 'weekly', 'special'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`whitespace-nowrap px-4 py-3 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 ${activeTab === tab
                                    ? 'active-tab bg-accent-yellow text-primary-bg hover-glow-yellow'
                                    : 'inactive-tab bg-card-bg text-text-secondary hover:text-accent-yellow hover:brightness-110'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </section>

            {/* CARDS GRID */}
            <section id="bonus-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromotions.map((promo) => {
                    // Badge Color
                    let badgeColor = 'bg-accent-yellow text-primary-bg';
                    if (promo.category === 'special') badgeColor = 'bg-accent-blue text-text-primary';

                    // Progress Percentage
                    const percent = promo.progressMax && promo.progressMax > 0
                        ? Math.min(100, Math.max(0, ((promo.progressCurrent || 0) / promo.progressMax) * 100))
                        : 0;

                    // Progress Bar Color
                    const progressBarColor = promo.status === 'claimed' || percent >= 100 ? 'bg-accent-green' : 'bg-accent-yellow';

                    return (
                        <div
                            key={promo.id}
                            className="bonus-card bg-card-bg rounded-2xl p-6 flex flex-col justify-between hover:bg-hover-bg transition-all duration-200 fade-in-card"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-text-primary">{promo.title}</h3>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${badgeColor}`}>
                                        {promo.category.charAt(0).toUpperCase() + promo.category.slice(1)}
                                    </span>
                                </div>
                                <p className="text-text-secondary text-sm mb-2">{promo.description}</p>
                                <p className="text-text-secondary text-xs mb-1">
                                    <i className={`fa-solid ${promo.rewardIcon || 'fa-gift'} mr-1 text-accent-yellow`}></i>
                                    Reward: <span className="text-text-primary">{promo.reward}</span>
                                </p>
                                <p className="text-text-secondary text-xs mb-3">
                                    <i className={`fa-solid ${promo.unlockIcon || 'fa-key'} mr-1 text-accent-yellow`}></i>
                                    Unlock: <span className="text-text-primary">{promo.unlockCondition}</span>
                                </p>

                                {/* Progress Bar */}
                                {(typeof promo.progressMax === 'number') && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-text-secondary mb-1">
                                            <span>{promo.status === 'claimed' ? 'Status' : 'Progress'}</span>
                                            <span className={promo.status === 'claimed' ? 'text-accent-green' : ''}>
                                                {promo.status === 'claimed' ? 'Claimed' : promo.progressLabel}
                                            </span>
                                        </div>
                                        <div className="w-full bg-primary-bg rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${progressBarColor}`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            {promo.buttonAction === 'claim' && (
                                <button
                                    onClick={() => handleClaim(promo.id)}
                                    className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-sm uppercase"
                                >
                                    {promo.buttonText}
                                </button>
                            )}
                            {promo.buttonAction === 'track' && (
                                <button
                                    onClick={() => setProgressModalOpen(true)}
                                    className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-sm uppercase"
                                >
                                    {promo.buttonText}
                                </button>
                            )}
                            {promo.buttonAction === 'details' && (
                                <button
                                    onClick={() => setUnlockModalOpen(true)}
                                    className="w-full bg-accent-green text-text-primary font-bold py-3 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-sm uppercase"
                                >
                                    {promo.buttonText}
                                </button>
                            )}
                            {promo.buttonAction === 'disabled' && (
                                <button className="w-full bg-border-dark text-text-secondary font-bold py-3 rounded-xl text-sm uppercase cursor-not-allowed tooltip relative group">
                                    {promo.buttonText}
                                    <span className="tooltip-text group-hover:visible group-hover:opacity-100">
                                        You’ve already claimed this reward.
                                    </span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </section>

            {/* PROGRESS MODAL */}
            {progressModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 fade-in-modal">
                    <div className="bg-card-bg rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Progress Details</h2>
                            <button onClick={() => setProgressModalOpen(false)} className="text-text-secondary hover:text-accent-yellow text-2xl">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="space-y-4 text-text-secondary text-sm">
                            <p className="mb-2">You have wagered <span className="font-semibold text-text-primary">$350</span> out of <span className="font-semibold text-text-primary">$500</span> required this weekend.</p>
                            <p className="mb-2">Tracks 100% of cash game wagers. Your current streak is:</p>
                            <ul className="list-disc list-inside text-text-secondary mb-2">
                                <li>Cashed hands: $200</li>
                                <li>Showdown wins: $150</li>
                            </ul>
                            <p className="text-text-secondary text-sm italic">Keep wagering on cash games to complete the challenge. Estimated time to completion: ~2 hours of average play.</p>
                        </div>
                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setProgressModalOpen(false)}
                                className="bg-accent-yellow text-primary-bg font-semibold py-2 px-4 rounded-xl hover:brightness-110 hover-glow-yellow transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNLOCK MODAL */}
            {unlockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 fade-in-modal">
                    <div className="bg-card-bg rounded-2xl p-6 md:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Unlock Condition</h2>
                            <button onClick={() => setUnlockModalOpen(false)} className="text-text-secondary hover:text-accent-yellow text-2xl">
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="text-text-secondary text-sm">
                            <p className="mb-2">Play <span className="font-semibold text-text-primary">5 tournaments</span> this week to unlock your free $10 Tournament Ticket.</p>
                            <p className="text-text-secondary text-sm italic">Tournament play includes Sit & Go, MTTs, and Freezeouts. Progress is tracked 24/7.</p>
                            <p className="text-text-secondary text-sm italic mt-2">You have currently played <span className="font-semibold text-text-primary">2</span> tournaments this week.</p>
                        </div>
                        <div className="mt-6 text-right">
                            <button
                                onClick={() => setUnlockModalOpen(false)}
                                className="bg-accent-yellow text-primary-bg font-semibold py-2 px-4 rounded-xl hover:brightness-110 hover-glow-yellow transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
