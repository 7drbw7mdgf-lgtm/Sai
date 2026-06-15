import React, { useState, useRef } from 'react';
import { ChevronDownIcon } from './icons/ChevronIcons';

interface PillAccordionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

const PillAccordion: React.FC<PillAccordionProps> = ({ title, children, defaultOpen = false }) => {
    const [isVisible, setIsVisible] = useState(defaultOpen);
    const contentRef = useRef<HTMLDivElement>(null);

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsVisible(v => !v)}
                className={`w-full flex justify-between items-center px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer text-left ${isVisible ? 'bg-gray-100' : 'hover:bg-gray-100/50'}`}
            >
                <div className="flex-1 flex items-center gap-2.5 text-sm text-gray-700">
                    {title}
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 text-gray-500 ${isVisible ? 'rotate-180' : ''}`} />
            </button>
            <div 
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: isVisible ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden" ref={contentRef}>
                    <div className={`pt-2 pl-1 pr-1 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PillAccordion;