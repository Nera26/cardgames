'use client';

import {
    faUsers,
    faDollarSign,
    faTable,
    faTrophy,
    faArrowDown,
    faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import StatCard from '@/components/admin/StatCard';
import FilterableStatCard from '@/components/admin/FilterableStatCard';
import PlayerActivityChart from '@/components/admin/charts/PlayerActivityChart';
import RevenueBreakdownChart from '@/components/admin/charts/RevenueBreakdownChart';
import UserManagement from '@/components/admin/UserManagement';
import ActiveTables from '@/components/admin/ActiveTables';
import MessagesBroadcast from '@/components/admin/MessagesBroadcast';
import EmergencyControls from '@/components/admin/EmergencyControls';

// Data for filterable stat cards
const revenueData = {
    today: { value: '$8,947', trend: '+8% vs yesterday' },
    week: { value: '$34,112', trend: '+15% vs last week' },
    month: { value: '$118,305', trend: '+12% vs last month' },
    all: { value: '$358,200', trend: 'Total revenue' },
};

const depositsData = {
    today: { value: '$2,180', trend: '+15% vs yesterday' },
    week: { value: '$21,380', trend: '+9% vs last week' },
    month: { value: '$89,420', trend: '+12% vs last month' },
    all: { value: '$445,280', trend: 'Total deposits' },
};

const withdrawalsData = {
    today: { value: '$1,640', trend: '+8% vs yesterday' },
    week: { value: '$15,640', trend: '+5% vs last week' },
    month: { value: '$67,890', trend: '+7% vs last month' },
    all: { value: '$334,120', trend: 'Total withdrawals' },
};

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Emergency Controls — Invariant Display + Kill Switch */}
            <EmergencyControls />

            {/* Stats Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard
                    title="Active Users"
                    value="247"
                    trend="+12% today"
                    trendColor="green"
                    icon={faUsers}
                    iconColor="text-accent-green"
                />
                <FilterableStatCard
                    title="Revenue"
                    icon={faDollarSign}
                    iconColor="text-accent-yellow"
                    trendColor="yellow"
                    data={revenueData}
                />
                <StatCard
                    title="Open Tables"
                    value="18"
                    trend="6 full"
                    trendColor="default"
                    icon={faTable}
                    iconColor="text-accent-blue"
                />
                <StatCard
                    title="Tournaments"
                    value="5"
                    trend="3 running"
                    trendColor="default"
                    icon={faTrophy}
                    iconColor="text-accent-yellow"
                />
                <FilterableStatCard
                    title="Deposits"
                    icon={faArrowDown}
                    iconColor="text-accent-green"
                    trendColor="green"
                    data={depositsData}
                />
                <FilterableStatCard
                    title="Withdrawals"
                    icon={faArrowUp}
                    iconColor="text-danger-red"
                    trendColor="red"
                    data={withdrawalsData}
                />
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlayerActivityChart />
                <RevenueBreakdownChart />
            </section>

            {/* Quick Actions - 3 Column Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <UserManagement />
                <ActiveTables />
                <MessagesBroadcast />
            </section>
        </div>
    );
}
