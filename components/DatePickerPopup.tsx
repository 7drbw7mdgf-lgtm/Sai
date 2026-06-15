import React, { useState, useRef, useEffect } from 'react';
import { getMonthName } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';

const DatePickerPopup: React.FC<{
    displayDate: Date;
    setDisplayDate: (date: Date) => void;
    onClose: () => void;
}> = ({ displayDate, setDisplayDate, onClose }) => {
    const [pickerView, setPickerView] = useState<'months' | 'years'>('months');
    const [yearRangeStart, setYearRangeStart] = useState(displayDate.getFullYear() - 6);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const renderMonthsView = () => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return (
            <div className="grid grid-cols-3 gap-2 p-2">
                {monthNames.map((month, index) => (
                    <button
                        key={month}
                        onClick={() => {
                            setDisplayDate(new Date(displayDate.getFullYear(), index, 1));
                            onClose();
                        }}
                        className="p-3 rounded-lg text-center font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors text-sm"
                    >
                        {month}
                    </button>
                ))}
            </div>
        );
    };

    const renderYearsView = () => {
        const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);
        return (
            <div className="grid grid-cols-3 gap-2 p-2">
                {years.map(year => (
                    <button
                        key={year}
                        onClick={() => {
                            setDisplayDate(new Date(year, displayDate.getMonth(), 1));
                            setPickerView('months');
                        }}
                        className="p-3 rounded-lg text-center font-semibold text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-colors text-sm"
                    >
                        {year}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div ref={popupRef} className="absolute top-full mt-2 w-72 bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-50 animate-fade-in-fast">
             <div className="flex items-center justify-between p-2 border-b border-gray-200/80">
                <button onClick={() => pickerView === 'months' ? setDisplayDate(new Date(displayDate.getFullYear() - 1, displayDate.getMonth(), 1)) : setYearRangeStart(s => s - 12)} className="h-8 w-8 flex shrink-0 items-center justify-center rounded-full hover:bg-gray-200/50 transition-colors text-gray-500 hover:text-gray-800">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {pickerView === 'months' && <button onClick={() => { setPickerView('years'); setYearRangeStart(displayDate.getFullYear() - 6); }} className="text-md font-semibold text-gray-700 truncate hover:text-blue-600">{displayDate.getFullYear()}</button>}
                {pickerView === 'years' && <span className="text-md font-semibold text-gray-700 truncate">{yearRangeStart} - {yearRangeStart + 11}</span>}
                 <button onClick={() => pickerView === 'months' ? setDisplayDate(new Date(displayDate.getFullYear() + 1, displayDate.getMonth(), 1)) : setYearRangeStart(s => s + 12)} className="h-8 w-8 flex shrink-0 items-center justify-center rounded-full hover:bg-gray-200/50 transition-colors text-gray-500 hover:text-gray-800">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            {pickerView === 'months' ? renderMonthsView() : renderYearsView()}
        </div>
    );
}

export default DatePickerPopup;