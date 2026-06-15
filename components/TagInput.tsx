
import React, { useState } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, placeholder = "Add tags..." }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && inputValue === '') {
            if (tags.length > 0) {
                onChange(tags.slice(0, -1));
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="flex flex-wrap items-center gap-2 p-1.5 border border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-lg bg-white transition-colors">
            {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-2 py-0.5 rounded-md">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-700">
                        <XCircleIcon className="w-4 h-4" />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-grow bg-transparent text-sm p-1 focus:outline-none min-w-[80px]"
            />
        </div>
    );
};

export default TagInput;
