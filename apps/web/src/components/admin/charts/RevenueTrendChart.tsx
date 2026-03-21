'use client';

import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

import { REVENUE_DATA, REVENUE_STATS } from '@/data/mocks/revenueTrends';

interface TimeFilter {
    period: '7d' | '30d' | '90d' | '1y';
}

export default function RevenueTrendChart() {
    const [filter, setFilter] = useState<TimeFilter['period']>('1y');

    const filterButtons: { value: TimeFilter['period']; label: string }[] = [
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '1y', label: '1 Year' },
    ];

    // Slice data based on filter
    const getFilteredData = () => {
        switch (filter) {
            case '7d': return REVENUE_DATA.slice(-1);
            case '30d': return REVENUE_DATA.slice(-3);
            case '90d': return REVENUE_DATA.slice(-6);
            default: return REVENUE_DATA;
        }
    };

    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold">Revenue Trend</h3>
                    <p className="text-text-secondary text-sm">Monthly revenue, expenses, and profit</p>
                </div>
                <div className="flex gap-2">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filter === btn.value
                                ? 'bg-accent-blue text-white'
                                : 'bg-hover-bg text-text-secondary hover:text-white'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getFilteredData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                        <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                        <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: '12px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value) => [`$${(value as number).toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#FFD700"
                            strokeWidth={3}
                            dot={{ fill: '#FFD700', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                            name="Revenue"
                        />
                        <Line
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ff4d4f"
                            strokeWidth={2}
                            dot={{ fill: '#ff4d4f', strokeWidth: 2 }}
                            name="Expenses"
                        />
                        <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#1C8B4C"
                            strokeWidth={2}
                            dot={{ fill: '#1C8B4C', strokeWidth: 2 }}
                            name="Profit"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-dark">
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Total Revenue</p>
                    <p className="text-xl font-bold text-accent-yellow">${REVENUE_STATS.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Total Expenses</p>
                    <p className="text-xl font-bold text-danger-red">${REVENUE_STATS.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="text-text-secondary text-sm">Net Profit</p>
                    <p className="text-xl font-bold text-accent-green">${REVENUE_STATS.netProfit.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}
