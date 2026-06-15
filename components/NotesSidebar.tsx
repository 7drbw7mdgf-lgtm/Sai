
import React, { useState, useMemo } from 'react';
import { Note, Task } from '../types';
import { ChevronRightIcon } from './icons/ChevronIcons';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TasksIcon } from './icons/TasksIcon';

interface NotesSidebarProps {
    notes: Note[];
    tasksWithNotes: Task[];
    selectedId: string | null;
    onSelectNote: (id: string) => void;
    onAddNote: (parentId: string | null) => void;
    onDeleteNote: (id: string) => void;
}

interface NoteTreeItem extends Note {
    children: NoteTreeItem[];
}

const NoteItem: React.FC<{
    item: NoteTreeItem;
    level: number;
    selectedId: string | null;
    onSelectNote: (id: string) => void;
    onDeleteNote: (id: string) => void;
    draggedNoteId: string | null;
    dropIndicator: { targetId: string; position: 'top' | 'bottom' | 'middle' } | null;
    onDragStart: (noteId: string) => void;
    onDragOver: (e: React.DragEvent, noteId: string) => void;
    onDragLeave: () => void;
    onDrop: () => void;
}> = ({ item, level, selectedId, onSelectNote, onDeleteNote, draggedNoteId, dropIndicator, onDragStart, onDragOver, onDragLeave, onDrop }) => {
    const isFolder = item.children.length > 0;
    const [isExpanded, setIsExpanded] = useState(true);

    const isBeingDragged = draggedNoteId === item.id;
    const isDropTarget = dropIndicator?.targetId === item.id;

    return (
        <div className={`relative ${isBeingDragged ? 'opacity-40' : ''}`}
            onDragOver={(e) => onDragOver(e, item.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.stopPropagation(); onDrop(); }}
        >
            {isDropTarget && dropIndicator.position === 'top' && <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500 z-10 mx-2" />}
            <div
                draggable
                onDragStart={(e) => { e.stopPropagation(); onDragStart(item.id); }}
                onClick={() => onSelectNote(item.id)}
                className={`note-item-container flex items-center justify-between group pr-2 py-1 mx-2 rounded-md cursor-pointer transition-all duration-200
                    ${selectedId === item.id ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}
                    ${isDropTarget && dropIndicator.position === 'middle' ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                <div className="flex items-center gap-2 flex-1 truncate">
                    {isFolder ? (
                         <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500">
                            <ChevronRightIcon className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    ) : (
                        <DocumentTextIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-80" />
                    )}
                    <span className={`text-sm truncate ${selectedId === item.id ? 'font-semibold' : 'font-medium'}`}>{item.title}</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(item.id); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <TrashIcon className="w-3.5 h-3.5"/>
                </button>
            </div>
            {isDropTarget && dropIndicator.position === 'bottom' && <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 z-10 mx-2" />}
            {isFolder && isExpanded && (
                <div>
                    {item.children.map(child => (
                        <NoteItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            selectedId={selectedId}
                            onSelectNote={onSelectNote}
                            onDeleteNote={onDeleteNote}
                            draggedNoteId={draggedNoteId}
                            dropIndicator={dropIndicator}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const NotesSidebar: React.FC<NotesSidebarProps> = ({ notes, tasksWithNotes, selectedId, onSelectNote, onAddNote, onDeleteNote }) => {
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] = useState<{ targetId: string; position: 'top' | 'bottom' | 'middle' } | null>(null);

    const handleDrop = (onSetDataCallback: any) => {
        if (!draggedNoteId || !dropIndicator) return;

        onSetDataCallback((prev: any) => {
            if (!prev) return null;
            const notesCopy = [...prev.notes];

            const draggedNote = notesCopy.find(n => n.id === draggedNoteId);
            if (!draggedNote) return prev;

            const targetNote = notesCopy.find(n => n.id === dropIndicator.targetId);
            if (!targetNote) return prev;
            
            let currentParentId = targetNote.id;
            while(currentParentId) {
                if (currentParentId === draggedNote.id) return prev;
                const parentNote = notesCopy.find(n => n.id === currentParentId);
                currentParentId = parentNote?.parentId || '';
            }
            
            const filteredNotes = notesCopy.filter(n => n.id !== draggedNoteId);
            const targetIndex = filteredNotes.findIndex(n => n.id === dropIndicator.targetId);

            if (dropIndicator.position === 'middle') {
                draggedNote.parentId = dropIndicator.targetId;
                filteredNotes.splice(targetIndex + 1, 0, draggedNote);
            } else {
                draggedNote.parentId = targetNote.parentId;
                const insertIndex = dropIndicator.position === 'top' ? targetIndex : targetIndex + 1;
                filteredNotes.splice(insertIndex, 0, draggedNote);
            }
            return {...prev, notes: filteredNotes};
        });
    };

    const handleDragStart = (noteId: string) => setDraggedNoteId(noteId);

    const handleDragEnd = (onSetDataCallback: any) => {
        if (draggedNoteId && dropIndicator) {
             handleDrop(onSetDataCallback);
        }
        setDraggedNoteId(null);
        setDropIndicator(null);
    };

    const handleDragOver = (e: React.DragEvent, noteId: string) => {
        e.preventDefault();
        if (!draggedNoteId || draggedNoteId === noteId) return;

        const targetElement = (e.target as HTMLElement).closest('.note-item-container');
        if (!targetElement) return;

        const rect = targetElement.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        let position: 'top' | 'bottom' | 'middle';
        if (y < height * 0.25) {
            position = 'top';
        } else if (y > height * 0.75) {
            position = 'bottom';
        } else {
            position = 'middle';
        }
        setDropIndicator({ targetId: noteId, position });
    };
    
    const handleRootDrop = (onSetDataCallback: any) => {
        if (!draggedNoteId) return;
        
        onSetDataCallback((prev: any) => {
            if (!prev) return null;
            const notesCopy = [...prev.notes];
            const draggedNote = notesCopy.find(n => n.id === draggedNoteId);
            if (!draggedNote || draggedNote.parentId === null) return prev; 

            draggedNote.parentId = null;
            return {...prev, notes: notesCopy };
        });
        setDraggedNoteId(null);
        setDropIndicator(null);
    }
    
    const noteTree = useMemo(() => {
        const tree: NoteTreeItem[] = [];
        const map: { [key: string]: NoteTreeItem } = {};

        notes.forEach(note => {
            map[note.id] = { ...note, children: [] };
        });

        notes.forEach(note => {
            if (note.parentId && map[note.parentId]) {
                map[note.parentId].children.push(map[note.id]);
            } else {
                tree.push(map[note.id]);
            }
        });

        return tree;
    }, [notes]);

    return (
        <aside 
            className="w-64 h-full flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900/50"
            onDragEnd={() => handleDragEnd((window as any)._onSetData)} 
        >
            <header className="flex-shrink-0 h-12 px-4 flex justify-between items-center">
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notes</h2>
                <button onClick={() => onAddNote(null)} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                    <DocumentPlusIcon className="w-4 h-4"/>
                </button>
            </header>
            
            <div className="flex-grow overflow-y-auto py-2">
                <div className="space-y-0.5">
                    {noteTree.map(item => (
                        <NoteItem 
                            key={item.id}
                            item={item}
                            level={0}
                            selectedId={selectedId}
                            onSelectNote={onSelectNote}
                            onDeleteNote={onDeleteNote}
                            draggedNoteId={draggedNoteId}
                            dropIndicator={dropIndicator}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragLeave={() => setDropIndicator(null)}
                            onDrop={() => {}}
                        />
                    ))}
                </div>
                
                {tasksWithNotes.length > 0 && (
                    <div className="mt-6">
                        <h3 className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Task Notes</h3>
                        <div className="space-y-0.5">
                            {tasksWithNotes.map(task => (
                                <div
                                    key={`task-note-${task.id}`}
                                    onClick={() => onSelectNote(`task-note-${task.id}`)}
                                    className={`flex items-center gap-2 py-1 px-2 mx-2 rounded-md cursor-pointer transition-colors ${selectedId === `task-note-${task.id}` ? 'bg-gray-200 dark:bg-gray-700 text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                                >
                                    <TasksIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-sm font-medium truncate">{task.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleRootDrop((window as any)._onSetData)}
                className="m-3 p-3 text-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700 transition-colors hover:border-blue-300 dark:hover:border-blue-700"
            >
                <span className="text-xs font-medium text-gray-400 pointer-events-none">Drop here to un-nest</span>
            </div>
        </aside>
    );
};

export default NotesSidebar;
