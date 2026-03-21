'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { MobileNav } from './MobileNav';

export default function NavbarWrapper() {
    const pathname = usePathname();

    // Hide navbar on root (redirect), login, game pages and admin pages (admin has its own layout)
    if (pathname === '/' || pathname?.startsWith('/login') || pathname?.startsWith('/game') || pathname?.startsWith('/play') || pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <Navbar />
            {/* MobileNav is also here since it's usually global */}
            <MobileNav />
        </>
    );
}
