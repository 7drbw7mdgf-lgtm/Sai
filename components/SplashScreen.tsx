
import React, { useState, useCallback } from 'react';
import { getDaysInMonth, getMonthName } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { LogoIcon } from './icons/LogoIcon';
import DatePickerPopup from './DatePickerPopup';

interface SplashScreenProps {
    onNewProject?: () => void;
    onLoadProject?: () => void;
    onDatesSelected?: (start: Date, end: Date) => void;
    isCalendarView?: boolean;
}

const Calendar: React.FC<{ onDatesSelected: (start: Date, end: Date) => void }> = ({ onDatesSelected }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (!startDate || (startDate && endDate)) {
            setStartDate(clickedDate);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (clickedDate < startDate) {
                setEndDate(startDate);
                setStartDate(clickedDate);
            } else {
                setEndDate(clickedDate);
            }
        }
    };

    const isDateInRange = (day: number) => {
        if (!startDate) return false;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const end = endDate || hoverDate;
        if (!end) return false;
        const s = startDate > end ? end : startDate;
        const e = startDate > end ? startDate : end;
        return date >= s && date <= e;
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
            if (!day) return <div key={`blank-${index}`} className="w-10 h-10"></div>;
            const date = new Date(year, month, day);
            const isSelectedStart = startDate && date.getTime() === startDate.getTime();
            const isSelectedEnd = endDate && date.getTime() === endDate.getTime();

            return (
                <div key={day}
                    onMouseEnter={() => !endDate && setHoverDate(date)}
                    onMouseLeave={() => setHoverDate(null)}
                    onClick={() => handleDateClick(day)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-colors
                        ${isDateInRange(day) ? 'bg-blue-500/20 text-blue-800' : ''}
                        ${isSelectedStart ? '!bg-blue-600 text-white' : ''}
                        ${isSelectedEnd ? '!bg-blue-600 text-white' : ''}
                        ${!isDateInRange(day) ? 'hover:bg-gray-100' : ''}
                    `}
                >
                    {day}
                </div>
            );
        });
    };

    const canConfirm = startDate && endDate;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-md w-full border border-gray-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Select Project Duration</h2>
            <p className="text-sm text-gray-500 mb-6">Click to select a start and end date.</p>
            <div className="flex justify-between items-center w-full mb-4 px-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronLeftIcon /></button>
                <div className="relative">
                    <button onClick={() => setIsPickerOpen(o => !o)} className="text-lg font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</button>
                    {isPickerOpen && <DatePickerPopup displayDate={currentDate} setDisplayDate={setCurrentDate} onClose={() => setIsPickerOpen(false)} />}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 font-medium mb-2 w-full">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {renderDays()}
            </div>
            <button
                onClick={() => canConfirm && onDatesSelected(startDate, endDate!)}
                disabled={!canConfirm}
                className="mt-6 bg-blue-600 text-white font-bold py-2 px-8 rounded-full transition-all duration-300 hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
                Confirm Dates
            </button>
        </div>
    );
};


const SplashScreen: React.FC<SplashScreenProps> = ({ onNewProject, onLoadProject, onDatesSelected, isCalendarView = false }) => {
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 bg-opacity-80 backdrop-blur-sm">
            {isCalendarView && onDatesSelected ? (
                <Calendar onDatesSelected={onDatesSelected} />
            ) : (
                <div className="text-center flex flex-col items-center">
                    <div className="relative group w-32 h-32 flex items-center justify-center mb-8 transition-transform duration-500 ease-in-out hover:scale-110 hover:rotate-6">
                        <LogoIcon className="absolute h-full w-full shadow-lg rounded-full" />

                        {/* Recreating logo bars to animate them */}
                        <div className="absolute w-[31.25%] h-2 left-[25%] bg-white/80 rounded-full transition-all duration-300 ease-out group-hover:-translate-y-5 group-hover:opacity-0" style={{ top: 'calc(39% - 1px)'}} />
                        <div className="absolute w-[50%] h-2 left-[25%] bg-white rounded-full transition-all duration-300 ease-out group-hover:opacity-0" style={{top: 'calc(53% - 1px)'}}/>
                        <div className="absolute w-[21.875%] h-2 left-[25%] bg-white/80 rounded-full transition-all duration-300 ease-out group-hover:translate-y-5 group-hover:opacity-0" style={{top: 'calc(67% - 1px)'}}/>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                            <button onClick={onNewProject} className="bg-white text-blue-600 font-bold py-2 px-5 rounded-full text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all">
                                New Project
                            </button>
                            <button onClick={onLoadProject} className="bg-white/20 backdrop-blur-sm text-white font-bold py-2 px-5 rounded-full text-sm shadow-md hover:shadow-lg hover:scale-105 border border-white/30 transition-all">
                                Load Demo
                            </button>
                        </div>
                    </div>
                    <p className="text-xl text-gray-500">Plan, track, and manage your projects with ease.</p>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;