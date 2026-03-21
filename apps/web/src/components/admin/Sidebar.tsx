'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faUsers,
    faTable,
    faTrophy,
    faGift,
    faBullhorn,
    faUniversity,
    faClipboardList,
    faChartBar,
    faXmark,
    faServer,
    faHeadset,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useSidebar } from './SidebarProvider';

interface NavItem {
    label: string;
    href: string;
    icon: IconDefinition;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: faChartLine },
    { label: 'Manage Users', href: '/admin/users', icon: faUsers },
    { label: 'Game Management', href: '/admin/game-management', icon: faTable },
    { label: 'Tournaments', href: '/admin/tournaments', icon: faTrophy },
    { label: 'Bonus Manager', href: '/admin/bonuses', icon: faGift },
    { label: 'Broadcast', href: '/admin/broadcast', icon: faBullhorn },
    { label: 'Balance & Transactions', href: '/admin/finance', icon: faUniversity },
    { label: 'Analytics', href: '/admin/analytics', icon: faChartBar },
    { label: 'Monitoring', href: '/admin/monitoring', icon: faServer },
    { label: 'Support', href: '/admin/support', icon: faHeadset },
    { label: 'Audit Logs', href: '/admin/audit', icon: faClipboardList },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isOpen, close } = useSidebar();

    const isActive = (href: string): boolean => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-card-bg border-r border-border-dark
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Close Button */}
                    <div className="flex items-center justify-between p-4 lg:hidden">
                        <span className="text-lg font-bold">Menu</span>
                        <button
                            onClick={close}
                            className="p-2 rounded-xl hover:bg-hover-bg transition-colors"
                            aria-label="Close sidebar"
                        >
                            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={close}
                                    className={`
                    flex items-center gap-3 px-3 py-2 rounded-xl font-medium
                    transition-colors duration-200
                    ${active
                                            ? 'bg-accent-yellow text-black'
                                            : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                                        }
                  `}
                                >
                                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
}
