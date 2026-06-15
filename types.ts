
export enum AppState {
    SPLASH = 'SPLASH',
    CALENDAR = 'CALENDAR',
    MAIN = 'MAIN',
}

export enum View {
    HOME = 'Home',
    GANTT = 'Gantt',
    TASKS = 'Tasks',
    CALENDAR = 'Calendar',
    NOTES = 'Notes',
}

export enum Priority {
    Urgent = 'Urgent',
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export type CustomFieldType = 'Text' | 'Number' | 'Date' | 'Select';
export type ZoomLevel = number;

export interface Person {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface Group {
    id: string;
    name: string;
    color: string;
}

export interface Task {
    id: string;
    name: string;
    groupId?: string;
    startDate: Date;
    endDate: Date;
    assignedTo: string[];
    color: string;
    completion: number;
    priority?: Priority;
    notes?: string;
    dependencies?: string[];
    tags?: string[];
    customFieldValues?: { [fieldId: string]: any };
}

export interface Assignment {
    id: string;
    taskId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    assignedTo: string[];
    completed: boolean;
}

export interface Meeting {
    id: string;
    title: string;
    date: Date;
    startTime: string;
    endTime: string;
    attendees: string[];
    color: string;
    agenda: string;
}

export interface Job {
    id: string;
    name: string;
    meetingId: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    assignedTo: string[];
    createdAt: Date;
    completed: boolean;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export enum ExperimentStatus {
    Planning = 'Planning',
    Running = 'Running',
    Completed = 'Completed',
    Archived = 'Archived',
}

export interface ExperimentVariant {
    id: string;
    name: string;
    split: number;
}

export interface Experiment {
    id: string;
    name: string;
    hypothesis: string;
    metrics: string[];
    status: ExperimentStatus;
    variants: ExperimentVariant[];
    linkedTasks: string[];
}


export type SearchResult = 
    | { type: 'task'; data: Task }
    | { type: 'meeting'; data: Meeting }
    | { type: 'person'; data: Person }
    | { type: 'note'; data: Note }
    | { type: 'experiment'; data: Experiment };

export interface CustomField {
    id: string;
    name: string;
    type: CustomFieldType;
    options?: string[];
}

export interface DesignLayoutNode {
    x: number;
    y: number;
}
export interface DesignLayoutGroupNode extends DesignLayoutNode {
    width: number;
    height: number;
}

export interface DesignLayout {
    tasks: { [taskId: string]: DesignLayoutNode };
    groups: { [groupId: string]: DesignLayoutGroupNode };
    experiments?: { [experimentId: string]: DesignLayoutNode };
}

export interface ProjectData {
    projectStartDate: Date;
    projectEndDate: Date;
    tasks: Task[];
    groups: Group[];
    people: Person[];
    meetings: Meeting[];
    notes: Note[];
    assignments: Assignment[];
    jobs: Job[];
    experiments?: Experiment[];
    designLayout: DesignLayout;
    customFields: CustomField[];
}

export interface TypographySettings {
    fontFamily: 'Inter' | 'Lora' | 'Inconsolata';
    fontSize: number;
}
export interface ColorSettings {
    text: string;
    heading: string;
    link: string;
}
export interface NotesSettings {
    typography: TypographySettings;
    colors: {
        h1: string; h2: string; h3: string;
        strong: string; em: string;
        hashtagBg: string; hashtagText: string;
    };
    callouts: {
        info: { bg: string; border: string; text: string; };
        warning: { bg: string; border: string; text: string; };
        success: { bg: string; border: string; text: string; };
        danger: { bg: string; border: string; text: string; };
        text: { bg: string; border: string; text: string; };
    };
}

export enum WidgetType {
    MyTasks = 'MyTasks',
    UpcomingMeetings = 'UpcomingMeetings',
    ClockWeather = 'ClockWeather',
    ProjectHealth = 'ProjectHealth',
    Welcome = 'Welcome',
    ProjectTimeline = 'ProjectTimeline',
    Team = 'Team',
    NotesOverview = 'NotesOverview',
    QuickLinks = 'QuickLinks',
    PeopleHub = 'PeopleHub',
}

export interface WidgetLayout {
    i: string; // identifier
    x: number;
    y: number;
    w: number;
    h: number;
    type: WidgetType;
    config?: { [key: string]: any };
}

export interface ThemeColorShades {
    '50': string; '100': string; '200': string; '300': string; '400': string; '500': string; '600': string; '700': string; '800': string; '900': string;
}

export interface Theme {
    id: string;
    name: string;
    isCustom?: boolean;
    colors: ThemeColorShades;
}

export interface AppSettings {
    activeThemeId: string;
    themes: Theme[];
    darkMode: boolean;
    defaultTaskDuration: number;
    sidebarBg: string;
    iconColor: string;
    typography: TypographySettings;
    lightModeColors: ColorSettings;
    darkModeColors: ColorSettings;
    notesSettings: NotesSettings;
    homeScreenLayout: WidgetLayout[];
}
