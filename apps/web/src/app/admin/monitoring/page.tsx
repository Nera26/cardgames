'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faServer,
    faMemory,
    faMicrochip,
    faHdd,
    faWifi,
    faCircle,
    faExclamationTriangle,
    faRefresh,
    faGlobe,
    faUsers,
    faClock,
    faNetworkWired
} from '@fortawesome/free-solid-svg-icons';

interface ServerLocation {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'warning' | 'offline';
    latency: number;
    players: number;
    position: { top: string; left: string };
}

const serverLocations: ServerLocation[] = [
    { id: 'us-east', name: 'US East', location: 'New York', status: 'online', latency: 12, players: 847, position: { top: '35%', left: '22%' } },
    { id: 'us-west', name: 'US West', location: 'Los Angeles', status: 'online', latency: 18, players: 523, position: { top: '38%', left: '12%' } },
    { id: 'eu-west', name: 'EU West', location: 'London', status: 'online', latency: 45, players: 692, position: { top: '30%', left: '45%' } },
    { id: 'eu-central', name: 'EU Central', location: 'Frankfurt', status: 'warning', latency: 52, players: 445, position: { top: '32%', left: '50%' } },
    { id: 'asia-east', name: 'Asia East', location: 'Tokyo', status: 'online', latency: 120, players: 356, position: { top: '38%', left: '82%' } },
    { id: 'asia-south', name: 'Asia South', location: 'Singapore', status: 'online', latency: 95, players: 234, position: { top: '55%', left: '75%' } },
    { id: 'aus', name: 'Australia', location: 'Sydney', status: 'offline', latency: 0, players: 0, position: { top: '75%', left: '85%' } },
    { id: 'sa', name: 'South America', location: 'São Paulo', status: 'online', latency: 78, players: 189, position: { top: '70%', left: '30%' } },
];

const systemMetrics = [
    { label: 'CPU Usage', value: 42, max: 100, unit: '%', icon: faMicrochip, color: 'accent-green' },
    { label: 'Memory', value: 68, max: 100, unit: '%', icon: faMemory, color: 'accent-yellow' },
    { label: 'Disk I/O', value: 23, max: 100, unit: '%', icon: faHdd, color: 'accent-blue' },
    { label: 'Network', value: 156, max: 1000, unit: 'Mbps', icon: faWifi, color: 'accent-green' },
];

const recentEvents = [
    { time: '10:45:22', type: 'info', message: 'Server EU-Central experiencing high load' },
    { time: '10:42:15', type: 'warning', message: 'Database replication lag detected (3.2s)' },
    { time: '10:38:44', type: 'error', message: 'Server AUS went offline - automatic failover initiated' },
    { time: '10:35:01', type: 'info', message: 'Scheduled maintenance completed on US-East' },
    { time: '10:30:00', type: 'success', message: 'All systems operating normally' },
];

export default function MonitoringPage() {
    const [selectedServer, setSelectedServer] = useState<ServerLocation | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setLastUpdate(new Date().toLocaleTimeString());
        }, 1000);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-accent-green';
            case 'warning': return 'bg-accent-yellow';
            case 'offline': return 'bg-danger-red';
            default: return 'bg-gray-500';
        }
    };

    const totalPlayers = serverLocations.reduce((acc, s) => acc + s.players, 0);
    const onlineServers = serverLocations.filter(s => s.status === 'online').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
                    <p className="text-text-secondary">Global server infrastructure status</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-text-secondary text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} />
                        Last updated: {lastUpdate}
                    </span>
                    <button
                        onClick={handleRefresh}
                        className={`bg-accent-blue hover:shadow-[0_0_20px_rgba(0,123,255,0.3)] px-4 py-2 rounded-xl font-semibold text-sm transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                        disabled={isRefreshing}
                    >
                        <FontAwesomeIcon icon={faRefresh} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card-bg p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-green/20 rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon icon={faServer} className="text-accent-green" />
                        </div>
                        <div>
                            <p className="text-text-secondary text-sm">Online Servers</p>
                            <p className="text-xl font-bold">{onlineServers}/{serverLocations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card-bg p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon icon={faUsers} className="text-accent-blue" />
                        </div>
                        <div>
                            <p className="text-text-secondary text-sm">Active Players</p>
                            <p className="text-xl font-bold">{totalPlayers.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card-bg p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-yellow/20 rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon icon={faNetworkWired} className="text-accent-yellow" />
                        </div>
                        <div>
                            <p className="text-text-secondary text-sm">Avg Latency</p>
                            <p className="text-xl font-bold">52ms</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card-bg p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-danger-red/20 rounded-xl flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-danger-red" />
                        </div>
                        <div>
                            <p className="text-text-secondary text-sm">Alerts</p>
                            <p className="text-xl font-bold">2</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Server Map */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faGlobe} className="text-accent-blue" />
                        Global Server Map
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-accent-green rounded-full animate-pulse" />
                            Online
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-accent-yellow rounded-full animate-pulse" />
                            Warning
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-danger-red rounded-full" />
                            Offline
                        </span>
                    </div>
                </div>

                {/* World Map Container */}
                <div className="relative w-full aspect-[2/1] bg-[#0a0a0d] rounded-xl overflow-hidden">
                    {/* World Map Background - Using CSS gradient as placeholder */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `
                                radial-gradient(ellipse 80% 50% at 50% 50%, rgba(26, 26, 31, 0.8), transparent),
                                url('data:image/svg+xml,${encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" fill="none">
                                        <path fill="%231a1a1f" d="M0 0h800v400H0z"/>
                                        <!-- Simplified continents -->
                                        <ellipse cx="180" cy="160" rx="80" ry="60" fill="%232a2a35"/>
                                        <ellipse cx="400" cy="140" rx="100" ry="50" fill="%232a2a35"/>
                                        <ellipse cx="650" cy="180" rx="70" ry="80" fill="%232a2a35"/>
                                        <ellipse cx="700" cy="300" rx="50" ry="40" fill="%232a2a35"/>
                                        <ellipse cx="250" cy="280" rx="40" ry="60" fill="%232a2a35"/>
                                        <ellipse cx="550" cy="220" rx="60" ry="40" fill="%232a2a35"/>
                                    </svg>
                                `)}')
                            `
                        }}
                    />

                    {/* Server Location Dots */}
                    {serverLocations.map((server) => (
                        <button
                            key={server.id}
                            onClick={() => setSelectedServer(server)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ top: server.position.top, left: server.position.left }}
                        >
                            {/* Pulse ring for online/warning servers */}
                            {server.status !== 'offline' && (
                                <span className={`absolute w-6 h-6 rounded-full ${getStatusColor(server.status)} opacity-40 animate-ping`} />
                            )}
                            {/* Main dot */}
                            <span className={`relative block w-4 h-4 rounded-full ${getStatusColor(server.status)} shadow-lg ${server.status !== 'offline' ? 'animate-pulse' : ''}`} />

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card-bg border border-border-dark rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                <p className="font-semibold">{server.name}</p>
                                <p className="text-text-secondary text-xs">{server.location}</p>
                                {server.status !== 'offline' && (
                                    <p className="text-accent-green text-xs">{server.latency}ms • {server.players} players</p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Selected Server Details */}
                {selectedServer && (
                    <div className="mt-4 p-4 bg-hover-bg rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className={`w-4 h-4 rounded-full ${getStatusColor(selectedServer.status)} ${selectedServer.status !== 'offline' ? 'animate-pulse' : ''}`} />
                            <div>
                                <p className="font-bold">{selectedServer.name}</p>
                                <p className="text-text-secondary text-sm">{selectedServer.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-text-secondary text-sm">Status</p>
                                <p className={`font-semibold capitalize ${selectedServer.status === 'online' ? 'text-accent-green' :
                                        selectedServer.status === 'warning' ? 'text-accent-yellow' : 'text-danger-red'
                                    }`}>{selectedServer.status}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-text-secondary text-sm">Latency</p>
                                <p className="font-semibold">{selectedServer.latency}ms</p>
                            </div>
                            <div className="text-center">
                                <p className="text-text-secondary text-sm">Players</p>
                                <p className="font-semibold text-accent-blue">{selectedServer.players}</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Two Column: System Metrics & Events */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Metrics */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4">System Metrics</h3>
                    <div className="space-y-4">
                        {systemMetrics.map((metric, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-text-secondary">
                                        <FontAwesomeIcon icon={metric.icon} />
                                        {metric.label}
                                    </span>
                                    <span className="font-semibold">
                                        {metric.value}{metric.unit === '%' ? '%' : ` ${metric.unit}`}
                                    </span>
                                </div>
                                <div className="h-2 bg-hover-bg rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-${metric.color} rounded-full transition-all`}
                                        style={{ width: `${(metric.value / metric.max) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Events */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4">Recent Events</h3>
                    <div className="space-y-3">
                        {recentEvents.map((event, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-hover-bg rounded-xl">
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    className={`text-xs mt-1 ${event.type === 'error' ? 'text-danger-red' :
                                            event.type === 'warning' ? 'text-accent-yellow' :
                                                event.type === 'success' ? 'text-accent-green' : 'text-accent-blue'
                                        }`}
                                />
                                <div className="flex-1">
                                    <p className="text-sm">{event.message}</p>
                                    <p className="text-text-secondary text-xs">{event.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Server Table */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">All Servers</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-dark">
                                <th className="text-left py-3 px-2 text-text-secondary">Server</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Location</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Status</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Latency</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Players</th>
                                <th className="text-left py-3 px-2 text-text-secondary">CPU</th>
                                <th className="text-left py-3 px-2 text-text-secondary">Memory</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serverLocations.map((server) => (
                                <tr key={server.id} className="border-b border-border-dark hover:bg-hover-bg">
                                    <td className="py-3 px-2 font-semibold">{server.name}</td>
                                    <td className="py-3 px-2 text-text-secondary">{server.location}</td>
                                    <td className="py-3 px-2">
                                        <span className={`flex items-center gap-2 ${server.status === 'online' ? 'text-accent-green' :
                                                server.status === 'warning' ? 'text-accent-yellow' : 'text-danger-red'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${getStatusColor(server.status)} ${server.status !== 'offline' ? 'animate-pulse' : ''}`} />
                                            {server.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">{server.latency > 0 ? `${server.latency}ms` : '-'}</td>
                                    <td className="py-3 px-2 text-accent-blue">{server.players > 0 ? server.players : '-'}</td>
                                    <td className="py-3 px-2">{server.status !== 'offline' ? `${Math.floor(Math.random() * 40 + 20)}%` : '-'}</td>
                                    <td className="py-3 px-2">{server.status !== 'offline' ? `${Math.floor(Math.random() * 30 + 40)}%` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
