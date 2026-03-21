'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faUsers, faCoins } from '@fortawesome/free-solid-svg-icons';
import { useSidebar } from './SidebarProvider';

export default function Header() {
    const { toggle } = useSidebar();

    return (
        <header className="bg-card-bg border-b border-border-dark p-4">
            <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggle}
                        className="p-2 rounded-xl hover:bg-hover-bg transition-colors lg:hidden"
                        aria-label="Toggle sidebar"
                    >
                        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {/* Online Users Badge */}
                    <div className="hidden sm:flex items-center gap-2 bg-primary-bg px-3 py-2 rounded-xl">
                        <FontAwesomeIcon icon={faUsers} className="text-accent-green" />
                        <span className="font-semibold">247 Online</span>
                    </div>

                    {/* Revenue Badge */}
                    <div className="hidden sm:flex items-center gap-2 bg-primary-bg px-3 py-2 rounded-xl">
                        <FontAwesomeIcon icon={faCoins} className="text-accent-yellow" />
                        <span className="font-semibold">$45,892</span>
                    </div>

                    {/* Admin Avatar */}
                    <div className="relative">
                        <button className="w-10 h-10 rounded-full bg-accent-yellow flex items-center justify-center text-black font-bold hover:ring-2 hover:ring-accent-yellow/50 transition-all">
                            A
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
