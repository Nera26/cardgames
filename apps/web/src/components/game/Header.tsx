'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faVolumeHigh,
    faVolumeMute,
    faCoins
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface HeaderProps {
    tableId: string;
    stakes: string;
    balance: number;
    userAvatar: string;
    isSoundOn: boolean;
    onToggleSound: () => void;
    onSitOut: () => void;
    onLeave: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    tableId,
    stakes,
    balance,
    userAvatar,
    isSoundOn,
    onToggleSound,
    onSitOut,
    onLeave,
}) => {
    return (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border-color bg-dark-bg z-30">
            <div className="flex items-center gap-4 sm:gap-6">
                <Link
                    href="/dashboard"
                    className="text-text-secondary hover:text-text-primary p-2 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-lg sm:text-xl" />
                </Link>
                <div className="px-2">
                    <h1 className="text-base sm:text-lg font-bold truncate">Table #{tableId}</h1>
                    <p className="text-[10px] sm:text-sm text-text-secondary truncate">{stakes}</p>
                </div>

                {/* Table Selection Tabs (Simulated) */}
                {/* TODO: Implement actual table switching logic */}
                <div className="hidden md:flex items-center gap-3 ml-4">
                    <button className="bg-accent-yellow text-black px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110">
                        Table 1
                    </button>
                    <button className="bg-dark-bg text-text-secondary px-4 py-2 rounded-lg text-sm hover:bg-hover-bg transition-all border border-border-color">
                        Table 2
                    </button>
                    <button className="bg-dark-bg text-text-secondary px-4 py-2 rounded-lg text-sm hover:bg-hover-bg transition-all border border-border-color">
                        +
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    className="text-text-secondary hover:text-text-primary p-2 transition-colors"
                    onClick={onToggleSound}
                >
                    <FontAwesomeIcon icon={isSoundOn ? faVolumeHigh : faVolumeMute} className="text-lg" />
                </button>

                <button
                    className="hidden sm:block bg-dark-bg text-text-secondary hover:bg-hover-bg px-4 py-2 rounded-lg text-sm font-medium transition-all border border-border-color"
                    onClick={onSitOut}
                >
                    Sit Out
                </button>

                <button
                    className="hidden sm:block bg-danger-red hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg active:scale-95"
                    onClick={onLeave}
                >
                    Leave
                </button>

                <div className="flex items-center gap-2 sm:gap-3 bg-card-bg px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-border-color shadow-inner">
                    <FontAwesomeIcon icon={faCoins} className="text-accent-yellow text-sm sm:text-base" />
                    <span className="font-semibold text-sm sm:text-base">${balance.toLocaleString()}</span>
                </div>

                <div className="relative ml-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-border-color hover:border-accent-yellow transition-colors cursor-pointer">
                        <Image
                            src={userAvatar}
                            alt="User Profile"
                            width={40}
                            height={40}
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
