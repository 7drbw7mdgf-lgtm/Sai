
import React, { useState } from 'react';
import { getDaysInMonth, getMonthName } from '../services/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/ChevronIcons';
import { LogoIcon } from './icons/LogoIcon';
import DatePickerPopup from './DatePickerPopup';
import { TaskPlusIcon } from './icons/TaskPlusIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import { FolderIcon } from './icons/FolderIcon';

interface SplashScreenProps {
    onNewProject?: () => void;
    onLoadProject?: () => void;
    onDatesSelected?: (start: Date, end: Date) => void;
    isCalendarView?: boolean;
}

const PreviewBoard: React.FC = () => (
    <div className="relative w-full max-w-xl">
        <div className="absolute -top-6 right-10 h-20 w-20 rounded-full bg-blue-100 blur-2xl" />
        <div className="absolute bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-100 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5">
                <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="h-8 w-40 rounded-full bg-gray-100" />
            </div>
            <div className="grid min-h-[420px] grid-cols-[4.25rem_1fr]">
                <div className="flex flex-col items-center gap-4 border-r border-gray-100 bg-gray-50 py-5">
                    {['bg-blue-600', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'].map((color, index) => (
                        <div key={index} className={`h-10 w-10 rounded-2xl ${color}`} />
                    ))}
                    <div className="mt-auto h-10 w-10 rounded-2xl bg-emerald-100" />
                </div>
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">Today</p>
                        <h2 className="mt-2 text-3xl font-bold text-gray-950">Project Command</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            ['8', 'Tasks open', 'bg-blue-50 text-blue-700'],
                            ['3', 'Meetings', 'bg-indigo-50 text-indigo-700'],
                            ['12', 'Notes', 'bg-emerald-50 text-emerald-700'],
                        ].map(([value, label, tone]) => (
                            <div key={label} className={`rounded-2xl p-4 ${tone}`}>
                                <div className="text-2xl font-bold">{value}</div>
                                <div className="mt-1 text-xs font-semibold">{label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 rounded-3xl border border-gray-100 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Weekly plan</h3>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Live</span>
                        </div>
                        <div className="space-y-3">
                            {[
                                ['Research sprint', 'w-4/5 bg-blue-500'],
                                ['Client review', 'w-3/5 bg-indigo-500'],
                                ['Launch checklist', 'w-2/3 bg-emerald-500'],
                            ].map(([label, bar]) => (
                                <div key={label}>
                                    <div className="mb-1 flex justify-between text-xs font-medium text-gray-500">
                                        <span>{label}</span>
                                        <span>On track</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100">
                                        <div className={`h-full rounded-full ${bar}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-7 gap-2">
                        {Array.from({ length: 21 }, (_, index) => (
                            <div
                                key={index}
                                className={`h-9 rounded-xl ${index === 10 ? 'bg-blue-600 shadow-lg shadow-blue-200' : index % 5 === 0 ? 'bg-emerald-100' : 'bg-gray-100'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

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
        <div className="w-full max-w-lg rounded-[2rem] border border-gray-200 bg-white p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-600">New project</p>
                    <h2 className="mt-2 text-3xl font-bold text-gray-950">Choose your timeline</h2>
                    <p className="mt-2 text-sm text-gray-500">Pick a start and end date for your workspace.</p>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <CalendarDaysIcon className="h-6 w-6" />
                </div>
            </div>
            <div className="flex justify-between items-center w-full mb-4 rounded-2xl bg-gray-50 px-3 py-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-white transition-colors text-gray-500 hover:text-gray-800"><ChevronLeftIcon /></button>
                <div className="relative">
                    <button onClick={() => setIsPickerOpen(o => !o)} className="text-lg font-semibold px-4 py-2 rounded-xl hover:bg-white transition-colors">{getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}</button>
                    {isPickerOpen && <DatePickerPopup displayDate={currentDate} setDisplayDate={setCurrentDate} onClose={() => setIsPickerOpen(false)} />}
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-white transition-colors text-gray-500 hover:text-gray-800"><ChevronRightIcon /></button>
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
                className="mt-7 w-full bg-gray-950 text-white font-bold py-3 px-8 rounded-2xl transition-all duration-300 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-80"
            >
                Create workspace
            </button>
        </div>
    );
};


const SplashScreen: React.FC<SplashScreenProps> = ({ onNewProject, onLoadProject, onDatesSelected, isCalendarView = false }) => {
    return (
        <div className="min-h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#eff6ff,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#ffffff_48%,#ecfdf5_100%)] text-gray-950">
            {isCalendarView && onDatesSelected ? (
                <div className="flex min-h-screen items-center justify-center px-6 py-10">
                    <Calendar onDatesSelected={onDatesSelected} />
                </div>
            ) : (
                <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
                    <section className="max-w-xl">
                        <div className="mb-10 flex items-center gap-3">
                            <div className="relative h-14 w-14">
                                <LogoIcon className="h-14 w-14 rounded-2xl shadow-lg shadow-blue-200" />
                                <div className="absolute left-[24%] top-[32%] h-1.5 w-7 rounded-full bg-white" />
                                <div className="absolute left-[24%] top-[48%] h-1.5 w-8 rounded-full bg-white/90" />
                                <div className="absolute left-[24%] top-[64%] h-1.5 w-5 rounded-full bg-white/80" />
                            </div>
                            <div>
                                <div className="text-2xl font-black tracking-tight">Benchline</div>
                                <div className="text-sm font-medium text-gray-500">Project workspace</div>
                            </div>
                        </div>

                        <p className="mb-3 text-sm font-bold uppercase tracking-[0.32em] text-blue-600">Start focused</p>
                        <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-gray-950 sm:text-6xl">
                            Plan the work. Keep the day clear.
                        </h1>
                        <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
                            Open a clean project space with tasks, calendar blocks, notes, and team context ready from the first click.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={onNewProject}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gray-950 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-gray-300 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-200"
                            >
                                <TaskPlusIcon className="h-5 w-5" />
                                New project
                            </button>
                            <button
                                onClick={onLoadProject}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-lg"
                            >
                                <FolderIcon className="h-5 w-5" />
                                Load demo
                            </button>
                        </div>

                        <div className="mt-10 grid max-w-lg grid-cols-3 gap-3 text-sm">
                            {['Calendar planning', 'Task tracking', 'Notes and team'].map(item => (
                                <div key={item} className="rounded-2xl border border-gray-200 bg-white/80 px-4 py-3 font-semibold text-gray-600 shadow-sm backdrop-blur">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="flex justify-center lg:justify-end">
                        <PreviewBoard />
                    </section>
                </main>
            )}
        </div>
    );
};

export default SplashScreen;
