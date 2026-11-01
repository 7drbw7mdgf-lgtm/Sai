import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { CalendarDaysIcon } from '../icons/CalendarDaysIcon';

interface TodayScheduleWidgetProps {
    projectData: ProjectData;
    onRequestEditMeeting: (meetingId: string) => void;
    onRequestEditTask: (taskId: string) => void;
}

const TodayScheduleWidget: React.FC<TodayScheduleWidgetProps> = ({ projectData, onRequestEditMeeting, onRequestEditTask }) => {
    const schedule = useMemo(() => {
        const today = new Date().toDateString();
        const meetings = projectData.meetings
            .filter(meeting => new Date(meeting.date).toDateString() === today)
            .map(meeting => ({
                id: meeting.id,
                type: 'meeting' as const,
                title: meeting.title,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                color: meeting.color,
            }));

        const assignments = (projectData.assignments || [])
            .filter(assignment => new Date(assignment.startDate).toDateString() === today)
            .map(assignment => {
                const task = projectData.tasks.find(item => item.id === assignment.taskId);
                return {
                    id: assignment.id,
                    taskId: assignment.taskId,
                    type: 'assignment' as const,
                    title: assignment.name,
                    startTime: assignment.startTime,
                    endTime: assignment.endTime,
                    color: task?.color || '#3b82f6',
                };
            });

        return [...meetings, ...assignments].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [projectData.assignments, projectData.meetings, projectData.tasks]);

    return (
        <div className="flex h-full flex-col p-4">
            <h2 className="mb-3 flex flex-shrink-0 items-center gap-2 px-2 text-lg font-semibold">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                Today Schedule
            </h2>
            <div className="flex-grow space-y-2 overflow-y-auto pr-2">
                {schedule.length > 0 ? schedule.map(item => (
                    <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => item.type === 'meeting' ? onRequestEditMeeting(item.id) : onRequestEditTask(item.taskId)}
                        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                        <span className="flex w-16 flex-shrink-0 flex-col items-center rounded-xl bg-gray-50 py-2 text-xs font-bold text-gray-500 dark:bg-gray-700/60">
                            <span>{item.startTime}</span>
                            <span className="font-medium opacity-60">{item.endTime}</span>
                        </span>
                        <span className="h-10 w-1 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-gray-800 dark:text-gray-100">{item.title}</span>
                            <span className="block text-xs capitalize text-gray-500">{item.type === 'assignment' ? 'task block' : 'meeting'}</span>
                        </span>
                    </button>
                )) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-gray-400">Nothing scheduled today.</div>
                )}
            </div>
        </div>
    );
};

export default TodayScheduleWidget;
