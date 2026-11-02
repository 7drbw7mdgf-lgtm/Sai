/**
 * Benchline calendar file and link helpers for Google Calendar & Microsoft Outlook
 * Supports RFC 5545 iCalendar (.ics) files and direct 1-click web compose links for Google Calendar and Outlook Web/Desktop.
 */

import { ProjectData, Task, Meeting, Assignment, Priority } from '../types';

export interface CalendarSyncConfig {
    syncInterval: 'manual' | '15m' | '1h' | 'daily';
    syncDirection: 'two-way' | 'export-only' | 'import-only';
    syncScope: {
        tasks: boolean;
        assignments: boolean;
        meetings: boolean;
    };
}

// Storage key and event UIDs (@sai.workspace) keep the pre-rename prefix so existing
// sync settings and already-synced calendar events keep working.
const STORAGE_KEY = 'sai-calendar-sync-config';

export const DEFAULT_SYNC_CONFIG: CalendarSyncConfig = {
    syncInterval: 'manual',
    syncDirection: 'two-way',
    syncScope: {
        tasks: true,
        assignments: true,
        meetings: true,
    },
};

export function loadSyncConfig(): CalendarSyncConfig {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_SYNC_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load calendar sync config:', e);
    }
    return DEFAULT_SYNC_CONFIG;
}

export function saveSyncConfig(config: CalendarSyncConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.error('Failed to save calendar sync config:', e);
    }
}

// Format Date as UTC iCal date-time: YYYYMMDDTHHMMSSZ
export function formatICalDateTime(date: Date, timeStr?: string): string {
    const d = new Date(date);
    if (timeStr && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        d.setHours(hours || 0, minutes || 0, 0, 0);
    }
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Format Date as iCal all-day date: YYYYMMDD
export function formatICalDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// Escape special characters in iCal text
function escapeICalText(text: string): string {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Generate standard RFC 5545 iCalendar content for Google Calendar & Outlook
 */
export function generateICS(
    projectData: ProjectData,
    scope = { tasks: true, assignments: true, meetings: true }
): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Benchline//Project Management Calendar Sync//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Benchline Workspace Calendar',
        'X-WR-CALDESC:Tasks, Milestones & Meetings from Benchline',
        'X-WR-TIMEZONE:UTC',
    ];

    const nowStr = formatICalDateTime(new Date());

    // 1. Export Meetings
    if (scope.meetings && projectData.meetings) {
        projectData.meetings.forEach((m) => {
            const dtStart = formatICalDateTime(m.date, m.startTime || '09:00');
            const dtEnd = formatICalDateTime(m.date, m.endTime || '10:00');
            const attendeeNames = (m.attendees || [])
                .map((id) => projectData.people.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            const desc = [
                m.agenda ? `Agenda: ${m.agenda}` : '',
                attendeeNames ? `Attendees: ${attendeeNames}` : '',
                'Managed via Benchline Dashboard',
            ]
                .filter(Boolean)
                .join('\n');

            lines.push(
                'BEGIN:VEVENT',
                `UID:meeting-${m.id}@sai.workspace`,
                `DTSTAMP:${nowStr}`,
                `DTSTART:${dtStart}`,
                `DTEND:${dtEnd}`,
                `SUMMARY:${escapeICalText(m.title)}`,
                `DESCRIPTION:${escapeICalText(desc)}`,
                ...(m.location ? [`LOCATION:${escapeICalText(m.location)}`] : []),
                'CATEGORIES:MEETING,SAI',
                'STATUS:CONFIRMED',
                'END:VEVENT'
            );
        });
    }

    // 2. Export Timed Assignments
    if (scope.assignments && projectData.assignments) {
        projectData.assignments.forEach((a) => {
            const dtStart = formatICalDateTime(a.startDate, a.startTime || '09:00');
            const dtEnd = formatICalDateTime(a.endDate, a.endTime || '10:00');
            lines.push(
                'BEGIN:VEVENT',
                `UID:assignment-${a.id}@sai.workspace`,
                `DTSTAMP:${nowStr}`,
                `DTSTART:${dtStart}`,
                `DTEND:${dtEnd}`,
                `SUMMARY:${escapeICalText(`[Task Assignment] ${a.name}`)}`,
                `STATUS:${a.completed ? 'COMPLETED' : 'CONFIRMED'}`,
                'CATEGORIES:ASSIGNMENT,SAI',
                'END:VEVENT'
            );
        });
    }

    // 3. Export Tasks
    if (scope.tasks && projectData.tasks) {
        projectData.tasks.forEach((t) => {
            const groupName = projectData.groups.find((g) => g.id === t.groupId)?.name;
            const assigneeNames = (t.assignedTo || [])
                .map((id) => projectData.people.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            const desc = [
                groupName ? `Project Group: ${groupName}` : '',
                assigneeNames ? `Assigned To: ${assigneeNames}` : '',
                t.priority ? `Priority: ${t.priority}` : '',
                `Progress: ${t.completion}%`,
                t.notes ? `\nNotes: ${t.notes}` : '',
            ]
                .filter(Boolean)
                .join('\n');

            const startStr = formatICalDate(t.startDate);
            // iCal all-day DTEND is exclusive, so add 1 day to end date
            const endDatePlusOne = new Date(t.endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            const endStr = formatICalDate(endDatePlusOne);

            lines.push(
                'BEGIN:VEVENT',
                `UID:task-${t.id}@sai.workspace`,
                `DTSTAMP:${nowStr}`,
                `DTSTART;VALUE=DATE:${startStr}`,
                `DTEND;VALUE=DATE:${endStr}`,
                `SUMMARY:${escapeICalText(t.name)}`,
                `DESCRIPTION:${escapeICalText(desc)}`,
                `STATUS:${t.completion === 100 ? 'COMPLETED' : 'CONFIRMED'}`,
                'CATEGORIES:TASK,PROJECT,SAI',
                'END:VEVENT'
            );
        });
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

/**
 * Parses RFC 5545 iCalendar text into Benchline Meetings & Tasks
 */
export function parseICS(
    icsText: string,
    source: 'google' | 'outlook' = 'google'
): { tasks: Task[]; meetings: Meeting[] } {
    const tasks: Task[] = [];
    const meetings: Meeting[] = [];

    const lines = icsText.split(/\r?\n/);
    const unfoldedLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
            line += lines[i + 1].slice(1);
            i++;
        }
        unfoldedLines.push(line);
    }

    let inEvent = false;
    let currentEvent: Record<string, string> = {};

    for (const rawLine of unfoldedLines) {
        const line = rawLine.trim();
        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
            continue;
        }
        if (line === 'END:VEVENT') {
            inEvent = false;
            // Process the collected event
            const summary = unescapeICal(currentEvent['SUMMARY'] || 'Imported Event');
            const dtstart = currentEvent['DTSTART'] || '';
            const dtend = currentEvent['DTEND'] || '';
            const description = unescapeICal(currentEvent['DESCRIPTION'] || '');
            const location = unescapeICal(currentEvent['LOCATION'] || '');
            const uid = currentEvent['UID'] || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const categories = currentEvent['CATEGORIES'] || '';

            const isAllDay = dtstart.length === 8 || dtstart.includes('VALUE=DATE');
            const startDate = parseICalDate(dtstart);
            const endDate = dtend ? parseICalDate(dtend) : new Date(startDate);

            const isTask = categories.toUpperCase().includes('TASK') || isAllDay;

            if (isTask) {
                tasks.push({
                    id: `sync-t-${Date.now()}-${tasks.length}`,
                    name: summary,
                    startDate,
                    endDate,
                    assignedTo: [],
                    color: source === 'google' ? '#4285f4' : '#0078d4',
                    completion: 0,
                    priority: Priority.Medium,
                    notes: description,
                    source,
                    externalId: uid,
                });
            } else {
                const startTime = formatTimeFromDate(startDate);
                const endTime = formatTimeFromDate(endDate);
                meetings.push({
                    id: `sync-m-${Date.now()}-${meetings.length}`,
                    title: summary,
                    date: startDate,
                    startTime,
                    endTime,
                    attendees: [],
                    color: source === 'google' ? '#ea4335' : '#0078d4',
                    agenda: description,
                    location,
                    source,
                    externalId: uid,
                });
            }
            continue;
        }

        if (inEvent) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > -1) {
                const keyPart = line.substring(0, colonIdx);
                const valPart = line.substring(colonIdx + 1);
                const cleanKey = keyPart.split(';')[0].toUpperCase();
                currentEvent[cleanKey] = valPart;
            }
        }
    }

    return { tasks, meetings };
}

function unescapeICal(text: string): string {
    return text
        .replace(/\\n/g, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\');
}

function parseICalDate(str: string): Date {
    const clean = str.replace(/[^0-9TZ]/g, '');
    if (clean.length === 8) {
        const y = parseInt(clean.substring(0, 4), 10);
        const m = parseInt(clean.substring(4, 6), 10) - 1;
        const d = parseInt(clean.substring(6, 8), 10);
        return new Date(y, m, d);
    }
    if (clean.length >= 15) {
        const y = parseInt(clean.substring(0, 4), 10);
        const m = parseInt(clean.substring(4, 6), 10) - 1;
        const d = parseInt(clean.substring(6, 8), 10);
        const h = parseInt(clean.substring(9, 11), 10);
        const min = parseInt(clean.substring(11, 13), 10);
        const s = parseInt(clean.substring(13, 15), 10);
        if (clean.endsWith('Z')) {
            return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatTimeFromDate(d: Date): string {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 1-Click URL Generator for Google Calendar Event
 */
export function createGoogleCalendarUrl(event: {
    title: string;
    start: Date | string;
    end: Date | string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
}): string {
    const sDate = new Date(event.start);
    const eDate = new Date(event.end);

    let startFormatted: string;
    let endFormatted: string;

    if (event.startTime && event.endTime) {
        startFormatted = formatICalDateTime(sDate, event.startTime);
        endFormatted = formatICalDateTime(eDate, event.endTime);
    } else {
        startFormatted = formatICalDate(sDate);
        const nextDay = new Date(eDate);
        nextDay.setDate(nextDay.getDate() + 1);
        endFormatted = formatICalDate(nextDay);
    }

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${startFormatted}/${endFormatted}`,
        details: event.description || '',
        location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * 1-Click URL Generator for Microsoft Outlook Calendar (Web & Office 365)
 */
export function createOutlookCalendarUrl(event: {
    title: string;
    start: Date | string;
    end: Date | string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
}): string {
    const sDate = new Date(event.start);
    const eDate = new Date(event.end);

    let isoStart: string;
    let isoEnd: string;

    if (event.startTime && event.endTime) {
        const [sh, sm] = event.startTime.split(':').map(Number);
        sDate.setHours(sh || 0, sm || 0, 0, 0);
        const [eh, em] = event.endTime.split(':').map(Number);
        eDate.setHours(eh || 0, em || 0, 0, 0);
        isoStart = sDate.toISOString();
        isoEnd = eDate.toISOString();
    } else {
        sDate.setHours(9, 0, 0, 0);
        eDate.setHours(17, 0, 0, 0);
        isoStart = sDate.toISOString();
        isoEnd = eDate.toISOString();
    }

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.title,
        startdt: isoStart,
        enddt: isoEnd,
        body: event.description || '',
        location: event.location || '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Trigger file download of .ics calendar
 */
export function downloadICSFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
