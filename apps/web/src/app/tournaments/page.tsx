"use client";

import { useState } from "react";
import TournamentCard from "@/components/TournamentCard";
import { useGame } from "@/contexts/GameContext";
import { RegistrationModal } from "@/components/tournaments/RegistrationModal";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { useLobbyTournaments } from "@/hooks/useLobbyTournaments";
import { TournamentResponseDto, TournamentGameTypeDisplayNames } from "@poker/shared";

function TournamentGrid({
    tournaments,
    onRegister,
    isLoading,
}: {
    tournaments: TournamentResponseDto[];
    onRegister: (t: TournamentResponseDto) => void;
    isLoading: boolean;
}) {
    if (isLoading) {
        return <LoadingScreen fullScreen={false} text="Loading Tournaments..." className="h-64 col-span-full" />;
    }

    if (tournaments.length === 0) {
        return (
            <div className="col-span-full text-center py-12 text-text-secondary">
                <i className="fa-solid fa-trophy text-4xl mb-4 opacity-50"></i>
                <p>No tournaments found matching your filters.</p>
            </div>
        );
    }

    return (
        <>
            {tournaments.map((t) => (
                <TournamentCard
                    key={t.id}
                    name={t.name}
                    buyInText={t.buyIn === 0 ? 'Free' : t.buyIn}
                    feeText={t.fee}
                    prizePool={`$${(t.actualPrizePool || t.guaranteedPrizePool).toLocaleString()} GTD`}
                    players={`${t.totalEntries}${t.seatCap ? `/${t.seatCap}` : ''}`}
                    isRegistered={false}
                    onRegister={() => onRegister(t)}
                />
            ))}
        </>
    );
}

export default function TournamentsPage() {
    const { user } = useGame();
    const [filterName, setFilterName] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [selectedTournament, setSelectedTournament] = useState<TournamentResponseDto | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

    const userBalance = user?.balance || 0;

    // Map display filters → API enum values
    const statusFilterMap: Record<string, string | undefined> = {
        'All': undefined,
        'Registering': 'REGISTERING',
        'Running': 'RUNNING',
    };

    const gameTypeFilterMap: Record<string, string | undefined> = {
        'All': undefined,
        "Hold'em": 'TEXAS_HOLDEM',
        'Omaha': 'POT_LIMIT_OMAHA',
        'Short Deck': 'SHORT_DECK',
    };

    // React Query hook
    const {
        tournaments,
        isLoading,
        register,
        isRegistering,
    } = useLobbyTournaments({
        status: statusFilterMap[filterStatus],
        gameType: gameTypeFilterMap[filterType],
        search: filterName || undefined,
    });

    const handleRegister = (tournament: TournamentResponseDto) => {
        setSelectedTournament(tournament);
        setIsModalOpen(true);
    };

    const confirmRegistration = () => {
        if (!selectedTournament) return;
        register(selectedTournament.id, {
            onSuccess: () => {
                setIsModalOpen(false);
                setSelectedTournament(null);
            },
        });
    };

    return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
            <h1 className="text-3xl font-bold mb-6 text-accent-yellow">Tournaments</h1>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-card-bg p-4 rounded-xl border border-border-dark">
                {/* Search */}
                <div className="relative">
                    <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"></i>
                    <input
                        type="text"
                        placeholder="Search tournaments..."
                        className="w-full bg-primary-bg border border-border-dark rounded-lg py-2 pl-10 pr-4 text-text-primary focus:outline-none focus:border-accent-yellow transition-colors"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                    />
                </div>

                {/* Custom Type Dropdown */}
                <div className="relative">
                    <button
                        className={`w-full bg-primary-bg border border-border-dark rounded-lg py-2 px-4 text-text-primary focus:outline-none focus:border-accent-yellow flex justify-between items-center ${isTypeDropdownOpen ? 'border-accent-yellow' : ''}`}
                        onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    >
                        <span>{filterType === 'All' ? 'All Types' : filterType}</span>
                        <i className={`fa-solid fa-chevron-down text-text-secondary transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    {isTypeDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-card-bg border border-border-dark rounded-xl shadow-xl z-20 overflow-hidden animate-fadeIn">
                            {['All', "Hold'em", 'Omaha', 'Short Deck'].map((type) => (
                                <button
                                    key={type}
                                    className="w-full text-left px-4 py-3 hover:bg-hover-bg text-text-primary hover:text-accent-yellow transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    onClick={() => {
                                        setFilterType(type);
                                        setIsTypeDropdownOpen(false);
                                    }}
                                >
                                    {type === 'All' ? 'All Types' : type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Toggle */}
                <div className="flex bg-primary-bg rounded-lg p-1 border border-border-dark">
                    {['All', 'Registering', 'Running'].map((status) => (
                        <button
                            key={status}
                            className={`flex-1 py-1 rounded-md text-sm font-medium transition-colors ${filterStatus === status ? 'bg-accent-yellow text-primary-bg' : 'text-text-secondary hover:text-accent-yellow'}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TournamentGrid
                    tournaments={tournaments}
                    onRegister={handleRegister}
                    isLoading={isLoading}
                />
            </div>

            {/* Registration Modal */}
            <RegistrationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tournament={selectedTournament}
                userBalance={userBalance}
                onConfirm={confirmRegistration}
                isRegistering={isRegistering}
            />
        </main>
    );
}
