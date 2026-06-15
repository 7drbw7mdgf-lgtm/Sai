
import { Group, Person, Task, Priority, DesignLayout, CustomField, Assignment, Note, Theme, ExperimentStatus } from './types';

export const DEFAULT_THEMES: Theme[] = [
    {
        id: 'blue', name: 'Ocean Blue', colors: {
            '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a',
        }
    },
    {
        id: 'indigo', name: 'Royal Indigo', colors: {
            '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81',
        }
    },
    {
        id: 'green', name: 'Forest Green', colors: {
            '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d',
        }
    },
    {
        id: 'rose', name: 'Crimson Rose', colors: {
            '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337',
        }
    },
    {
        id: 'purple', name: 'Deep Purple', colors: {
            '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95',
        }
    },
    {
        id: 'teal', name: 'Emerald Teal', colors: {
            '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a',
        }
    },
    {
        id: 'orange', name: 'Sunset Orange', colors: {
            '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12',
        }
    },
    {
        id: 'cyan', name: 'Arctic Cyan', colors: {
            '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63',
        }
    }
];

export const TASK_COLORS = [
    // Pinks
    '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626',
    // Oranges
    '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c',
    // Yellows
    '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706',
    // Limes
    '#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d',
    // Greens
    '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a',
    // Teals
    '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488',
    // Cyans
    '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2',
    // Blues
    '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb',
    // Indigos
    '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5',
    // Violets
    '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce',
    // Grays
    '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563',
];


export const PRIORITY_COLORS: { [key in Priority]: string } = {
    [Priority.Urgent]: '#ef4444', // red-500
    [Priority.High]: '#f97316',   // orange-500
    [Priority.Medium]: '#eab308', // yellow-500
    [Priority.Low]: '#22c55e',    // green-500
};

export const PRIORITY_ORDER: { [key in Priority]: number } = {
    [Priority.Urgent]: 4,
    [Priority.High]: 3,
    [Priority.Medium]: 2,
    [Priority.Low]: 1,
};

export const DUMMY_PEOPLE: Person[] = [
    { id: 'p1', name: 'Alice', avatarUrl: 'https://picsum.photos/seed/p1/40/40' },
    { id: 'p2', name: 'Bob', avatarUrl: 'https://picsum.photos/seed/p2/40/40' },
    { id: 'p3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/p3/40/40' },
    { id: 'p4', name: 'Diana', avatarUrl: 'https://picsum.photos/seed/p4/40/40' },
];

export const DUMMY_GROUPS: Group[] = [
    { id: 'g1', name: 'Design Phase', color: TASK_COLORS[17] },
    { id: 'g2', name: 'Development', color: TASK_COLORS[18] },
    { id: 'g3', name: 'Testing & QA', color: TASK_COLORS[0] },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const day = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
};

export const DUMMY_PROJECT_START_DATE = day(-5);
export const DUMMY_PROJECT_END_DATE = day(45);

export const DUMMY_CUSTOM_FIELDS: CustomField[] = [
    { id: 'cf1', name: 'Story Points', type: 'Number' },
    { id: 'cf2', name: 'Client', type: 'Text' },
    { id: 'cf3', name: 'Region', type: 'Select', options: ['NA', 'EMEA', 'APAC'] }
];

export const DUMMY_TASKS: Task[] = [
    {
        id: 't1', name: 'UI/UX Mockups', groupId: 'g1', startDate: day(0),
        endDate: day(7), assignedTo: ['p1'], color: TASK_COLORS[17],
        completion: 100, priority: Priority.High,
        notes: "### Design Requirements\n- Mobile-first approach\n- Adhere to the new style guide\n- Get feedback from stakeholders by EOD Friday.",
        dependencies: [],
        tags: ['UI', 'Design System'],
        customFieldValues: { cf1: 8, cf2: 'Project Guru Inc.', cf3: 'NA' }
    },
    {
        id: 't2', name: 'Style Guide', groupId: 'g1', startDate: day(8),
        endDate: day(12), assignedTo: ['p1', 'p2'], color: TASK_COLORS[17],
        completion: 75, priority: Priority.Medium,
        dependencies: ['t1'],
        tags: ['Design System'],
        customFieldValues: { cf1: 5, cf3: 'EMEA' }
    },
    {
        id: 't3', name: 'Frontend Setup', groupId: 'g2', startDate: day(13),
        endDate: day(16), assignedTo: ['p2', 'p3'], color: TASK_COLORS[18],
        completion: 90, priority: Priority.High,
        dependencies: ['t2'],
        tags: ['Frontend', 'React', 'Setup'],
        customFieldValues: { cf1: 5 }
    },
    {
        id: 't4', name: 'API Integration', groupId: 'g2', startDate: day(17),
        endDate: day(25), assignedTo: ['p3'], color: TASK_COLORS[18],
        completion: 40, priority: Priority.Urgent,
        dependencies: ['t3'],
        tags: ['Backend', 'API'],
        customFieldValues: { cf1: 8, cf2: 'External API Co.' }
    },
    {
        id: 't5', name: 'Component Library', groupId: 'g2', startDate: day(14),
        endDate: day(30), assignedTo: ['p2'], color: TASK_COLORS[18],
        completion: 60, priority: Priority.Medium,
        dependencies: [],
        tags: ['Frontend', 'Component'],
        customFieldValues: { cf1: 13, cf3: 'APAC' }
    },
    {
        id: 't6', name: 'Unit Testing', groupId: 'g3', startDate: day(26),
        endDate: day(35), assignedTo: ['p4'], color: TASK_COLORS[0],
        completion: 20, priority: Priority.Low,
        dependencies: ['t4'],
        tags: ['QA', 'Testing'],
        customFieldValues: { cf1: 8 }
    },
    {
        id: 't7', name: 'E2E Testing', groupId: 'g3', startDate: day(32),
        endDate: day(40), assignedTo: ['p4', 'p1'], color: TASK_COLORS[0],
        completion: 0, priority: Priority.Medium,
        dependencies: ['t5'],
        tags: ['QA', 'E2E'],
        customFieldValues: { cf1: 5, cf3: 'NA' }
    },
    {
        id: 't8', name: 'Deploy to Staging', startDate: day(41),
        endDate: day(42), assignedTo: ['p3'], color: TASK_COLORS[10],
        completion: 0,
        notes: "### Staging Deployment Checklist\n\n- [ ] Backup production database\n- [ ] Run migrations on staging DB\n- [ ] Invalidate CDN cache after deployment",
        dependencies: ['t6', 't7'],
        tags: ['Deployment', 'Ops'],
        customFieldValues: { cf1: 3 }
    },
];

export const DUMMY_NOTES: Note[] = [
    {
        id: 'note-1',
        title: 'Project Goals',
        content: '# Project Guru Goals\n\nOur main goal is to build the best project management tool ever.\n\n- Intuitive UI\n- Powerful features\n- Blazingly fast\n\nSee [[Meeting Notes 2024-07-29]] for more details.',
        tags: ['strategy', 'planning'],
        parentId: null,
        createdAt: new Date('2024-07-28T10:00:00Z'),
        updatedAt: new Date('2024-07-28T11:30:00Z'),
    },
    {
        id: 'note-2',
        title: 'Meeting Notes 2024-07-29',
        content: '## Meeting Notes\n\n### Attendees\n- Alice\n- Bob\n\n### Discussion\n- We discussed the timeline for the [[UI/UX Mockups]] task.\n- Decided on the primary theme color.\n\n> [!INFO] Action Item\n> Alice to finalize the color palette by EOD.',
        tags: ['meetings'],
        parentId: null,
        createdAt: new Date('2024-07-29T14:00:00Z'),
        updatedAt: new Date('2024-07-29T15:00:00Z'),
    },
    {
        id: 'note-3',
        title: 'Frontend Architecture',
        content: '## Frontend Architecture Plan\n\nWe will use React with TypeScript. State management will be handled with `useHistory` hook.\n\n### Key Components\n- `GanttChart`\n- `TaskSidebar`\n- `Timeline`',
        tags: ['technical', 'frontend'],
        parentId: 'note-4', // child of 'Technical Docs'
        createdAt: new Date('2024-07-25T09:00:00Z'),
        updatedAt: new Date('2024-07-25T09:00:00Z'),
    },
    {
        id: 'note-4',
        title: 'Technical Docs',
        content: 'A collection of technical documentation for the project.',
        tags: ['technical'],
        parentId: null,
        createdAt: new Date('2024-07-25T08:00:00Z'),
        updatedAt: new Date('2024-07-25T08:00:00Z'),
    }
];


export const DUMMY_ASSIGNMENTS: Assignment[] = [
    { id: 'j1', taskId: 't4', name: 'Setup auth endpoints', startDate: day(17), endDate: day(17), startTime: '10:00', endTime: '12:00', assignedTo: ['p3'], completed: true },
    { id: 'j2', taskId: 't4', name: 'Implement GET routes', startDate: day(18), endDate: day(18), startTime: '11:00', endTime: '15:00', assignedTo: ['p3'], completed: true },
    { id: 'j3', taskId: 't4', name: 'Implement POST routes', startDate: day(19), endDate: day(20), startTime: '14:00', endTime: '17:00', assignedTo: ['p3'], completed: false },
    { id: 'j4', taskId: 't5', name: 'Build Button component', startDate: day(14), endDate: day(14), startTime: '09:00', endTime: '12:00', assignedTo: ['p2'], completed: true },
    { id: 'j5', taskId: 't5', name: 'Build Modal component', startDate: day(15), endDate: day(16), startTime: '13:00', endTime: '17:00', assignedTo: ['p2'], completed: true },
    { id: 'j6', taskId: 't5', name: 'Build Form inputs', startDate: day(17), endDate: day(18), startTime: '10:00', endTime: '13:00', assignedTo: ['p2'], completed: false },
];

export const DUMMY_DESIGN_LAYOUT: DesignLayout = {
    groups: {
        'g1': { x: 50, y: 50, width: 350, height: 400 },
        'g2': { x: 450, y: 50, width: 500, height: 600 },
        'g3': { x: 1000, y: 50, width: 350, height: 400 },
    },
    tasks: {
        't1': { x: 80, y: 120 },
        't2': { x: 80, y: 220 },
        't3': { x: 480, y: 120 },
        't4': { x: 480, y: 220 },
        't5': { x: 480, y: 320 },
        't6': { x: 1030, y: 120 },
        't7': { x: 1030, y: 220 },
        't8': { x: 700, y: 700 }, // Ungrouped task
    },
};

export const EXPERIMENT_STATUS_COLORS: { [key in ExperimentStatus]: { bg: string, text: string } } = {
    [ExperimentStatus.Planning]: { bg: '#e5e7eb', text: '#4b5563' }, // gray-200, gray-600
    [ExperimentStatus.Running]: { bg: '#dbeafe', text: '#2563eb' }, // blue-200, blue-600
    [ExperimentStatus.Completed]: { bg: '#dcfce7', text: '#16a34a' }, // green-200, green-600
    [ExperimentStatus.Archived]: { bg: '#fee2e2', text: '#dc2626' }, // red-200, red-600
};
