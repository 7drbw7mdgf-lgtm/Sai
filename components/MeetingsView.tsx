
import React, { useState, useMemo } from 'react';
import { Meeting, Person, ProjectData } from '../types';
import Tooltip from './Tooltip';

interface MeetingsViewProps {
    meetings: Meeting[];
    people: Person[];
    onSetData: (data: (prevData: ProjectData | null) => ProjectData | null) => void;
    onScheduleMeeting: () => void;
}

const MeetingsView: React.FC<MeetingsViewProps> = ({ meetings, people, onSetData, onScheduleMeeting }) => {
    
    const meetingsByDate = useMemo((): Record<string, Meeting[]> => {
        // FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference.
        return meetings.reduce((acc: Record<string, Meeting[]>, meeting) => {
            const dateStr = new Date(meeting.date).toDateString();
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(meeting);
            return acc;
        }, {} as Record<string, Meeting[]>);
    }, [meetings]);

    return (
        <div className="h-full bg-white text-gray-800 p-6 flex flex-col">
            <header className="flex items-center justify-between mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold">Meetings</h1>
            </header>

            <div className="flex-grow overflow-y-auto pr-2">
                {Object.keys(meetingsByDate).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-lg font-medium">No meetings scheduled.</p>
                        <button
                            onClick={onScheduleMeeting}
                            className="mt-2 text-sm text-blue-600 font-semibold hover:underline"
                        >
                            Schedule one to get started.
                        </button>
                    </div>
                ) : (
                    // FIX: Refactored from Object.entries to Object.keys to fix a TypeScript inference issue where the value in [key, value] was 'unknown'.
                    Object.keys(meetingsByDate).map(dateStr => {
                        const meetingsOnDate = meetingsByDate[dateStr];
                        return (
                            <div key={dateStr} className="mb-6">
                                <h2 className="font-semibold text-gray-500 mb-3 text-sm">
                                    {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h2>
                                <div className="space-y-3">
                                    {meetingsOnDate.map(meeting => (
                                        <div key={meeting.id} className="bg-gray-50/80 rounded-lg p-4 flex items-center justify-between border border-gray-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-12 rounded-full" style={{backgroundColor: meeting.color}}></div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{meeting.title}</p>
                                                    <p className="text-sm text-gray-500">{meeting.startTime} - {meeting.endTime}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex items-center -space-x-3">
                                                    {people.filter(p => meeting.attendees.includes(p.id)).map(p => (
                                                        <Tooltip key={p.id} text={p.name}>
                                                           <img src={p.avatarUrl} alt={p.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm"/>
                                                        </Tooltip>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default MeetingsView;