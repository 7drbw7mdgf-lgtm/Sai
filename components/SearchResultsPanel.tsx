import React, { useState, useEffect, useMemo } from 'react';
import { SearchResult, Person, ProjectData } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { TasksIcon } from './icons/TasksIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import MarkdownRenderer from './MarkdownRenderer';
import Tooltip from './Tooltip';

interface SearchResultsPanelProps {
  results: SearchResult[];
  onSelect: (item: SearchResult) => void;
  projectData: ProjectData;
  isLoading?: boolean;
}

const ActivityChart: React.FC<{ person: Person, projectData: ProjectData }> = ({ person, projectData }) => {
    const activityData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const tasksOnDay = projectData.tasks.filter(t =>
                t.assignedTo.includes(person.id) &&
                date >= new Date(new Date(t.startDate).setHours(0,0,0,0)) &&
                date <= new Date(new Date(t.endDate).setHours(23,59,59,999))
            ).length;
            
            const meetingsOnDay = projectData.meetings.filter(m =>
                m.attendees.includes(person.id) &&
                new Date(m.date).toDateString() === date.toDateString()
            ).length;
            
            data.push({
                label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
                tasks: tasksOnDay,
                meetings: meetingsOnDay,
            });
        }
        return data;
    }, [person, projectData]);

    const maxValue = useMemo(() => Math.max(1, ...activityData.map(d => Math.max(d.tasks, d.meetings))), [activityData]);

    return (
        <div className="w-full h-40 mt-4">
            <svg width="100%" height="100%" viewBox="0 0 300 160">
                {/* Y-axis labels and grid lines */}
                {[0, 0.5, 1].map(tick => (
                    <g key={tick}>
                        <text x="0" y={135 - tick * 120 + 4} fontSize="10" fill="currentColor" className="text-gray-400">{Math.round(maxValue * tick)}</text>
                        <line x1="20" y1={135 - tick * 120} x2="300" y2={135 - tick * 120} stroke="currentColor" strokeWidth="0.5" className="text-gray-200 dark:text-gray-700" />
                    </g>
                ))}

                {/* Bars */}
                {activityData.map((day, index) => {
                    const x = 25 + index * 40;
                    const taskHeight = (day.tasks / maxValue) * 120;
                    const meetingHeight = (day.meetings / maxValue) * 120;
                    return (
                        <g key={index}>
                            <Tooltip text={`${day.tasks} tasks`}>
                                <rect x={x} y={135 - taskHeight} width="12" height={taskHeight} fill="currentColor" className="text-blue-400 dark:text-blue-500" rx="2" />
                            </Tooltip>
                             <Tooltip text={`${day.meetings} meetings`}>
                                <rect x={x + 14} y={135 - meetingHeight} width="12" height={meetingHeight} fill="currentColor" className="text-indigo-400 dark:text-indigo-500" rx="2" />
                            </Tooltip>
                            <text x={x + 13} y="150" textAnchor="middle" fontSize="10" fill="currentColor" className="text-gray-500">{day.label}</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};


const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({ results, onSelect, projectData, isLoading }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (results[selectedIndex]) {
                    onSelect(results[selectedIndex]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [results, selectedIndex, onSelect]);


    const getIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'task': return <TasksIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            case 'meeting': return <CalendarDaysIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            case 'person': return <UserCircleIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            case 'experiment': return <BeakerIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            case 'note': return <DocumentTextIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
            default: return null;
        }
    };
    
    const getName = (item: SearchResult) => {
        if (item.type === 'meeting' || item.type === 'note') {
            return item.data.title;
        }
        return item.data.name;
    }

    const renderPreview = (item: SearchResult) => {
        switch (item.type) {
            case 'task':
                const assignedPeople = projectData.people.filter(p => item.data.assignedTo.includes(p.id));
                return (
                    <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.data.name}</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due: {item.data.endDate.toLocaleDateString()}</div>
                        <div className="mt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${item.data.completion}%`, backgroundColor: item.data.color }}></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{item.data.completion}%</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center -space-x-2">
                            {assignedPeople.map(p => <Tooltip key={p.id} text={p.name}><img src={p.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" /></Tooltip>)}
                        </div>
                    </div>
                );
            case 'note':
                return (
                    <div className="p-6 h-full flex flex-col">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.data.title}</h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Updated: {item.data.updatedAt.toLocaleDateString()}</div>
                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 overflow-y-auto max-h-64 flex-grow">
                            <MarkdownRenderer content={item.data.content.substring(0, 400) + (item.data.content.length > 400 ? '...' : '')} notes={projectData.notes} tasks={projectData.tasks} onNoteLinkClick={() => {}} onTaskLinkClick={() => {}} people={projectData.people} />
                        </div>
                    </div>
                )
            case 'meeting':
                 const attendees = projectData.people.filter(p => item.data.attendees.includes(p.id));
                return (
                     <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{item.data.title}</h3>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">{new Date(item.data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.data.startTime} - {item.data.endTime}</div>
                        <div className="mt-4 flex items-center -space-x-2">
                            {attendees.map(p => <Tooltip key={p.id} text={p.name}><img src={p.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" /></Tooltip>)}
                        </div>
                    </div>
                )
            case 'person':
                const person = item.data;
                 return (
                     <div className="p-6 flex flex-col justify-between h-full">
                         <div className="text-center">
                            <img src={person.avatarUrl.replace('/40/40', '/80/80')} className="w-20 h-20 rounded-full shadow-lg mx-auto"/>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mt-4">{person.name}</h3>
                         </div>
                         <div>
                            <h4 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider text-center">Last 7 Days Activity</h4>
                            <ActivityChart person={person} projectData={projectData} />
                         </div>
                    </div>
                )
            default: return <div className="p-6 text-gray-500">Preview not available.</div>
        }
    }

    const selectedItem = results[selectedIndex];

    return (
        <div className="absolute top-full mt-2 w-[700px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 z-50 animate-fade-in overflow-hidden">
            {isLoading && <div className="p-4 text-center text-gray-500 dark:text-gray-400">Searching...</div>}
            {!isLoading && results.length === 0 && (
                <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                    <SearchIcon className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold text-lg">No results found</p>
                    <p className="text-sm">Try a different search term.</p>
                </div>
            )}
            {!isLoading && results.length > 0 && (
                <div className="flex h-[400px]">
                    <div className="w-2/5 border-r border-gray-200 dark:border-gray-700/60 overflow-y-auto">
                        <ul className="p-2">
                            {results.map((item, index) => (
                                <li key={`${item.type}-${item.data.id}-${index}`}>
                                    <button
                                        onClick={() => onSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-3 text-left p-2.5 rounded-lg transition-colors ${selectedIndex === index ? 'bg-blue-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                    >
                                        <div className="flex-shrink-0">{getIcon(item.type)}</div>
                                        <div className="flex-1 truncate">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{getName(item)}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{item.type}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-3/5 bg-white/50 dark:bg-gray-800/50">
                        {selectedItem && renderPreview(selectedItem)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResultsPanel;