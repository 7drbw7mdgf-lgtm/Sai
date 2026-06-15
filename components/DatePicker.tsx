


import React, { useState, useRef, useMemo } from 'react';
import { getDaysInMonth, getMonthName } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import DatePickerPopup from './DatePickerPopup';

interface DatePickerProps {
    selectedDate: Date;
    onChange: (date: Date) => void;
    onClose: () => void;
    minDate?: Date;
    maxDate?: Date;
    isInline?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onChange, onClose, minDate, maxDate, isInline = false }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const pickerRef = useRef(null);

    useOnClickOutside(pickerRef, () => {
        if (!isInline) {
            onClose();
        }
    });

    const minDateStartOfDay = useMemo(() => {
        if (!minDate) return null;
        const d = new Date(minDate);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [minDate]);

    const maxDateEndOfDay = useMemo(() => {
        if (!maxDate) return null;
        const d = new Date(maxDate);
        d.setHours(23, 59, 59, 999);
        return d;
    }, [maxDate]);


    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (minDateStartOfDay && clickedDate < minDateStartOfDay) return;
        if (maxDateEndOfDay && clickedDate > maxDateEndOfDay) return;
        onChange(clickedDate);
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return [...blanks, ...days].map((day, index) => {
            if (!day) return <div key={`blank-${index}`} className="w-9 h-9"></div>;
            
            const date = new Date(year, month, day);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = new Date().toDateString() === date.toDateString();
            
            const isDisabled = !!(minDateStartOfDay && date < minDateStartOfDay) || !!(maxDateEndOfDay && date > maxDateEndOfDay);

            return (
                <div key={day}
                    onClick={() => !isDisabled && handleDateClick(day)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors text-sm
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                        ${!isDisabled && isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
                        ${!isDisabled && !isSelected && isToday ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                        ${!isDisabled && !isSelected && !isToday ? 'hover:bg-gray-100 text-gray-700' : ''}
                    `}
                >
                    {day}
                </div>
            );
        });
    };
    
    const containerClasses = isInline
        ? "bg-white/90"
        : "absolute top-full mt-2 bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-50 animate-fade-in p-4";

    return (
        <div ref={pickerRef} className={containerClasses}>
             <div className="flex justify-between items-center w-full mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronLeftIcon className="w-5 h-5" /></button>
                <div className="relative">
                    <button onClick={() => setIsPickerOpen(o => !o)} className="text-md font-semibold px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-800">{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</button>
                    {isPickerOpen && <DatePickerPopup displayDate={currentDate} setDisplayDate={setCurrentDate} onClose={() => setIsPickerOpen(false)}/>}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronRightIcon className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 font-medium mb-2 w-full">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>
        </div>
    );
};

export default DatePicker;