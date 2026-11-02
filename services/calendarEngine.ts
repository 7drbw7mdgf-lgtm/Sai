/**
 * Provider-neutral calendar sync.
 *
 * Benchline's own work goes to a dedicated "Benchline" calendar, so its events are the only ones
 * ever written. The user's main calendar is only read. Deletions are deliberately not propagated
 * in either direction: project data can reset on reload, and that must never remove real events.
 */

import { Assignment, Meeting, Priority, ProjectData, Task } from '../types';
import { CalendarSyncConfig } from './calendarSync';

export type CalendarProviderId = 'google' | 'outlook';

export interface EventInput {
    title: string;
    start: Date;
    end: Date; // Exclusive for all-day events
    allDay: boolean;
    description: string;
    location?: string;
}

export interface RemoteEvent extends EventInput {
    id: string;
    updated: string;
}

export interface CalendarProvider {
    id: CalendarProviderId;
    label: string;
    isConfigured(): boolean;
    signIn(): Promise<string>; // Resolves with the signed-in account's name
    signOut(): void;
    ensureBenchlineCalendar(knownId?: string): Promise<string>;
    listEvents(calendarId: string | 'primary', range?: { from: Date; to: Date }): Promise<RemoteEvent[]>;
    createEvent(calendarId: string, input: EventInput): Promise<RemoteEvent>;
    updateEvent(calendarId: string, eventId: string, input: EventInput): Promise<RemoteEvent>;
}

export class CalendarAuthExpiredError extends Error {}

export interface EventLink {
    remoteId: string;
    hash: string;
    updated: string;
}

export interface AccountLinks {
    calendarId?: string;
    items: { [key: string]: EventLink };
}

export interface SyncResult {
    created: number;
    updated: number;
    pulledChanges: number;
    imported: number;
    failed: number;
    links: AccountLinks;
    patch: (data: ProjectData) => ProjectData;
}

type ItemKind = 'task' | 'meeting' | 'assignment';

interface SyncItem {
    key: string;
    kind: ItemKind;
    id: string;
    input: EventInput;
}

const REF_PREFIX = 'benchline-ref:';

const combine = (date: Date, time: string | undefined, fallback: string): Date => {
    const [hours, minutes] = (time && time.includes(':') ? time : fallback).split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours || 0, minutes || 0, 0, 0);
    return d;
};

const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const toTime = (date: Date): string =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const isExternal = (item: { source?: string }) => item.source === 'google' || item.source === 'outlook';

const taskInput = (task: Task): EventInput => ({
    title: task.name,
    start: startOfDay(task.startDate),
    end: addDays(startOfDay(task.endDate), 1),
    allDay: true,
    description: task.notes || '',
});

const meetingInput = (meeting: Meeting): EventInput => ({
    title: meeting.title,
    start: combine(meeting.date, meeting.startTime, '09:00'),
    end: combine(meeting.date, meeting.endTime, '10:00'),
    allDay: false,
    description: meeting.agenda || '',
    location: meeting.location || undefined,
});

const assignmentInput = (assignment: Assignment): EventInput => ({
    title: assignment.name,
    start: combine(assignment.startDate, assignment.startTime, '09:00'),
    end: combine(assignment.endDate, assignment.endTime, '10:00'),
    allDay: false,
    description: '',
});

export const collectItems = (data: ProjectData, scope: CalendarSyncConfig['syncScope']): SyncItem[] => [
    ...(scope.tasks ? data.tasks.filter(t => !isExternal(t)).map(t => ({ key: `task:${t.id}`, kind: 'task' as const, id: t.id, input: taskInput(t) })) : []),
    ...(scope.meetings ? data.meetings.filter(m => !isExternal(m)).map(m => ({ key: `meeting:${m.id}`, kind: 'meeting' as const, id: m.id, input: meetingInput(m) })) : []),
    ...(scope.assignments ? (data.assignments || []).map(a => ({ key: `assignment:${a.id}`, kind: 'assignment' as const, id: a.id, input: assignmentInput(a) })) : []),
];

// Times are compared by instant, so reformatting by a provider can't look like an edit.
export const hashInput = (input: EventInput): string =>
    JSON.stringify([input.title, input.start.getTime(), input.end.getTime(), input.allDay, input.description, input.location || '']);

const withRef = (input: EventInput, key: string): EventInput => ({
    ...input,
    description: `${input.description ? `${input.description}\n\n` : ''}${REF_PREFIX}${key}`,
});

const readRef = (description: string): string | null => {
    const match = description.match(/benchline-ref:((?:task|meeting|assignment):[^\s<]+)/);
    return match ? match[1] : null;
};

const stripRef = (description: string): string =>
    description.replace(/\s*benchline-ref:\S+\s*$/, '').trim();

const applyRemote = (data: ProjectData, item: SyncItem, remote: RemoteEvent): ProjectData => {
    const description = stripRef(remote.description);
    if (item.kind === 'task') {
        return {
            ...data,
            tasks: data.tasks.map(t => t.id !== item.id ? t : {
                ...t,
                name: remote.title,
                notes: description,
                startDate: startOfDay(remote.start),
                endDate: remote.allDay ? addDays(startOfDay(remote.end), -1) : startOfDay(remote.end),
            }),
        };
    }
    if (item.kind === 'meeting') {
        return {
            ...data,
            meetings: data.meetings.map(m => m.id !== item.id ? m : {
                ...m,
                title: remote.title,
                agenda: description,
                location: remote.location || '',
                date: startOfDay(remote.start),
                startTime: toTime(remote.start),
                endTime: toTime(remote.end),
            }),
        };
    }
    return {
        ...data,
        assignments: (data.assignments || []).map(a => a.id !== item.id ? a : {
            ...a,
            name: remote.title,
            startDate: startOfDay(remote.start),
            endDate: startOfDay(remote.end),
            startTime: toTime(remote.start),
            endTime: toTime(remote.end),
        }),
    };
};

const findItemInput = (data: ProjectData, item: SyncItem): EventInput => {
    if (item.kind === 'task') return taskInput(data.tasks.find(t => t.id === item.id)!);
    if (item.kind === 'meeting') return meetingInput(data.meetings.find(m => m.id === item.id)!);
    return assignmentInput((data.assignments || []).find(a => a.id === item.id)!);
};

const IMPORT_COLORS = {
    google: { task: '#4285f4', meeting: '#ea4335' },
    outlook: { task: '#0078d4', meeting: '#0078d4' },
};

const replaceImported = (data: ProjectData, providerId: CalendarProviderId, events: RemoteEvent[]): ProjectData => {
    const prefix = `${providerId}-live:`;
    const tasks: Task[] = [];
    const meetings: Meeting[] = [];
    events.forEach(event => {
        const id = `${prefix}${event.id}`;
        if (event.allDay) {
            tasks.push({
                id,
                name: event.title,
                startDate: startOfDay(event.start),
                endDate: addDays(startOfDay(event.end), -1),
                assignedTo: [],
                color: IMPORT_COLORS[providerId].task,
                completion: 0,
                priority: Priority.Medium,
                notes: event.description,
                source: providerId,
                externalId: event.id,
            });
        } else {
            meetings.push({
                id,
                title: event.title,
                date: startOfDay(event.start),
                startTime: toTime(event.start),
                endTime: toTime(event.end),
                attendees: [],
                color: IMPORT_COLORS[providerId].meeting,
                agenda: event.description,
                location: event.location,
                source: providerId,
                externalId: event.id,
            });
        }
    });
    return {
        ...data,
        tasks: [...data.tasks.filter(t => !t.id.startsWith(prefix)), ...tasks],
        meetings: [...data.meetings.filter(m => !m.id.startsWith(prefix)), ...meetings],
    };
};

const importRange = (data: ProjectData): { from: Date; to: Date } => ({
    from: startOfDay(data.projectStartDate),
    to: addDays(startOfDay(data.projectEndDate), 1),
});

export async function runSync(
    provider: CalendarProvider,
    initial: ProjectData,
    config: Pick<CalendarSyncConfig, 'syncDirection' | 'syncScope'>,
    previousLinks: AccountLinks,
): Promise<SyncResult> {
    const links: AccountLinks = { calendarId: previousLinks.calendarId, items: { ...previousLinks.items } };
    let data = initial;
    const patches: Array<(d: ProjectData) => ProjectData> = [];
    const result = { created: 0, updated: 0, pulledChanges: 0, imported: 0, failed: 0 };

    const finish = (): SyncResult => ({
        ...result,
        links,
        patch: (d: ProjectData) => patches.reduce((current, fn) => fn(current), d),
    });

    if (config.syncDirection !== 'import-only') {
        const calendarId = await provider.ensureBenchlineCalendar(links.calendarId);
        if (calendarId !== links.calendarId) {
            links.calendarId = calendarId;
            links.items = {};
        }

        const remoteEvents = await provider.listEvents(calendarId);
        const remoteById = new Map(remoteEvents.map(e => [e.id, e]));

        // Reconnect events to their items if this browser's links were cleared.
        remoteEvents.forEach(event => {
            const key = readRef(event.description);
            if (key && !links.items[key]) links.items[key] = { remoteId: event.id, hash: '', updated: event.updated };
        });

        for (const item of collectItems(data, config.syncScope)) {
            const link = links.items[item.key];
            const remote = link ? remoteById.get(link.remoteId) : undefined;
            const hash = hashInput(item.input);
            try {
                if (!link || !remote) {
                    const created = await provider.createEvent(calendarId, withRef(item.input, item.key));
                    links.items[item.key] = { remoteId: created.id, hash, updated: created.updated };
                    result.created++;
                } else if (link.hash !== hash) {
                    const updated = await provider.updateEvent(calendarId, link.remoteId, withRef(item.input, item.key));
                    links.items[item.key] = { remoteId: updated.id, hash, updated: updated.updated };
                    result.updated++;
                } else if (remote.updated !== link.updated && config.syncDirection === 'two-way') {
                    const patch = (d: ProjectData) => applyRemote(d, item, remote);
                    patches.push(patch);
                    data = patch(data);
                    links.items[item.key] = { remoteId: remote.id, hash: hashInput(findItemInput(data, item)), updated: remote.updated };
                    result.pulledChanges++;
                }
            } catch (error) {
                if (error instanceof CalendarAuthExpiredError) throw error;
                console.error(`Calendar sync failed for ${item.key}:`, error);
                result.failed++;
            }
        }
    }

    if (config.syncDirection !== 'export-only') {
        const events = await provider.listEvents('primary', importRange(data));
        const patch = (d: ProjectData) => replaceImported(d, provider.id, events);
        patches.push(patch);
        data = patch(data);
        result.imported = events.length;
    }

    return finish();
}
