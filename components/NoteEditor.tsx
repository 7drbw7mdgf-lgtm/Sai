import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Note, Person, Task, NotesSettings } from '../types';
import TagInput from './TagInput';
import AutofillPopup from './AutofillPopup';
import EditableLine from './EditableLine';
import MarkdownRenderer from './MarkdownRenderer';
import { PencilIcon } from './icons/PencilIcon';

interface NoteEditorProps {
    note: Note;
    allNotes: Note[];
    allTasks: Task[];
    people: Person[];
    onUpdate: (note: Note) => void;
    onNoteLinkClick: (noteTitle: string) => void;
    onTaskLinkClick: (taskName: string) => void;
    settings: NotesSettings;
    readOnly?: boolean;
    sourceTask?: Task;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, allNotes, allTasks, people, onUpdate, onNoteLinkClick, onTaskLinkClick, settings, readOnly = false, sourceTask }) => {
    const [title, setTitle] = useState(note.title);
    const [tags, setTags] = useState(note.tags);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    // Ensure state is updated if the underlying note prop changes
    useEffect(() => {
        setTitle(note.title);
        setTags(note.tags);
    }, [note]);

    const handleTitleBlur = () => {
        onUpdate({ ...note, title });
    };

    const handleTagsChange = (newTags: string[]) => {
        setTags(newTags);
        onUpdate({ ...note, tags: newTags });
    }

    const lines = useMemo(() => note.content.split('\n'), [note.content]);

    const updateContent = (newLines: string[]) => {
        const newContent = newLines.join('\n');
        if (newContent !== note.content) {
            onUpdate({ ...note, content: newContent });
        }
    };

    const handleLineUpdate = (index: number, newText: string) => {
        const newLines = [...lines];
        newLines[index] = newText;
        updateContent(newLines);
    };

    const handleEnter = (index: number, contentBeforeCursor: string, contentAfterCursor: string) => {
        const newLines = [...lines];
        newLines[index] = contentBeforeCursor;
        newLines.splice(index + 1, 0, contentAfterCursor);
        updateContent(newLines);

        // Schedule focus for the next render cycle
        setTimeout(() => setActiveLineIndex(index + 1), 0);
    };

    const handleBackspace = (index: number, lineContent: string) => {
        if (index === 0) return;
        
        const newLines = [...lines];
        const prevLine = newLines[index - 1];
        const cursorPosition = prevLine.length;

        newLines[index - 1] = prevLine + lineContent;
        newLines.splice(index, 1);
        updateContent(newLines);

        setTimeout(() => {
            setActiveLineIndex(index - 1);
            // We'll need a way to set the cursor position in EditableLine
        }, 0);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
            {readOnly && sourceTask && (
                <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Viewing notes for task: <strong className="font-semibold">{sourceTask.name}</strong>
                    </p>
                    <button
                        onClick={() => onTaskLinkClick(sourceTask.name)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-200 dark:hover:bg-blue-500/20"
                    >
                        <PencilIcon className="w-4 h-4" />
                        Edit Task
                    </button>
                </div>
            )}
            <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                 <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Note Title"
                    disabled={readOnly}
                    className="text-2xl font-bold text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none w-full border-b-2 border-transparent focus:border-blue-500 dark:focus:border-blue-400 p-1 -ml-1 transition-colors disabled:cursor-not-allowed disabled:text-gray-500"
                />
                 <div className={`mt-3 ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
                    <TagInput tags={tags} onChange={handleTagsChange} />
                 </div>
            </header>
            <div 
                className="flex-1 overflow-y-auto p-6 relative"
                onClick={(e) => {
                    if (readOnly) return;
                    // If clicking the background, focus the last line or create a new one
                    if (e.target === e.currentTarget) {
                        if (lines.length > 0) {
                            setActiveLineIndex(lines.length - 1);
                        } else {
                            updateContent(['']);
                            setActiveLineIndex(0);
                        }
                    }
                }}
            >
                {readOnly ? (
                    <MarkdownRenderer
                        content={note.content || '*No notes for this task.*'}
                        notes={allNotes}
                        tasks={allTasks}
                        people={people}
                        onNoteLinkClick={onNoteLinkClick}
                        onTaskLinkClick={onTaskLinkClick}
                    />
                ) : (
                    lines.map((line, index) => (
                        <EditableLine
                            key={`${note.id}-${index}`}
                            lineContent={line}
                            isActive={activeLineIndex === index}
                            onActivate={() => setActiveLineIndex(index)}
                            onUpdate={(newText) => handleLineUpdate(index, newText)}
                            onEnter={handleEnter}
                            onBackspaceEmpty={() => handleBackspace(index, line)}
                            onArrowUp={() => index > 0 && setActiveLineIndex(index - 1)}
                            onArrowDown={() => index < lines.length - 1 && setActiveLineIndex(index + 1)}
                            lineIndex={index}
                            // Pass down props for MarkdownRenderer
                            notes={allNotes}
                            tasks={allTasks}
                            people={people}
                            onNoteLinkClick={onNoteLinkClick}
                            onTaskLinkClick={onTaskLinkClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default NoteEditor;