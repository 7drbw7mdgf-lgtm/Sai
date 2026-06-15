import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import Tooltip from '../Tooltip';

interface UpcomingMeetingsWidgetProps {
    projectData: ProjectData;
    onRequestEditMeeting: (meetingId: string) => void;
}

const UpcomingMeetingsWidget: React.FC<UpcomingMeetingsWidgetProps> = ({ projectData, onRequestEditMeeting }) => {
    const { meetings, people } = projectData;

    const upcomingMeetings = useMemo(() => {
        const now = new Date();
        return meetings
            .filter(m => new Date(m.date) >= now)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [meetings]);

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2">Upcoming Meetings</h2>
            <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {upcomingMeetings.length > 0 ? upcomingMeetings.map(meeting => {
                     const attendees = people.filter(p => meeting.attendees.includes(p.id));
                     return (
                        <div key={meeting.id} onClick={() => onRequestEditMeeting(meeting.id)} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                            <div className="w-1 h-full self-stretch rounded-full mt-1" style={{backgroundColor: meeting.color}}></div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{meeting.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(meeting.date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}, {meeting.startTime}</p>
                                <div className="flex items-center -space-x-1 mt-1">
                                    {attendees.slice(0,5).map(p => <Tooltip text={p.name} key={p.id}><img src={p.avatarUrl} className="w-4 h-4 rounded-full border border-white dark:border-gray-800"/></Tooltip>)}
                                    {attendees.length > 5 && <div className="w-4 h-4 text-xs rounded-full bg-gray-200 flex items-center justify-center border border-white dark:border-gray-800 text-[10px]">+{attendees.length - 5}</div>}
                                </div>
                            </div>
                        </div>
                    )
                }) : (
                     <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-center text-sm">No upcoming meetings.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingMeetingsWidget;