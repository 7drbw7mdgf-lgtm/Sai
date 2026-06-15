import React from 'react';

interface AutofillPopupProps {
    items: string[];
    position: { top: number; left: number };
    onSelect: (item: string) => void;
    onClose: () => void;
}

const AutofillPopup: React.FC<AutofillPopupProps> = ({ items, position, onSelect, onClose }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const popupRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % items.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (items[selectedIndex]) {
                    onSelect(items[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase to intercept before textarea
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [items, selectedIndex, onSelect, onClose]);

    React.useEffect(() => {
        popupRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (items.length === 0) return null;

    return (
        <div 
            ref={popupRef}
            className="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 animate-fade-in"
            style={{ top: position.top, left: position.left }}
        >
            {items.map((item, index) => (
                <button
                    key={item}
                    onClick={() => onSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors ${index === selectedIndex ? 'bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900/50'}`}
                >
                    {item}
                </button>
            ))}
        </div>
    );
};

export default AutofillPopup;
