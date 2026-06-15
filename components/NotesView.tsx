import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, Note, NotesSettings, Task } from '../types';
import NotesSidebar from './NotesSidebar';
import NoteEditor from './NoteEditor';
import { PlusIcon } from './icons/PlusIcon';

interface NotesViewProps {
    projectData: ProjectData;
    // FIX: Correctly type `onSetData` to handle nullable project data state.
    onSetData: (data: (prev: ProjectData | null) => ProjectData | null) => void;
    notesSettings: NotesSettings;
    onRequestEditTask: (taskName: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ projectData, onSetData, notesSettings, onRequestEditTask }) => {
    const { notes, people, tasks } = projectData;
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Select the first note by default or if the selected one is deleted
    useEffect(() => {
        if (!selectedId && notes.length > 0) {
            setSelectedId(notes[0].id);
        } else if (selectedId && selectedId.startsWith('note-') && !notes.find(n => n.id === selectedId)) {
            setSelectedId(notes.length > 0 ? notes[0].id : null);
        } else if (selectedId && selectedId.startsWith('task-note-') && !tasks.find(t => `task-note-${t.id}` === selectedId)) {
             setSelectedId(notes.length > 0 ? notes[0].id : null);
        }
    }, [notes, tasks, selectedId]);
    
    const { displayNote, isReadOnly, sourceTask } = useMemo(() => {
        if (!selectedId) return { displayNote: null, isReadOnly: false, sourceTask: undefined };

        if (selectedId.startsWith('task-note-')) {
            const taskId = selectedId.replace('task-note-', '');
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                const virtualNote: Note = {
                    id: `task-note-${task.id}`,
                    title: task.name,
                    content: task.notes || '',
                    tags: task.tags || [],
                    parentId: null,
                    createdAt: task.startDate,
                    updatedAt: task.endDate,
                };
                return { displayNote: virtualNote, isReadOnly: true, sourceTask: task };
            }
        }
        
        const note = notes.find(n => n.id === selectedId);
        return { displayNote: note || null, isReadOnly: false, sourceTask: undefined };
    }, [selectedId, notes, tasks]);

    const handleUpdateNote = (updatedNote: Note) => {
        onSetData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                notes: prev.notes.map(n => n.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date() } : n),
            };
        });
    };

    const handleAddNote = (parentId: string | null) => {
        const newNote: Note = {
            id: `note-${Date.now()}`,
            title: 'Untitled',
            content: '',
            tags: [],
            parentId: parentId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        onSetData(prev => prev ? ({ ...prev, notes: [...prev.notes, newNote] }) : null);
        setSelectedId(newNote.id);
    };

    const handleDeleteNote = (noteId: string) => {
        onSetData(prev => {
            if (!prev) return null;
            // Also delete children notes recursively
            const notesToDelete = new Set<string>([noteId]);
            let changed = true;
            while(changed) {
                changed = false;
                prev.notes.forEach(note => {
                    if (note.parentId && notesToDelete.has(note.parentId) && !notesToDelete.has(note.id)) {
                        notesToDelete.add(note.id);
                        changed = true;
                    }
                })
            }
            return {
                ...prev,
                notes: prev.notes.filter(n => !notesToDelete.has(n.id)),
            };
        });
    };
    
    const handleNoteLinkClick = (noteTitle: string) => {
        const targetNote = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
        if (targetNote) {
            setSelectedId(targetNote.id);
        }
    };

    return (
        <div className="flex h-full bg-white dark:bg-gray-800">
            <NotesSidebar
                notes={notes}
                tasksWithNotes={tasks.filter(t => t.notes)}
                selectedId={selectedId}
                onSelectNote={setSelectedId}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
            />
            <main className="flex-1 flex flex-col">
                {displayNote ? (
                    <NoteEditor
                        key={displayNote.id}
                        note={displayNote}
                        allNotes={notes}
                        allTasks={tasks}
                        people={people}
                        onUpdate={handleUpdateNote}
                        onNoteLinkClick={handleNoteLinkClick}
                        onTaskLinkClick={onRequestEditTask}
                        settings={notesSettings}
                        readOnly={isReadOnly}
                        sourceTask={sourceTask}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center text-gray-400 dark:text-gray-500">
                        <div>
                            <PlusIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                            <h2 className="mt-2 text-lg font-medium">No note selected</h2>
                            <p className="text-sm">Create a new note or select one from the sidebar.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotesView;