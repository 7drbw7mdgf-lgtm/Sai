import React from 'react';
import { Note, Person, Task } from '../types';

interface MarkdownRendererProps {
    content: string;
    notes: Note[];
    tasks: Task[];
    people: Person[];
    onNoteLinkClick: (noteTitle: string) => void;
    onTaskLinkClick: (taskName: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, notes, tasks, people, onNoteLinkClick, onTaskLinkClick }) => {
    const parseMarkdown = (text: string) => {
        // If content is just empty space, return a non-breaking space to maintain line height
        if (text.trim() === '') {
            return '&nbsp;';
        }
        
        let html = text;

        // Basic Markdown - Order is important for custom rules
        html = html
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/__([^_]+)__/g, '<em>$1</em>') // Italics with double underscore
            .replace(/_([^_]+)_/g, '<strong>$1</strong>') // Bold with single underscore
            .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/<\/ul>\n<ul>/g, ''); // Merge consecutive lists

        // Task links: [[task:Task Name]]
        html = html.replace(/\[\[task:(.*?)\]\]/g, (match, taskName) => {
            const targetTask = tasks.find(t => t.name.toLowerCase() === taskName.toLowerCase());
            if (targetTask) {
                return `<a href="#" data-task-name="${taskName}" class="text-[var(--text-color-link)] font-semibold hover:underline">${taskName}</a>`;
            }
            return `<span class="text-red-500 font-semibold">${taskName}</span>`;
        });
        
        // Inter-note links: [[Note Title]] (must run after task links)
        html = html.replace(/\[\[(.*?)\]\]/g, (match, noteTitle) => {
            const targetNote = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
            if (targetNote) {
                return `<a href="#" data-note-title="${noteTitle}" class="text-[var(--text-color-link)] font-semibold hover:underline">${noteTitle}</a>`;
            }
            return `<span class="text-red-500 font-semibold">${noteTitle}</span>`;
        });
        
        // Hashtags: #tag
        html = html.replace(/#(\w+)/g, `<span class="hashtag">#$1</span>`);

        // Mentions: @Username
        html = html.replace(/@(\w+)/g, (match, username) => {
            const person = people.find(p => p.name.toLowerCase() === username.toLowerCase());
            if (person) {
                return `<span class="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-medium text-sm"><img src="${person.avatarUrl}" class="w-5 h-5 rounded-full"/>${person.name}</span>`;
            }
            return match;
        });
        
        // Images: ![alt](data:...)
        html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" class="max-w-full h-auto rounded-lg my-4" />');
        
        // Callouts: > [!TYPE] Title
        html = html.replace(/> \[!(.*?)\] (.*?)\n((> .*\n?)*)/g, (match, type, title, calloutContent) => {
            const innerContent = calloutContent.replace(/> /g, '').replace(/>/g, '');
            const typeLower = type.toLowerCase();
            return `<div class="callout ${typeLower}">
                        <div class="callout-title">${title}</div>
                        <div class="callout-content"><p>${innerContent}</p></div>
                    </div>`;
        });

        // Convert newlines to paragraphs only if there are paragraph breaks
        if (html.includes('\n\n')) {
             html = html.split('\n\n').map(paragraph => {
                if (paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<div class="callout"') || paragraph.startsWith('<span')) {
                    return paragraph;
                }
                return paragraph ? `<p>${paragraph.replace(/\n/g, '<br/>')}</p>` : '';
            }).join('');
        }

        return html;
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target.hasAttribute('data-note-title')) {
            e.preventDefault();
            onNoteLinkClick(target.getAttribute('data-note-title')!);
        }
        if (target.tagName === 'A' && target.hasAttribute('data-task-name')) {
            e.preventDefault();
            onTaskLinkClick(target.getAttribute('data-task-name')!);
        }
    };
    
    const renderedHtml = parseMarkdown(content);

    return (
        <div
            className="prose dark:prose-invert max-w-none notes-prose"
            onClick={handleClick}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
    );
};

export default MarkdownRenderer;