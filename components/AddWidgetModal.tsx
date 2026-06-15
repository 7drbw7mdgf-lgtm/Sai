import React from 'react';
import Modal from './Modal';
import { WidgetType } from '../types';
import { TasksIcon } from './icons/TasksIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { HomeIcon } from './icons/HomeIcon';
import { TimelineIcon } from './icons/TimelineIcon';
import { PeopleManagementIcon } from './icons/PeopleManagementIcon';
import { LinkIcon } from './icons/LinkIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface AddWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddWidget: (type: WidgetType) => void;
    existingWidgets: WidgetType[];
}

const ALL_WIDGETS = [
    { type: WidgetType.MyTasks, name: 'My Tasks', description: "A list of tasks assigned to you.", icon: <TasksIcon className="w-6 h-6"/> },
    { type: WidgetType.UpcomingMeetings, name: 'Upcoming Meetings', description: "Your next scheduled meetings.", icon: <CalendarDaysIcon className="w-6 h-6"/> },
    { type: WidgetType.ClockWeather, name: 'Clock & Weather', description: "An analog clock and weather.", icon: <ClockIcon className="w-6 h-6"/> },
    { type: WidgetType.ProjectHealth, name: 'Project Health', description: "Overall project statistics.", icon: <ChartPieIcon className="w-6 h-6"/> },
    { type: WidgetType.Welcome, name: 'Welcome Banner', description: "A simple welcome message.", icon: <HomeIcon className="w-6 h-6"/> },
    { type: WidgetType.ProjectTimeline, name: 'Project Timeline', description: "High-level project progress.", icon: <TimelineIcon className="w-6 h-6"/> },
    { type: WidgetType.Team, name: 'Team Members', description: "See all project members.", icon: <PeopleManagementIcon className="w-6 h-6"/> },
    { type: WidgetType.PeopleHub, name: 'Team Hub', description: "An overview of your team members.", icon: <PeopleManagementIcon className="w-6 h-6"/> },
    { type: WidgetType.NotesOverview, name: 'Recent Notes', description: "A list of recently updated notes.", icon: <DocumentTextIcon className="w-6 h-6"/> },
    { type: WidgetType.QuickLinks, name: 'Quick Links', description: "A list of important links.", icon: <LinkIcon className="w-6 h-6"/> },
];

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onAddWidget, existingWidgets }) => {
    const availableWidgets = ALL_WIDGETS.filter(w => !existingWidgets.includes(w.type));
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add a Widget" maxWidth="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableWidgets.length > 0 ? availableWidgets.map(widget => (
                    <button
                        key={widget.type}
                        onClick={() => onAddWidget(widget.type)}
                        className="flex flex-col items-start text-left p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all"
                    >
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                           {widget.icon}
                           <h3 className="font-bold text-gray-800 dark:text-gray-100">{widget.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{widget.description}</p>
                    </button>
                )) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 col-span-2 py-8">All available widgets are already on your dashboard!</p>
                )}
            </div>
        </Modal>
    );
};

export default AddWidgetModal;