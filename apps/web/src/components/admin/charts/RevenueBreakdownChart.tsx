'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { REVENUE_CHART_DATA, FilterPeriod, RevenueData } from '@/data/mocks/adminDashboard';

const filterLabels: Record<FilterPeriod, string> = {
    today: 'Today',
    week: '7 Days',
    month: 'Month',
    all: 'All-Time',
};

export default function RevenueBreakdownChart() {
    const [filter, setFilter] = useState<FilterPeriod>('today');

    const { data, total, net } = REVENUE_CHART_DATA[filter];

    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Revenue Breakdown</h3>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterPeriod)}
                    className="bg-primary-bg text-xs px-2 py-1 rounded border border-border-dark text-accent-yellow cursor-pointer"
                >
                    {Object.entries(filterLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-primary-bg rounded-xl p-3 text-center">
                    <p className="text-xs text-text-secondary">Gross Revenue</p>
                    <p className="text-lg font-bold text-accent-yellow">{total}</p>
                </div>
                <div className="flex-1 bg-primary-bg rounded-xl p-3 text-center">
                    <p className="text-xs text-text-secondary">Net Revenue</p>
                    <p className="text-lg font-bold text-accent-green">{net}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Chart */}
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a1f',
                                    border: '1px solid #2e2e32',
                                    borderRadius: '8px',
                                    color: '#ffffff',
                                }}
                                labelStyle={{ color: '#ffffff' }}
                                itemStyle={{ color: '#bfbfbf' }}
                                formatter={(value, name) => {
                                    const item = data.find(d => d.name === name);
                                    return [`${value}% (${item?.amount})`, name];
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend with amounts */}
                <div className="flex flex-col justify-center space-y-2">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-xs text-text-secondary">{item.name}</span>
                            </div>
                            <span
                                className={`text-sm font-semibold ${item.name === 'Promotions' ? 'text-danger-red' : 'text-text-primary'
                                    }`}
                            >
                                {item.amount}
                            </span>
                        </div>
                    ))}
                    {/* Total */}
                    <div className="border-t border-border-dark pt-2 mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">Net Revenue</span>
                        <span className="text-sm font-bold text-accent-green">{net}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
