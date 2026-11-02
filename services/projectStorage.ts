import { ProjectData } from '../types';

export const PROJECT_STORAGE_KEY = 'benchline.project.v1';
const UNREADABLE_BACKUP_KEY = `${PROJECT_STORAGE_KEY}.unreadable`;

let loadFailed = false;

export const didSavedProjectFailToLoad = () => loadFailed;

function asDate(value: unknown): Date {
    const date = new Date(value as string);
    if (value === null || value === undefined || !Number.isFinite(date.getTime())) throw new Error('Invalid project date');
    return date;
}

const records = (value: unknown, name: string): any[] => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.some(item => !item || typeof item !== 'object')) throw new Error(`Invalid ${name}`);
    return value;
};

const requireText = (value: unknown, name: string): string => {
    if (typeof value !== 'string' || !value) throw new Error(`Missing ${name}`);
    return value;
};

const text = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;

const textList = (value: unknown): string[] => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];

// Views assume these fields exist, so a bad file must be rejected here rather than crash every later load.
export function parseProject(raw: string): ProjectData {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.groups) || !Array.isArray(parsed.people)) {
        throw new Error('Not a Benchline project');
    }
    return {
        ...parsed,
        projectStartDate: asDate(parsed.projectStartDate),
        projectEndDate: asDate(parsed.projectEndDate),
        tasks: records(parsed.tasks, 'tasks').map(t => ({
            ...t,
            id: requireText(t.id, 'task id'),
            name: text(t.name),
            startDate: asDate(t.startDate),
            endDate: asDate(t.endDate),
            assignedTo: textList(t.assignedTo),
            color: text(t.color, '#ef754e'),
            completion: Number.isFinite(t.completion) ? t.completion : 0,
            ...(t.dependencies !== undefined ? { dependencies: textList(t.dependencies) } : {}),
            ...(t.tags !== undefined ? { tags: textList(t.tags) } : {}),
        })),
        groups: records(parsed.groups, 'groups').map(g => ({ ...g, id: requireText(g.id, 'group id'), name: text(g.name), color: text(g.color, '#ef754e') })),
        people: records(parsed.people, 'people').map(p => ({ ...p, id: requireText(p.id, 'person id'), name: text(p.name), avatarUrl: text(p.avatarUrl) })),
        assignments: records(parsed.assignments, 'assignments').map(a => ({
            ...a,
            id: requireText(a.id, 'assignment id'),
            taskId: text(a.taskId),
            name: text(a.name),
            startDate: asDate(a.startDate),
            endDate: asDate(a.endDate),
            startTime: text(a.startTime, '09:00'),
            endTime: text(a.endTime, '10:00'),
            assignedTo: textList(a.assignedTo),
            completed: !!a.completed,
        })),
        meetings: records(parsed.meetings, 'meetings').map(m => ({
            ...m,
            id: requireText(m.id, 'meeting id'),
            title: text(m.title),
            date: asDate(m.date),
            startTime: text(m.startTime, '09:00'),
            endTime: text(m.endTime, '10:00'),
            attendees: textList(m.attendees),
            color: text(m.color, '#ef754e'),
            agenda: text(m.agenda),
        })),
        jobs: records(parsed.jobs, 'jobs').map(j => ({
            ...j,
            id: requireText(j.id, 'job id'),
            name: text(j.name),
            meetingId: text(j.meetingId),
            startDate: asDate(j.startDate),
            endDate: asDate(j.endDate),
            startTime: text(j.startTime, '09:00'),
            endTime: text(j.endTime, '10:00'),
            assignedTo: textList(j.assignedTo),
            createdAt: asDate(j.createdAt),
            completed: !!j.completed,
        })),
        notes: records(parsed.notes, 'notes').map(n => ({
            ...n,
            id: requireText(n.id, 'note id'),
            title: text(n.title),
            content: text(n.content),
            tags: textList(n.tags),
            createdAt: asDate(n.createdAt),
            updatedAt: asDate(n.updatedAt),
        })),
        experiments: records(parsed.experiments, 'experiments').map(e => ({
            ...e,
            id: requireText(e.id, 'experiment id'),
            variants: records(e.variants, 'experiment variants'),
            linkedTasks: textList(e.linkedTasks),
        })),
        customFields: records(parsed.customFields, 'custom fields').map(f => ({ ...f, id: requireText(f.id, 'custom field id'), name: text(f.name) })),
        designLayout: parsed.designLayout && typeof parsed.designLayout === 'object' ? parsed.designLayout : { tasks: {}, groups: {} },
    };
}

export function loadSavedProject(): ProjectData | null {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(PROJECT_STORAGE_KEY);
        return raw ? parseProject(raw) : null;
    } catch (error) {
        console.error('Could not open the saved project:', error);
        loadFailed = !!raw;
        // Keep the unreadable copy, because the next save replaces the original.
        try {
            if (raw) localStorage.setItem(UNREADABLE_BACKUP_KEY, raw);
        } catch { /* Nothing more can be done if storage is unavailable. */ }
        return null;
    }
}

export function downloadProjectBackup(data: ProjectData): void {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `benchline-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function writeProject(serialized: string): boolean {
    try {
        localStorage.setItem(PROJECT_STORAGE_KEY, serialized);
        return true;
    } catch (error) {
        console.error('Could not save the project:', error);
        return false;
    }
}
