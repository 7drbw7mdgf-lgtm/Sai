import DOMPurify from 'dompurify';

// Notes and agendas can come from calendar invites and backup files, so they are never trusted as HTML.
export const sanitizeHtml = (html: string): string => DOMPurify.sanitize(html);
