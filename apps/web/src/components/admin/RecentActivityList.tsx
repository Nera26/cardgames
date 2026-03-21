import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';



import { RECENT_ACTIVITIES } from '@/data/mocks/adminDashboard';
import { formatTimeAgo } from '@/lib/dateUtils';

const statusColors: Record<string, string> = {
    online: 'text-accent-green',
    pending: 'text-accent-yellow',
    completed: 'text-accent-blue',
};

export default function RecentActivityList() {
    return (
        <div className="bg-card-bg p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
            <div className="space-y-3">
                {RECENT_ACTIVITIES.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-primary-bg rounded-xl hover:bg-hover-bg transition-colors"
                    >
                        <FontAwesomeIcon
                            icon={faCircle}
                            className={`w-2 h-2 mt-2 ${statusColors[activity.status]}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold truncate">{activity.title}</p>
                                <span className="text-xs text-text-secondary whitespace-nowrap">
                                    {formatTimeAgo(activity.time)}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary truncate">{activity.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
