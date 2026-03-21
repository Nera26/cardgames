import React from 'react';
import { TournamentResponseDto } from '@poker/shared';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: TournamentResponseDto | null;
    userBalance: number;
    onConfirm: () => void;
    isRegistering?: boolean;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
    isOpen,
    onClose,
    tournament,
    userBalance,
    onConfirm,
    isRegistering = false,
}) => {
    if (!isOpen || !tournament) return null;

    const totalCost = tournament.buyIn + tournament.fee;
    const canAfford = totalCost === 0 || userBalance >= totalCost;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-card-bg border border-border-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
                <div className="p-6 border-b border-border-dark flex justify-between items-center bg-primary-bg/50">
                    <h2 className="text-xl font-bold">Register for Tournament</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-white">
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Tournament:</span>
                        <span className="font-bold text-white">{tournament.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Buy-in:</span>
                        <span className="font-bold text-accent-yellow">
                            {tournament.buyIn === 0 ? 'Free' : `$${tournament.buyIn} + $${tournament.fee}`}
                        </span>
                    </div>
                    {tournament.bountyAmount != null && tournament.bountyAmount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">Bounty:</span>
                            <span className="font-bold text-accent-blue">${tournament.bountyAmount}</span>
                        </div>
                    )}
                    <div className="border-t border-border-dark my-4"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Your Balance:</span>
                        <span className={`font-bold ${!canAfford ? 'text-danger-red' : 'text-accent-green'}`}>
                            ${userBalance.toFixed(2)}
                        </span>
                    </div>
                    {totalCost > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">After Registration:</span>
                            <span className={`font-bold ${!canAfford ? 'text-danger-red' : 'text-text-primary'}`}>
                                ${(userBalance - totalCost).toFixed(2)}
                            </span>
                        </div>
                    )}

                    {!canAfford && (
                        <div className="bg-danger-red/10 border border-danger-red/50 rounded-lg p-3 flex items-center gap-3 text-sm text-danger-red">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            Insufficient funds to register.
                        </div>
                    )}

                    <button
                        onClick={onConfirm}
                        disabled={!canAfford || isRegistering}
                        className={`w-full py-3 rounded-xl font-bold text-lg mt-4 transition-all flex items-center justify-center gap-2 ${!canAfford || isRegistering
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-accent-green text-white hover:shadow-[0_0_15px_rgba(28,139,76,0.4)] hover:brightness-110'
                            }`}
                    >
                        {isRegistering ? (
                            <>
                                <i className="fa-solid fa-spinner animate-spin"></i>
                                Registering...
                            </>
                        ) : !canAfford ? (
                            'Deposit Required'
                        ) : (
                            'Confirm Registration'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
