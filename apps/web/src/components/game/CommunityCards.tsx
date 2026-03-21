'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card as CardType } from '@/types/game';
import { AnimatedCard } from './AnimatedCard';
import { useTableLayoutOptional } from '@/contexts/TableLayoutContext';

interface CommunityCardsProps {
    cards: CardType[];
    className?: string;
    /** When set, only these cards get the golden shine; others are dimmed */
    highlightCards?: string[];
}

const CommunityCardsInner: React.FC<CommunityCardsProps> = ({
    cards,
    className,
    highlightCards,
}) => {
    // 🟣 Iron Grid: register each board slot for animation targeting
    const layout = useTableLayoutOptional();


    // Fill remaining slots with empty placeholders (5 cards total)
    const displayCards: CardType[] = [];
    for (let i = 0; i < 5; i++) {
        if (i < cards.length) {
            displayCards.push(cards[i]);
        } else {
            displayCards.push({ rank: '', suit: 'spades', isFaceUp: false });
        }
    }

    return (
        <div className={cn(
            'flex items-center justify-center gap-1 sm:gap-2',
            'p-2',
            className
        )}>
            {displayCards.map((card, index) => {
                const isDealt = index < cards.length;

                // 🔑 STABLE positional key — prevents unmount/remount during runout.
                // When card goes from placeholder → real, the component stays mounted
                // and only flips via the isFaceUp prop change.
                const cardKey = `board-${index}`;

                // Showdown spotlight: determine if this card is in the winning 5
                const isSpotlighted = highlightCards && isDealt
                    ? highlightCards.includes(`${card.rank}${card.suit}`)
                    : false;
                const isDimmedBySpotlight = highlightCards && isDealt && !isSpotlighted;

                return (
                    <div
                        key={cardKey}
                        ref={layout?.registerBoardSlot(index)}
                        className={cn(
                            'transition-opacity duration-300',
                            isDealt ? 'opacity-100' : 'opacity-20'
                        )}
                    >
                        <AnimatedCard
                            card={card}
                            size="md"
                            delay={0.15}
                            isWinning={isSpotlighted}
                            isDimmed={!!isDimmedBySpotlight}
                            className={cn(
                                isDealt && 'hover:scale-105 hover:-translate-y-2 cursor-pointer'
                            )}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export const CommunityCards = React.memo(CommunityCardsInner);

