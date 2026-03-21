'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faUsers,
    faDollarSign,
    faGamepad,
    faArrowUp,
    faArrowDown,
    faDownload,
    faCalendar
} from '@fortawesome/free-solid-svg-icons';
import RevenueTrendChart from '@/components/admin/charts/RevenueTrendChart';
import ErrorDistributionChart from '@/components/admin/charts/ErrorDistributionChart';

const analyticsStats = [
    { title: 'Total Revenue', value: '$128,450', change: '+12.5%', isPositive: true, icon: faDollarSign, color: 'accent-yellow' },
    { title: 'Active Players', value: '2,847', change: '+8.3%', isPositive: true, icon: faUsers, color: 'accent-green' },
    { title: 'Games Played', value: '45,892', change: '+15.2%', isPositive: true, icon: faGamepad, color: 'accent-blue' },
    { title: 'Conversion Rate', value: '23.4%', change: '-2.1%', isPositive: false, icon: faChartLine, color: 'danger-red' },
];

const topGames = [
    { name: 'No Limit Hold\'em', players: 1245, revenue: '$45,230', growth: '+18%' },
    { name: 'Pot Limit Omaha', players: 567, revenue: '$23,450', growth: '+12%' },
    { name: 'Sunday Million', players: 892, revenue: '$89,200', growth: '+25%' },
    { name: 'Sit & Go Turbo', players: 345, revenue: '$12,340', growth: '+8%' },
    { name: 'Micro Stakes NL', players: 2103, revenue: '$8,450', growth: '+5%' },
];

const recentTransactions = [
    { user: 'Mike_P', type: 'Deposit', amount: '+$500', time: '2 min ago', status: 'completed' },
    { user: 'Sarah_K', type: 'Withdrawal', amount: '-$1,200', time: '15 min ago', status: 'pending' },
    { user: 'John_D', type: 'Tournament Fee', amount: '-$100', time: '32 min ago', status: 'completed' },
    { user: 'Alex_R', type: 'Deposit', amount: '+$250', time: '1 hour ago', status: 'completed' },
    { user: 'Lisa_M', type: 'Cashout', amount: '-$3,500', time: '2 hours ago', status: 'completed' },
];

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState('7d');

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                    <p className="text-text-secondary">Comprehensive platform insights and metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card-bg px-4 py-2 rounded-xl">
                        <FontAwesomeIcon icon={faCalendar} className="text-text-secondary" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent border-none text-sm focus:outline-none"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>
                    </div>
                    <button className="bg-accent-yellow hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] text-black px-4 py-2 rounded-xl font-semibold text-sm transition-all">
                        <FontAwesomeIcon icon={faDownload} className="mr-2" />Export Report
                    </button>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsStats.map((stat, i) => (
                    <div key={i} className="bg-card-bg p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-${stat.color}/20 flex items-center justify-center`}>
                                <FontAwesomeIcon icon={stat.icon} className={`text-${stat.color} text-xl`} />
                            </div>
                            <span className={`text-sm font-semibold flex items-center gap-1 ${stat.isPositive ? 'text-accent-green' : 'text-danger-red'}`}>
                                <FontAwesomeIcon icon={stat.isPositive ? faArrowUp : faArrowDown} />
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-text-secondary text-sm">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </section>

            {/* Charts Grid - Responsive */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueTrendChart />
                <ErrorDistributionChart />
            </section>

            {/* Two Column Layout - Top Games & Recent Transactions */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Games */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4">Top Performing Games</h3>
                    <div className="space-y-3">
                        {topGames.map((game, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-hover-bg rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-accent-blue/20 text-accent-blue rounded-lg flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-semibold">{game.name}</p>
                                        <p className="text-text-secondary text-sm">{game.players} players</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-accent-green">{game.revenue}</p>
                                    <p className="text-accent-green text-sm">{game.growth}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
                    <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                        {recentTransactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-hover-bg rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-accent-yellow/20 rounded-full flex items-center justify-center font-bold text-accent-yellow">
                                        {tx.user.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{tx.user}</p>
                                        <p className="text-text-secondary text-sm">{tx.type} • {tx.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${tx.amount.startsWith('+') ? 'text-accent-green' : 'text-danger-red'}`}>
                                        {tx.amount}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded ${tx.status === 'completed' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'
                                        }`}>
                                        {tx.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hourly Activity Heatmap */}
            <section className="bg-card-bg p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-bold mb-4">Hourly Activity (Last 7 Days)</h3>
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-25 gap-1 min-w-[600px]">
                        {/* Hour labels */}
                        <div className="text-xs text-text-secondary"></div>
                        {Array.from({ length: 24 }, (_, i) => (
                            <div key={i} className="text-xs text-text-secondary text-center">
                                {i}h
                            </div>
                        ))}
                        {/* Days */}
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <>
                                <div key={`${day}-label`} className="text-xs text-text-secondary flex items-center">
                                    {day}
                                </div>
                                {Array.from({ length: 24 }, (_, i) => {
                                    const intensity = Math.random();
                                    return (
                                        <div
                                            key={`${day}-${i}`}
                                            className="w-4 h-4 rounded-sm"
                                            style={{
                                                backgroundColor: intensity > 0.7
                                                    ? '#1C8B4C'
                                                    : intensity > 0.4
                                                        ? '#FFD700'
                                                        : intensity > 0.2
                                                            ? '#2a2a35'
                                                            : '#1a1a1f'
                                            }}
                                            title={`${day} ${i}:00 - ${Math.floor(intensity * 1000)} players`}
                                        />
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-end gap-4 mt-4 text-xs text-text-secondary">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-[#1a1a1f]" />
                        <div className="w-3 h-3 rounded-sm bg-[#2a2a35]" />
                        <div className="w-3 h-3 rounded-sm bg-accent-yellow" />
                        <div className="w-3 h-3 rounded-sm bg-accent-green" />
                    </div>
                    <span>More</span>
                </div>
            </section>
        </div>
    );
}
