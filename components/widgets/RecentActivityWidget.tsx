import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { LightningIcon } from '../icons/LightningIcon';

interface RecentActivityWidgetProps {
    projectData: ProjectData;
    onRequestEditTask: (taskId: string) => void;
    onRequestEditMeeting: (meetingId: string) => void;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ projectData, onRequestEditTask, onRequestEditMeeting }) => {
    const activity = useMemo(() => {
        const taskItems = projectData.tasks.map(task => ({
            id: task.id,
            type: 'task' as const,
            title: task.name,
            meta: `${task.completion}% complete`,
            date: new Date(task.endDate),
            color: task.color,
        }));
        const meetingItems = projectData.meetings.map(meeting => ({
            id: meeting.id,
            type: 'meeting' as const,
            title: meeting.title,
            meta: `${meeting.startTime} - ${meeting.endTime}`,
            date: new Date(meeting.date),
            color: meeting.color,
        }));

        return [...taskItems, ...meetingItems]
            .sort((a, b) => Math.abs(new Date().getTime() - a.date.getTime()) - Math.abs(new Date().getTime() - b.date.getTime()))
            .slice(0, 7);
    }, [projectData.tasks, projectData.meetings]);

    return (
        <div className="flex h-full flex-col p-4">
            <h2 className="mb-3 flex flex-shrink-0 items-center gap-2 px-2 text-lg font-semibold">
                <LightningIcon className="h-5 w-5 text-gray-400" />
                Recent Activity
            </h2>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                {activity.length > 0 ? activity.map(item => (
                    <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => item.type === 'task' ? onRequestEditTask(item.id) : onRequestEditMeeting(item.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                        <span className="h-9 w-1 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-gray-800 dark:text-gray-100">{item.title}</span>
                            <span className="block text-xs text-gray-500">{item.meta}</span>
                        </span>
                    </button>
                )) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">No activity yet.</div>
                )}
            </div>
        </div>
    );
};

export default RecentActivityWidget;
