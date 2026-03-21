'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

const errorData = [
    { name: 'Payment Failed', value: 145, color: '#ff4d4f' },
    { name: 'Connection Timeout', value: 89, color: '#FFD700' },
    { name: 'Authentication Error', value: 67, color: '#007bff' },
    { name: 'Invalid Request', value: 43, color: '#1C8B4C' },
    { name: 'Server Error', value: 28, color: '#9333ea' },
    { name: 'Other', value: 15, color: '#6b7280' },
];

export default function ErrorDistributionChart() {
    const totalErrors = errorData.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold">Error Distribution</h3>
                    <p className="text-text-secondary text-sm">Last 24 hours</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-danger-red">{totalErrors}</p>
                    <p className="text-text-secondary text-sm">Total Errors</p>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={errorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {errorData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1f', border: '1px solid #2a2a35', borderRadius: '12px' }}
                            labelStyle={{ color: '#fff' }}
                            formatter={(value, name) => [
                                `${value} (${(((value as number) / totalErrors) * 100).toFixed(1)}%)`,
                                name
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                {errorData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-text-secondary text-sm">{item.name}</span>
                        <span className="text-white font-semibold text-sm ml-auto">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
