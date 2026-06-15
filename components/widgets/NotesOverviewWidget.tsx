import React, { useMemo } from 'react';
import { ProjectData } from '../../types';
import { DocumentTextIcon } from '../icons/DocumentTextIcon';

interface NotesOverviewWidgetProps {
    projectData: ProjectData;
    // onRequestEditNote might be a good prop to add later
}

const NotesOverviewWidget: React.FC<NotesOverviewWidgetProps> = ({ projectData }) => {
    const recentNotes = useMemo(() => {
        return [...projectData.notes]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 4);
    }, [projectData.notes]);

    return (
        <div className="h-full flex flex-col p-4">
            <h2 className="text-lg font-semibold mb-3 flex-shrink-0 px-2 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                Recent Notes
            </h2>
            <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {recentNotes.length > 0 ? recentNotes.map(note => (
                    <div key={note.id} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                        <p className="font-semibold text-sm truncate">{note.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Updated: {new Date(note.updatedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</p>
                    </div>
                )) : (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400 text-center text-sm">No notes yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesOverviewWidget;