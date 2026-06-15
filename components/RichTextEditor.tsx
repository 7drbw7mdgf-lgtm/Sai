
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ListOrderedIcon, ListUnorderedIcon, StrikethroughIcon, QuoteIcon, Heading2Icon } from './icons/TextFormatIcons';
import Tooltip from './Tooltip';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { TextFormatVertical } from './icons/TextFormatVertical';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean | string }>({});
    const [isToolbarOpen, setIsToolbarOpen] = useState(false);

    useOnClickOutside(toolbarRef, () => setIsToolbarOpen(false));

    useEffect(() => {
        const editor = editorRef.current;
        if (editor && value !== editor.innerHTML) {
            editor.innerHTML = value;
        }
    }, [value]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const updateToolbar = useCallback(() => {
        const newFormats: { [key: string]: boolean | string } = {};
        const commands = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];
        commands.forEach(cmd => {
            newFormats[cmd] = document.queryCommandState(cmd);
        });
        const blockType = document.queryCommandValue('formatBlock');
        newFormats.h2 = blockType === 'h2';
        newFormats.blockquote = blockType === 'blockquote';
        setActiveFormats(newFormats);
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleSelectionChange = () => {
            if (document.getSelection()?.anchorNode?.parentNode && editor.contains(document.getSelection()!.anchorNode!.parentNode)) {
                updateToolbar();
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        editor.addEventListener('focus', updateToolbar);
        editor.addEventListener('click', updateToolbar);
        editor.addEventListener('keyup', updateToolbar);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [updateToolbar]);

    const inlineButtons = [
        { cmd: 'bold', icon: <BoldIcon className="w-5 h-5" />, name: "Bold" },
        { cmd: 'italic', icon: <ItalicIcon className="w-5 h-5" />, name: "Italic" },
        { cmd: 'underline', icon: <UnderlineIcon className="w-5 h-5" />, name: "Underline" },
        { cmd: 'strikeThrough', icon: <StrikethroughIcon className="w-5 h-5" />, name: "Strikethrough" },
    ];

    const blockButtons = [
        { cmd: 'formatBlock', val: 'h2', icon: <Heading2Icon className="w-5 h-5" />, name: "Heading" },
        { cmd: 'formatBlock', val: 'blockquote', icon: <QuoteIcon className="w-5 h-5" />, name: "Quote" },
        { cmd: 'insertUnorderedList', icon: <ListUnorderedIcon className="w-5 h-5" />, name: "Bullet List" },
        { cmd: 'insertOrderedList', icon: <ListOrderedIcon className="w-5 h-5" />, name: "Numbered List" },
    ];

    return (
        <div className="h-full w-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-inner relative">
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="prose prose-sm max-w-none w-full flex-grow rounded-xl p-4 focus:outline-none overflow-y-auto"
                style={{ minHeight: '250px' }}
            />

            <div ref={toolbarRef} className="absolute bottom-4 right-4 z-10 flex flex-col items-end">
                 <div 
                    className={`flex items-center gap-0.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200/80 transition-all duration-300 ease-in-out ${isToolbarOpen ? 'p-1.5' : 'w-0 p-0'}`}
                    style={{ visibility: isToolbarOpen ? 'visible' : 'hidden', opacity: isToolbarOpen ? 1 : 0, overflow: 'hidden' }}
                >
                    {inlineButtons.map(({ cmd, icon, name }) => (
                         <Tooltip key={cmd} text={name}>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
                                className={`p-2 rounded-full transition-colors ${activeFormats[cmd] ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                {icon}
                            </button>
                        </Tooltip>
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                     {blockButtons.map(({ cmd, val, icon, name }) => (
                         <Tooltip key={val || cmd} text={name}>
                            <button
                                onMouseDown={(e) => { e.preventDefault(); execCmd(cmd, val); }}
                                 className={`p-2 rounded-full transition-colors ${activeFormats[val || cmd] ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                {icon}
                            </button>
                        </Tooltip>
                    ))}
                </div>
                <button
                    onClick={() => setIsToolbarOpen(o => !o)}
                    className="mt-2 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-200/80 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                    <TextFormatVertical className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default RichTextEditor;
