"use client";

import React, { useState, useEffect } from 'react';

const FLAVOR_TEXTS = [
    'Shuffling the deck...',
    'Polishing chips...',
    'Reading poker face...',
    'Calculating odds...',
    'Waiting for the big blind...',
    'Checking for aces...',
    'Setting the table...',
    'Dealing you in...',
];

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = ['#a5b4fc', '#f87171', '#fb923c', '#34d399'];

interface LoadingScreenProps {
    message?: string;
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export default function LoadingScreen({ message, text, fullScreen = true, className = '' }: LoadingScreenProps) {
    const displayMessage = message || text;
    const [randomText, setRandomText] = useState('Dealing...');
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (!displayMessage) {
            setRandomText(FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)]);
        }
    }, [displayMessage]);

    // Animated dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const containerClasses = fullScreen
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        : `flex flex-col items-center justify-center p-8 rounded-xl overflow-hidden ${className}`;

    const shownText = displayMessage || randomText;
    // Strip trailing dots from the base text so we can animate our own
    const baseText = shownText.replace(/\.+$/, '');

    return (
        <div className={containerClasses}>
            {/* Ambient Background */}
            <div className="ls-bg" />

            {/* Floating Orbs */}
            <div className="ls-orb ls-orb-1" />
            <div className="ls-orb ls-orb-2" />
            <div className="ls-orb ls-orb-3" />

            {/* Card Fan Animation */}
            <div className="ls-card-fan">
                {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="ls-card" style={{
                        '--card-index': i,
                        '--card-delay': `${i * 0.15}s`,
                    } as React.CSSProperties}>
                        <div className="ls-card-inner">
                            <div className="ls-card-front">
                                <span className="ls-card-suit" style={{ color: SUIT_COLORS[i % 4] }}>
                                    {SUITS[i % 4]}
                                </span>
                            </div>
                            <div className="ls-card-back">
                                <div className="ls-card-pattern" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Orbital Ring */}
            <div className="ls-ring">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className="ls-ring-dot" style={{
                        '--dot-index': i,
                    } as React.CSSProperties} />
                ))}
            </div>

            {/* Text */}
            <div className="ls-text-container">
                <p className="ls-title">{baseText}<span className="ls-dots">{dots}</span></p>
                <div className="ls-progress">
                    <div className="ls-progress-bar" />
                </div>
            </div>

            <style jsx global>{`
                /* === Background === */
                .ls-bg {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(ellipse at 50% 40%, #1a1f3a 0%, #0c0e1a 50%, #060810 100%);
                    z-index: -3;
                }

                /* === Floating Orbs === */
                .ls-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.35;
                    z-index: -2;
                    animation: orbFloat 8s ease-in-out infinite;
                }
                .ls-orb-1 {
                    width: 300px; height: 300px;
                    background: radial-gradient(circle, #6366f1, transparent 70%);
                    top: 20%; left: 15%;
                    animation-delay: 0s;
                }
                .ls-orb-2 {
                    width: 250px; height: 250px;
                    background: radial-gradient(circle, #f59e0b, transparent 70%);
                    bottom: 20%; right: 15%;
                    animation-delay: -3s;
                }
                .ls-orb-3 {
                    width: 200px; height: 200px;
                    background: radial-gradient(circle, #10b981, transparent 70%);
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    animation-delay: -5s;
                }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -30px) scale(1.1); }
                    50% { transform: translate(-15px, 20px) scale(0.95); }
                    75% { transform: translate(25px, 15px) scale(1.05); }
                }

                /* === Card Fan === */
                .ls-card-fan {
                    position: relative;
                    width: 120px;
                    height: 160px;
                    margin-bottom: 48px;
                    perspective: 800px;
                }

                .ls-card {
                    position: absolute;
                    width: 72px;
                    height: 100px;
                    left: 50%;
                    bottom: 0;
                    transform-origin: 50% 100%;
                    animation: cardFan 3s ease-in-out infinite;
                    animation-delay: var(--card-delay);
                }

                .ls-card-inner {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    animation: cardFlip 3s ease-in-out infinite;
                    animation-delay: var(--card-delay);
                }

                .ls-card-front, .ls-card-back {
                    position: absolute;
                    inset: 0;
                    border-radius: 8px;
                    backface-visibility: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ls-card-front {
                    background: linear-gradient(145deg, #1e2140, #161830);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow:
                        0 4px 20px rgba(0, 0, 0, 0.4),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08);
                }

                .ls-card-back {
                    background: linear-gradient(145deg, #2d1f6e, #1a1248);
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    transform: rotateY(180deg);
                    overflow: hidden;
                }

                .ls-card-pattern {
                    width: 80%;
                    height: 80%;
                    border-radius: 4px;
                    background:
                        repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 4px,
                            rgba(139, 92, 246, 0.15) 4px,
                            rgba(139, 92, 246, 0.15) 5px
                        );
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .ls-card-suit {
                    font-size: 28px;
                    filter: drop-shadow(0 0 8px currentColor);
                }

                @keyframes cardFan {
                    0%, 100% {
                        transform: translateX(-50%) rotate(calc((var(--card-index) - 2) * 12deg))
                                   translateY(calc(var(--card-index) * -2px));
                        opacity: 1;
                    }
                    15% {
                        transform: translateX(-50%) rotate(calc((var(--card-index) - 2) * 12deg))
                                   translateY(calc(-40px + var(--card-index) * -2px));
                        opacity: 1;
                    }
                    50% {
                        transform: translateX(-50%) rotate(calc((var(--card-index) - 2) * 18deg))
                                   translateY(calc(var(--card-index) * -3px));
                        opacity: 1;
                    }
                }

                @keyframes cardFlip {
                    0%, 40% { transform: rotateY(0deg); }
                    50%, 90% { transform: rotateY(180deg); }
                    100% { transform: rotateY(360deg); }
                }

                /* === Orbital Ring === */
                .ls-ring {
                    position: absolute;
                    width: 200px;
                    height: 200px;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -65%);
                    animation: ringRotate 6s linear infinite;
                }

                .ls-ring-dot {
                    position: absolute;
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #a5b4fc;
                    top: 50%;
                    left: 50%;
                    box-shadow: 0 0 10px #6366f1, 0 0 20px rgba(99, 102, 241, 0.3);
                    transform: rotate(calc(var(--dot-index) * 45deg)) translateX(100px) translateY(-50%);
                    opacity: calc(0.3 + var(--dot-index) * 0.09);
                }

                @keyframes ringRotate {
                    from { transform: translate(-50%, -65%) rotate(0deg); }
                    to { transform: translate(-50%, -65%) rotate(360deg); }
                }

                /* === Text === */
                .ls-text-container {
                    text-align: center;
                    z-index: 1;
                }

                .ls-title {
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 15px;
                    font-weight: 500;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 16px;
                }

                .ls-dots {
                    display: inline-block;
                    width: 20px;
                    text-align: left;
                }

                .ls-progress {
                    width: 180px;
                    height: 2px;
                    background: rgba(255, 255, 255, 0.06);
                    border-radius: 2px;
                    overflow: hidden;
                    margin: 0 auto;
                }

                .ls-progress-bar {
                    width: 40%;
                    height: 100%;
                    border-radius: 2px;
                    background: linear-gradient(90deg, #6366f1, #a78bfa, #6366f1);
                    background-size: 200% 100%;
                    animation: progressSlide 1.5s ease-in-out infinite;
                }

                @keyframes progressSlide {
                    0% { transform: translateX(-100%); background-position: 0% 0; }
                    50% { background-position: 100% 0; }
                    100% { transform: translateX(350%); background-position: 0% 0; }
                }
            `}</style>
        </div>
    );
}
