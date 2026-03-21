export interface RevenueData {
    name: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export const REVENUE_DATA: RevenueData[] = [
    { name: 'Jan', revenue: 45000, expenses: 32000, profit: 13000 },
    { name: 'Feb', revenue: 52000, expenses: 34000, profit: 18000 },
    { name: 'Mar', revenue: 61000, expenses: 38000, profit: 23000 },
    { name: 'Apr', revenue: 58000, expenses: 36000, profit: 22000 },
    { name: 'May', revenue: 72000, expenses: 42000, profit: 30000 },
    { name: 'Jun', revenue: 85000, expenses: 48000, profit: 37000 },
    { name: 'Jul', revenue: 92000, expenses: 52000, profit: 40000 },
    { name: 'Aug', revenue: 88000, expenses: 50000, profit: 38000 },
    { name: 'Sep', revenue: 95000, expenses: 54000, profit: 41000 },
    { name: 'Oct', revenue: 102000, expenses: 58000, profit: 44000 },
    { name: 'Nov', revenue: 115000, expenses: 62000, profit: 53000 },
    { name: 'Dec', revenue: 128000, expenses: 68000, profit: 60000 },
];

export const REVENUE_STATS = {
    totalRevenue: 993000,
    totalExpenses: 574000,
    netProfit: 419000
};
