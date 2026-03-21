"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useGame } from "@/contexts/GameContext";
import { getAvatarUrl } from "@/config/avatars";
import { TIER_CONFIG, Tier } from "@poker/shared";
import { NotificationType } from "@poker/shared";

export default function Navbar() {
    const pathname = usePathname();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { user } = useGame();

    const isActive = (path: string) => {
        return pathname === path ? 'text-accent-yellow' : 'text-gray-400 hover:text-white';
    };

    // State for controlling the notification dropdown
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Tier ring color
    const tierColor = user?.tier
        ? TIER_CONFIG[user.tier as Tier]?.color ?? '#FFD700'
        : '#FFD700';

    // Format balance as currency
    const formattedBalance = user
        ? `$${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00';

    const getIconPrefix = (type: NotificationType) => {
        switch (type) {
            case NotificationType.TOURNAMENT: return 'fa-trophy text-accent-yellow';
            case NotificationType.PERSONAL: return 'fa-user text-accent-green';
            case NotificationType.BONUS: return 'fa-gift text-accent-yellow';
            case NotificationType.ACHIEVEMENT: return 'fa-medal text-orange-500';
            case NotificationType.SYSTEM:
            default: return 'fa-bell text-gray-400';
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <nav className="bg-[#0e0e11] border-b border-[#2e2e32] h-[80px] sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                {/* LEFT: Logo */}
                <div className="flex items-center">
                    <Link href="/lobby" className="flex items-center gap-2 group">
                        <i className="fa-solid fa-spade text-accent-yellow text-2xl group-hover:rotate-12 transition-transform"></i>
                        <span className="text-2xl font-bold text-white tracking-tight">
                            Poker<span className="text-accent-yellow">Hub</span>
                        </span>
                    </Link>
                </div>

                {/* RIGHT SIDE CONTAINER */}
                <div className="flex items-center space-x-6">

                    {/* 1. Profile (Avatar + Username + Tier Ring) */}
                    <Link href="/profile" className="hidden md:flex items-center gap-2.5 group cursor-pointer">
                        <div
                            className="w-10 h-10 rounded-full p-[2px]"
                            style={{ background: `linear-gradient(135deg, ${tierColor}, ${tierColor}88)` }}
                        >
                            <img
                                src={getAvatarUrl(user?.avatarId, user?.avatarUrl)}
                                alt={user?.username ?? 'Avatar'}
                                className="rounded-full w-full h-full border-2 border-black object-cover bg-neutral-800"
                                onError={(e) => { (e.target as HTMLImageElement).src = getAvatarUrl(user?.avatarId); }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-accent-yellow transition-colors leading-tight">
                                {user?.username ?? 'Player'}
                            </span>
                            <span
                                className="text-[10px] font-semibold uppercase tracking-wider leading-tight"
                                style={{ color: tierColor }}
                            >
                                {user?.tier ?? 'BRONZE'}
                            </span>
                        </div>
                    </Link>

                    {/* 2. Balance — Live Ledger */}
                    <Link href="/wallet" className="hidden md:flex items-center gap-2 group cursor-pointer">
                        <i className={`fa-solid fa-wallet text-xl ${isActive('/wallet')}`}></i>
                        <span className="text-white font-bold text-base tabular-nums">
                            {formattedBalance}
                        </span>
                    </Link>

                    {/* 3. Tournaments */}
                    <Link href="/tournaments" className="hidden md:flex items-center gap-2 group cursor-pointer">
                        <i className={`fa-solid fa-trophy text-xl ${isActive('/tournaments')}`}></i>
                        <span className={`text-base font-medium ${isActive('/tournaments')}`}>Tournaments</span>
                    </Link>

                    {/* 4. Promotions */}
                    <Link href="/promotions" className="hidden md:flex items-center gap-2 group cursor-pointer">
                        <i className={`fa-solid fa-tags text-xl ${isActive('/promotions')}`}></i>
                        <span className={`text-base font-medium ${isActive('/promotions')}`}>Promotions</span>
                    </Link>

                    {/* 5. Leaderboard */}
                    <Link href="/leaderboard" className="hidden md:flex items-center gap-2 group cursor-pointer">
                        <i className={`fa-solid fa-chart-line text-xl ${isActive('/leaderboard')}`}></i>
                        <span className={`text-base font-medium ${isActive('/leaderboard')}`}>Leaderboard</span>
                    </Link>

                    {/* 6. Notifications (Already wired via useNotifications) */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={`relative flex items-center transition-colors duration-200 cursor-pointer ${isNotificationsOpen ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                            id="nav-notifications"
                        >
                            <i className="fa-solid fa-bell text-2xl"></i>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-[10px] font-bold text-white border border-[#0e0e11] animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-[#1a1a1f] border border-[#2e2e32] rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                                <div className="p-3 border-b border-[#2e2e32] flex justify-between items-center bg-[#0e0e11]">
                                    <span className="font-bold text-sm text-white">Notifications</span>
                                    <span
                                        className="text-xs text-gray-400 cursor-pointer hover:text-accent-yellow"
                                        onClick={() => markAllAsRead()}
                                    >
                                        Mark all read
                                    </span>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-3 border-b border-[#2e2e32]/50 hover:bg-[#2e2e32] transition-colors cursor-pointer group ${!notif.isRead ? 'bg-[#2e2e32]/30' : ''}`}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1`}>
                                                        <i className={`fa-solid ${getIconPrefix(notif.type)}`}></i>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white group-hover:text-accent-yellow transition-colors flex items-center gap-2">
                                                            {notif.title}
                                                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow"></span>}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-text-secondary text-xs">
                                            No notifications found
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-[#0e0e11] text-center border-t border-[#2e2e32] hover:bg-[#2e2e32] transition-colors">
                                    <Link
                                        href="/notifications"
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className="text-sm text-accent-yellow font-bold uppercase tracking-wide text-xs"
                                    >
                                        View all notifications
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
