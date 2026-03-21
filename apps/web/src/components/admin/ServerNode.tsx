'use client';

interface ServerNodeProps {
    top: string;
    left: string;
    region: string;
    location: string;
    status: 'online' | 'warning' | 'offline';
    latency?: number;
    players?: number;
    onClick?: () => void;
}

export default function ServerNode({
    top,
    left,
    region,
    location,
    status,
    latency = 0,
    players = 0,
    onClick
}: ServerNodeProps) {
    const statusColors = {
        online: 'bg-accent-green',
        warning: 'bg-accent-yellow',
        offline: 'bg-danger-red'
    };

    const glowColors = {
        online: 'shadow-[0_0_20px_rgba(28,139,76,0.6)]',
        warning: 'shadow-[0_0_20px_rgba(255,215,0,0.6)]',
        offline: 'shadow-[0_0_10px_rgba(255,77,79,0.4)]'
    };

    return (
        <button
            onClick={onClick}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
            style={{ top, left }}
        >
            {/* Outer pulse ring for online/warning servers */}
            {status !== 'offline' && (
                <span
                    className={`absolute inset-0 w-8 h-8 -m-2 rounded-full ${statusColors[status]} opacity-30 animate-ping`}
                />
            )}

            {/* Main dot with glow effect */}
            <span
                className={`
                    relative block w-4 h-4 rounded-full 
                    ${statusColors[status]} 
                    ${glowColors[status]}
                    ${status !== 'offline' ? 'animate-pulse' : ''}
                    transition-all duration-300 hover:scale-150
                `}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-card-bg border border-border-dark rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                <p className="font-semibold text-sm">{region}</p>
                <p className="text-text-secondary text-xs">{location}</p>
                {status !== 'offline' ? (
                    <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-accent-green">{latency}ms</span>
                        <span className="text-accent-blue">{players} players</span>
                    </div>
                ) : (
                    <p className="text-danger-red text-xs mt-1">Offline</p>
                )}
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-card-bg" />
            </div>
        </button>
    );
}
