import React from 'react';
import Link from 'next/link';
import { faCompass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StateWrapper } from '@/components/ui/StateWrapper';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
    return (
        <main className="container mx-auto px-4 py-8">
            <StateWrapper maxWidth="lg">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-danger-red flex items-center justify-center mb-6">
                        <FontAwesomeIcon icon={faCompass} className="text-3xl sm:text-4xl text-danger-red" />
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-bold text-text-primary mb-2">404</h1>
                    <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-4 opacity-90">Oops! Page Not Found</h2>

                    <p className="text-text-secondary text-base sm:text-lg mb-8 max-w-md">
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <Link
                        href="/"
                        className="bg-accent-green text-text-primary font-bold py-3 px-8 rounded-xl hover:brightness-110 hover-glow-green transition-all duration-200 text-base sm:text-lg uppercase"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </StateWrapper>
        </main>
    );
}
