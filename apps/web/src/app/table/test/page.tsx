'use client';

import React from 'react';
import { PokerTable } from '@/components/game/PokerTable';

/**
 * Test Route: /table/test
 * 
 * Preview the PokerTable component with mock data.
 */
export default function TableTestPage() {
    // Mock data for testing
    const mockSeats = [
        { name: 'Hero', stack: 1250 },
        null,
        { name: 'Alice', stack: 2400 },
        null,
        { name: 'Bob', stack: 800 },
        { name: 'Charlie', stack: 3200 },
        null,
        { name: 'Diana', stack: 1500 },
        null,
    ];

    const mockCards = [
        { rank: 'A', suit: '♠' },
        { rank: 'K', suit: '♥' },
        { rank: 'Q', suit: '♦' },
        // Flop only - turn and river hidden
    ];

    return (
        <div className="min-h-screen bg-primary-bg flex flex-col items-center justify-center p-4 pt-20">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">🃏 Green Felt Test</h1>
                <p className="text-text-secondary text-sm">PokerTable Component Preview</p>
            </div>

            {/* The Table */}
            <PokerTable
                seats={mockSeats as any}
                communityCards={mockCards}
                pot={1250}
            />

            {/* Controls */}
            <div className="mt-8 flex gap-4">
                <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 transition-all">
                    Deal Cards
                </button>
                <button className="px-6 py-3 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-400 transition-all">
                    Add Player
                </button>
            </div>

            {/* Legend */}
            <div className="mt-6 text-xs text-gray-500 text-center">
                <p>9-Max Table • Seats positioned in oval orbit</p>
                <p className="mt-1">S1 = Hero (bottom center) • Clockwise order</p>
            </div>
        </div>
    );
}
