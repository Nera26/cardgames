'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const data = [
    { time: '00:00', players: 45 },
    { time: '04:00', players: 23 },
    { time: '08:00', players: 67 },
    { time: '12:00', players: 89 },
    { time: '16:00', players: 156 },
    { time: '20:00', players: 234 },
    { time: '24:00', players: 189 },
];

export default function PlayerActivityChart() {
    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Player Activity (24h)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e2e32" />
                        <XAxis
                            dataKey="time"
                            stroke="#bfbfbf"
                            tick={{ fill: '#bfbfbf' }}
                            axisLine={{ stroke: '#2e2e32' }}
                        />
                        <YAxis
                            stroke="#bfbfbf"
                            tick={{ fill: '#bfbfbf' }}
                            axisLine={{ stroke: '#2e2e32' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1f',
                                border: '1px solid #2e2e32',
                                borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#ffffff' }}
                            itemStyle={{ color: '#bfbfbf' }}
                            formatter={(value) => [`${value} players active`, 'Players']}
                        />
                        <Line
                            type="monotone"
                            dataKey="players"
                            stroke="#FFD700"
                            strokeWidth={2}
                            dot={{ fill: '#FFD700', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#FFD700' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
