'use client';

import React from 'react';
import { PremiumTableCard } from "@/components/lobby/PremiumTableCard";
import TournamentCard from "@/components/TournamentCard";
import { CustomerServiceChat } from "@/components/support/CustomerServiceChat";
import { MobileNav } from "@/components/MobileNav";
import { BuyInModal } from "@/components/modals/BuyInModal";
import { WaitlistModal } from "@/components/modals/WaitlistModal";
import { InsufficientBalanceModal } from "@/components/modals/InsufficientBalanceModal";
import { TournamentRegistrationModal } from "@/components/modals/TournamentRegistrationModal";
import { SeatAvailableModal } from "@/components/modals/SeatAvailableModal";
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { LobbyTableDto, GameVariant } from '@poker/shared';
import { FEATURED_TOURNAMENTS } from "@/data/mocks/lobby";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faLayerGroup, faBolt, faTrophy } from '@fortawesome/free-solid-svg-icons';

// Toggle Chips - click active = deselect, null = show all
type GameFilter = GameVariant | 'TOURNAMENTS' | null;

const gameChips: { id: GameFilter; label: string; icon: any }[] = [
    { id: 'TEXAS_HOLDEM', label: "Hold'em", icon: faPlay },
    { id: 'OMAHA', label: 'Omaha', icon: faLayerGroup },
    { id: 'ALL_IN_OR_FOLD', label: 'AoF', icon: faBolt },
    { id: 'TOURNAMENTS', label: 'Tourneys', icon: faTrophy },
];

export default function Lobby() {
    const [activeModal, setActiveModal] = React.useState<string | null>(null);
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    // Toggle state: null = show all
    const [selectedGame, setSelectedGame] = React.useState<GameFilter>(null);

    // Toggle handler: click active chip = deselect
    const handleChipClick = (chipId: GameFilter) => {
        if (selectedGame === chipId) {
            setSelectedGame(null); // Deselect = show all
        } else {
            setSelectedGame(chipId);
        }
    };

    // Fetch tables - when null, fetch all
    const { data: allTables = [] } = useQuery<LobbyTableDto[]>({
        queryKey: ['lobby-tables', selectedGame],
        queryFn: async () => {
            const params: any = { isActive: 'true' };
            // Only add variant filter if not null and not tournaments
            if (selectedGame && selectedGame !== 'TOURNAMENTS') {
                params.variant = selectedGame;
            }
            const { data } = await api.get('/game/tables', { params });
            return data;
        },
        enabled: selectedGame !== 'TOURNAMENTS',
        refetchInterval: 5000,
    });

    // Mock handlers
    const openModal = (modalName: string) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    return (
        <>
            {/* Main Content */}
            <main id="main-content" className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:py-8">
                {/* Toggle Chips Navigation */}
                <section id="game-chips-section" className="mb-6 md:mb-8">
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {gameChips.map((chip) => {
                            const isActive = selectedGame === chip.id;
                            return (
                                <button
                                    key={chip.id}
                                    onClick={() => handleChipClick(chip.id)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${isActive
                                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                                        : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <FontAwesomeIcon icon={chip.icon} className="text-xs" />
                                    {chip.label}
                                </button>
                            );
                        })}

                        {/* Show "All" indicator when nothing selected */}
                        {selectedGame === null && (
                            <span className="inline-flex items-center px-3 py-2 text-xs text-gray-500">
                                Showing all tables
                            </span>
                        )}
                    </div>
                </section>
                {/* Vertical Feed - space between sections */}
                <div className="space-y-12">
                    {/* Cash Games - Premium Cards */}
                    {/* Show when: null (all), or any cash game filter */}
                    {(selectedGame === null || (selectedGame !== 'TOURNAMENTS')) && (
                        <section id="cash-games-section">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                                    💰 Cash Tables
                                </h2>
                                <span className="text-xs text-text-secondary bg-surface-hover px-3 py-1 rounded-full">
                                    {allTables.length} tables
                                </span>
                            </div>
                            {allTables.length === 0 ? (
                                <div className="text-center py-12 bg-secondary-bg rounded-2xl border border-white/5">
                                    <p className="text-gray-400">No active tables found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {allTables.map((game) => (
                                        <PremiumTableCard
                                            key={game.id}
                                            id={game.id}
                                            name={game.name}
                                            blinds={game.stakes}
                                            type={game.variant}
                                            seated={game.players}
                                            maxSeats={game.maxSeats}
                                            avgPot={game.avgPot ?? '$0'}
                                            minBuyIn={game.minBuyIn}
                                            maxBuyIn={game.maxBuyIn}
                                            handsPerHour={game.handsPerHour ?? 0}
                                            holeCardsCount={game.holeCardsCount ?? 4}
                                            isPrivate={game.isPrivate}
                                            status={game.status}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* Tournaments */}
                    {/* Show when: null (all), or TOURNAMENTS filter */}
                    {(selectedGame === null || selectedGame === 'TOURNAMENTS') && (
                        <section id="tournaments-section">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                                    🏆 Tournaments
                                </h2>
                                <span className="text-xs text-text-secondary bg-surface-hover px-3 py-1 rounded-full">
                                    {FEATURED_TOURNAMENTS.length} events
                                </span>
                            </div>
                            <div id="tournaments-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {FEATURED_TOURNAMENTS.map((tourney) => (
                                    <TournamentCard
                                        key={tourney.id}
                                        name={tourney.name}
                                        buyInText={tourney.buyInText}
                                        feeText={tourney.feeText}
                                        prizePool={tourney.prizePool}
                                        players={tourney.players}
                                        isRegistered={tourney.isRegistered}
                                        onRegister={() => openModal('tournament')}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Chat Widget (Customer Support) */}
            <CustomerServiceChat
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
            />

            {/* Mobile Bottom Navbar */}
            <MobileNav />

            {/* Modals */}
            <BuyInModal
                isOpen={activeModal === 'buyin'}
                onClose={closeModal}
                onConfirm={closeModal}
                tableName="Ante Up Arena"
                buyInMin={100}
                buyInMax={500}
            />

            <WaitlistModal
                isOpen={activeModal === 'waitlist'}
                onClose={closeModal}
                tableName="Bluff Master's Den"
            />

            <InsufficientBalanceModal
                isOpen={activeModal === 'deposit'}
                onClose={closeModal}
                onDeposit={closeModal}
                currentBalance={1250}
                requiredAmount={2000}
            />

            <TournamentRegistrationModal
                isOpen={activeModal === 'tournament'}
                onClose={closeModal}
                onConfirm={closeModal}
                tournamentName="Weekend Warrior Special"
                buyIn={50}
                fee={5}
                userBalance={1250}
            />

            <SeatAvailableModal
                isOpen={activeModal === 'seat'}
                onClose={closeModal}
                onJoin={closeModal}
                tableName="River Rats Table"
            />
        </>
    );
}
