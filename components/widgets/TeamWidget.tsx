
import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import Tooltip from '../Tooltip';
import { PeopleManagementIcon } from '../icons/PeopleManagementIcon';

interface TeamWidgetProps {
    projectData: ProjectData;
}

const TeamWidget: React.FC<TeamWidgetProps> = ({ projectData }) => {
    const { people, meetings, tasks } = projectData;

    const teamWithStatus = useMemo(() => {
        const now = new Date();
        
        return people.map(person => {
            // Check if in meeting
            const currentMeeting = meetings.find(m => {
                const mDate = new Date(m.date);
                const [startH, startM] = m.startTime.split(':').map(Number);
                const [endH, endM] = m.endTime.split(':').map(Number);
                
                const start = new Date(mDate); start.setHours(startH, startM, 0);
                const end = new Date(mDate); end.setHours(endH, endM, 0);
                
                return m.attendees.includes(person.id) && now >= start && now <= end;
            });

            if (currentMeeting) {
                return { ...person, status: 'meeting', statusText: `In meeting: ${currentMeeting.title}` };
            }

            // Check if busy (more than 2 tasks due today)
            const tasksDueToday = tasks.filter(t => 
                t.assignedTo.includes(person.id) && 
                new Date(t.endDate).toDateString() === now.toDateString() &&
                t.completion < 100
            ).length;

            if (tasksDueToday > 2) {
                return { ...person, status: 'busy', statusText: 'Busy with deadlines' };
            }

            return { ...person, status: 'available', statusText: 'Available' };
        });
    }, [people, meetings, tasks]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'meeting': return 'bg-red-500';
            case 'busy': return 'bg-orange-500';
            default: return 'bg-green-500';
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2 flex items-center gap-2">
                <PeopleManagementIcon className="w-5 h-5 text-gray-400" />
                Team
            </h2>
            <div className="flex-grow flex items-center justify-center">
                <div className="flex flex-wrap items-center justify-center gap-6">
                    {teamWithStatus.map(person => (
                        <Tooltip text={`${person.name} - ${person.statusText}`} key={person.id}>
                            <div className="relative group cursor-pointer">
                                <img 
                                    src={person.avatarUrl} 
                                    alt={person.name} 
                                    className="w-14 h-14 rounded-full shadow-md border-2 border-white dark:border-gray-700 transition-transform group-hover:scale-110" 
                                />
                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(person.status)}`} />
                            </div>
                        </Tooltip>
                    ))}
                     {people.length === 0 && <p className="text-gray-400 text-sm">No team members.</p>}
                </div>
            </div>
        </div>
    );
};

export default TeamWidget;
