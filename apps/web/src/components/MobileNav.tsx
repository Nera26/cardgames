import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faWallet, faTrophy, faChartLine } from '@fortawesome/free-solid-svg-icons';

export const MobileNav = () => {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-card-bg/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex justify-around items-center h-[72px] z-50">
            <Link href="/" className={`flex flex-col items-center p-2 min-w-[48px] min-h-[48px] justify-center cursor-pointer transition-all duration-300 ${isActive('/') ? 'text-accent-yellow scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-text-secondary hover:text-white'}`}>
                <FontAwesomeIcon icon={faHome} className="text-xl mb-1" />
                <span className="text-[10px] font-medium tracking-wide">Lobby</span>
            </Link>

            <Link href="/wallet" className={`flex flex-col items-center p-2 min-w-[48px] min-h-[48px] justify-center cursor-pointer transition-all duration-300 ${isActive('/wallet') ? 'text-accent-yellow scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-text-secondary hover:text-white'}`}>
                <FontAwesomeIcon icon={faWallet} className="text-xl mb-1" />
                <span className="text-[10px] font-medium tracking-wide">Wallet</span>
            </Link>

            <Link href="/leaderboard" className={`flex flex-col items-center p-2 min-w-[48px] min-h-[48px] justify-center cursor-pointer transition-all duration-300 ${isActive('/leaderboard') ? 'text-accent-yellow scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-text-secondary hover:text-white'}`}>
                <FontAwesomeIcon icon={faChartLine} className="text-xl mb-1" />
                <span className="text-[10px] font-medium tracking-wide">Leaders</span>
            </Link>

            <Link href="/tournaments" className={`relative flex flex-col items-center p-2 min-w-[48px] min-h-[48px] justify-center cursor-pointer transition-all duration-300 ${isActive('/tournaments') ? 'text-accent-yellow scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'text-text-secondary hover:text-white'}`}>
                <FontAwesomeIcon icon={faTrophy} className="text-xl mb-1" />
                <span className="text-[10px] font-medium tracking-wide">Tourneys</span>
            </Link>

            <Link href="/profile" className={`flex flex-col items-center p-2 min-w-[48px] min-h-[48px] justify-center cursor-pointer transition-all duration-300 ${isActive('/profile') ? 'scale-110 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'opacity-70 hover:opacity-100'}`}>
                <img
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                    alt="User Avatar"
                    className={`w-7 h-7 rounded-full mb-0.5 border-2 object-cover ${isActive('/profile') ? 'border-accent-yellow' : 'border-transparent'}`}
                />
                <span className={`text-[10px] font-medium tracking-wide ${isActive('/profile') ? 'text-accent-yellow' : 'text-text-secondary'}`}>Profile</span>
            </Link>
        </nav>
    );
};
