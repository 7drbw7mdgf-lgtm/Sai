
import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

interface DropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children, className="" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    useOnClickOutside(menuRef, () => setIsOpen(false));

    // A bit of a hack to close the menu when a MenuItem is clicked.
    const childrenWithClose = React.Children.map(children, child => {
        if (React.isValidElement(child) && (child.type as any).displayName === 'MenuItem') {
            const originalOnClick = (child.props as any).onClick;
            return React.cloneElement(child as React.ReactElement<{ onClick?: () => void}>, {
                onClick: () => {
                    if (originalOnClick) originalOnClick();
                    setIsOpen(false);
                }
            });
        }
        return child;
    });

    return (
        <div ref={menuRef} className="relative">
            <div onClick={() => setIsOpen(o => !o)} className="cursor-pointer h-full flex items-center">
                {trigger}
            </div>
            {isOpen && (
                <div className={`absolute top-full left-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/80 dark:border-gray-700/80 p-2 z-50 animate-fade-in ${className}`}>
                    {childrenWithClose}
                </div>
            )}
        </div>
    );
};
export default DropdownMenu;

export const MenuItem: React.FC<{ onClick: () => void, icon?: React.ReactNode, text: string }> = ({ onClick, icon, text }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-50 rounded-md transition-colors"
    >
        {icon}
        <span>{text}</span>
    </button>
);
(MenuItem as any).displayName = 'MenuItem'; // For identifying in parent
