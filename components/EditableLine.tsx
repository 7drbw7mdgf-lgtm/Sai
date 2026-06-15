import React, { useRef, useEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { Note, Task, Person } from '../types';

interface EditableLineProps {
    lineContent: string;
    isActive: boolean;
    onActivate: () => void;
    onUpdate: (newContent: string) => void;
    onEnter: (index: number, contentBefore: string, contentAfter: string) => void;
    onBackspaceEmpty: () => void;
    onArrowUp: () => void;
    onArrowDown: () => void;
    lineIndex: number;
    // Props for MarkdownRenderer
    notes: Note[];
    tasks: Task[];
    people: Person[];
    onNoteLinkClick: (noteTitle: string) => void;
    onTaskLinkClick: (taskName: string) => void;
}

const EditableLine: React.FC<EditableLineProps> = ({
    lineContent, isActive, onActivate, onUpdate, onEnter, onBackspaceEmpty, onArrowUp, onArrowDown, lineIndex,
    notes, tasks, people, onNoteLinkClick, onTaskLinkClick
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [localContent, setLocalContent] = useState(lineContent);

    useEffect(() => {
        setLocalContent(lineContent);
    }, [lineContent]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (isActive && textarea) {
            textarea.focus();
            // Adjust height based on content
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [isActive]);
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setLocalContent(value);
        onUpdate(value);
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        if (e.key === 'Enter') {
            e.preventDefault();
            const cursorPos = textarea.selectionStart;
            onEnter(lineIndex, textarea.value.substring(0, cursorPos), textarea.value.substring(cursorPos));
        }
        if (e.key === 'Backspace' && textarea.value === '') {
            e.preventDefault();
            onBackspaceEmpty();
        }
        if (e.key === 'ArrowUp' && textarea.selectionStart === 0) {
            e.preventDefault();
            onArrowUp();
        }
        if (e.key === 'ArrowDown' && textarea.selectionStart === textarea.value.length) {
            e.preventDefault();
            onArrowDown();
        }
    };
    
    if (isActive) {
        return (
            <div className="relative py-1 rounded-md bg-blue-50 dark:bg-gray-700/50 my-px">
                <textarea
                    ref={textareaRef}
                    value={localContent}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={onActivate} // This might be too aggressive, clicking away should deactivate
                    className="w-full bg-transparent focus:outline-none resize-none leading-relaxed prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-100"
                    rows={1}
                />
            </div>
        );
    }

    return (
        <div onClick={onActivate} className="py-1 my-px cursor-text min-h-[2.25rem]">
            {lineContent.trim() === '' ? (
                 <br/>
            ) : (
                <MarkdownRenderer 
                    content={lineContent}
                    notes={notes}
                    tasks={tasks}
                    people={people}
                    onNoteLinkClick={onNoteLinkClick}
                    onTaskLinkClick={onTaskLinkClick}
                />
            )}
        </div>
    );
};

export default EditableLine;
