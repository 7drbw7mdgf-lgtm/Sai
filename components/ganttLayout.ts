import { Task, Group, Assignment } from '../types';

export type GanttViewMode = 'day' | 'week' | 'month';

export interface GroupSpan {
    startDate: Date;
    endDate: Date;
    completion: number;
}

export type DisplayItem =
    | { type: 'task'; data: Task; hasAssignments: boolean }
    | { type: 'group'; data: Group; span: GroupSpan | null }
    | { type: 'assignment'; data: Assignment; color: string };

export interface RowLayout {
    key: string;
    item: DisplayItem;
    top: number;
    height: number;
}

export interface Dependency {
    sourceId: string;
    targetId: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
}

export interface DragPreview {
    taskId: string;
    startDate: Date;
    endDate: Date;
}

export const ROW_HEIGHT = 60;
export const GROUP_ROW_HEIGHT = 40;
export const ASSIGNMENT_ROW_HEIGHT = 40;

/** Height of the date header that sits above the rows in both the sidebar and the timeline. */
export const HEADER_HEIGHT = 56;
/** Height of the footer under both panes. Both must match so their scroll viewports are identical. */
export const FOOTER_HEIGHT = 56;
/** Blank space after the last row so it is never flush with the footer. */
export const BOTTOM_PADDING = 48;

export const rowHeightFor = (item: DisplayItem): number => {
    switch (item.type) {
        case 'task': return ROW_HEIGHT;
        case 'group': return GROUP_ROW_HEIGHT;
        case 'assignment': return ASSIGNMENT_ROW_HEIGHT;
    }
};

export const rowKeyFor = (item: DisplayItem): string => `${item.type}-${item.data.id}`;

export const layoutRows = (items: DisplayItem[]): { rows: RowLayout[]; totalHeight: number } => {
    let top = 0;
    const rows = items.map(item => {
        const height = rowHeightFor(item);
        const row = { key: rowKeyFor(item), item, top, height };
        top += height;
        return row;
    });
    return { rows, totalHeight: top };
};
