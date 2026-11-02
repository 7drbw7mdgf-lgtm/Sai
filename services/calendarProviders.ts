/**
 * Google Calendar and Microsoft Graph access directly from the browser.
 * Tokens are held in memory only, so closing or reloading the page signs the user out.
 */

import { CalendarAuthExpiredError, CalendarProvider, EventInput, RemoteEvent } from './calendarEngine';

const LABTRAIL_CALENDAR_NAME = 'Labtrail';

const toDateOnly = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDateOnly = (value: string): Date => {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
};

async function callApi(url: string, token: string, init: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init.body ? { 'Content-Type': 'application/json' } : {}),
            ...(init.headers || {}),
        },
    });
    if (response.status === 401) throw new CalendarAuthExpiredError('Calendar sign-in has expired.');
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message || `Calendar request failed (HTTP ${response.status}).`);
    }
    return response.status === 204 ? null : response.json();
}

// --- Google ---

const GOOGLE_API = 'https://www.googleapis.com/calendar/v3';
// Writes are limited to calendars this app created; everything else is read-only.
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.app.created',
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
].join(' ');

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleIdentity = (): Promise<void> => {
    if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
    if (!googleScriptPromise) {
        googleScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => {
                googleScriptPromise = null;
                reject(new Error('Could not load Google sign-in.'));
            };
            document.head.appendChild(script);
        });
    }
    return googleScriptPromise;
};

const googleEventToRemote = (event: any): RemoteEvent => {
    const allDay = !!event.start?.date;
    return {
        id: event.id,
        title: event.summary || '(No title)',
        start: allDay ? parseDateOnly(event.start.date) : new Date(event.start.dateTime),
        end: allDay ? parseDateOnly(event.end.date) : new Date(event.end.dateTime),
        allDay,
        description: event.description || '',
        location: event.location,
        updated: event.updated,
    };
};

const googleEventBody = (input: EventInput) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
        summary: input.title,
        description: input.description,
        location: input.location,
        start: input.allDay ? { date: toDateOnly(input.start) } : { dateTime: input.start.toISOString(), timeZone },
        end: input.allDay ? { date: toDateOnly(input.end) } : { dateTime: input.end.toISOString(), timeZone },
    };
};

export function createGoogleProvider(clientId: string): CalendarProvider {
    let token: string | null = null;

    const requireToken = (): string => {
        if (!token) throw new CalendarAuthExpiredError('Connect Google Calendar first.');
        return token;
    };
    const api = (path: string, init?: RequestInit) => callApi(`${GOOGLE_API}${path}`, requireToken(), init);

    const listCalendars = async (): Promise<any[]> => {
        const calendars: any[] = [];
        let pageToken = '';
        do {
            const page = await api(`/users/me/calendarList?maxResults=250${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
            calendars.push(...(page.items || []));
            pageToken = page.nextPageToken || '';
        } while (pageToken);
        return calendars;
    };

    return {
        id: 'google',
        label: 'Google Calendar',
        isConfigured: () => !!clientId,

        async signIn() {
            await loadGoogleIdentity();
            token = await new Promise<string>((resolve, reject) => {
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: GOOGLE_SCOPES,
                    callback: (response: any) => response.access_token
                        ? resolve(response.access_token)
                        : reject(new Error(response.error_description || response.error || 'Google sign-in failed.')),
                    error_callback: (error: any) => reject(new Error(error?.type === 'popup_closed' ? 'Google sign-in was closed.' : (error?.message || 'Google sign-in failed.'))),
                });
                client.requestAccessToken({ prompt: '' });
            });
            const primary = (await listCalendars()).find(c => c.primary);
            return primary?.id || 'Google account';
        },

        signOut() {
            if (token) (window as any).google?.accounts?.oauth2?.revoke?.(token, () => {});
            token = null;
        },

        async ensureLabtrailCalendar(knownId) {
            const calendars = await listCalendars();
            const existing = calendars.find(c => c.id === knownId) || calendars.find(c => c.summary === LABTRAIL_CALENDAR_NAME && c.accessRole === 'owner');
            if (existing) return existing.id;
            const created = await api('/calendars', { method: 'POST', body: JSON.stringify({ summary: LABTRAIL_CALENDAR_NAME }) });
            return created.id;
        },

        async listEvents(calendarId, range) {
            const events: RemoteEvent[] = [];
            let pageToken = '';
            do {
                const params = new URLSearchParams({ maxResults: '250', singleEvents: 'true' });
                if (range) {
                    params.set('timeMin', range.from.toISOString());
                    params.set('timeMax', range.to.toISOString());
                }
                if (pageToken) params.set('pageToken', pageToken);
                const page = await api(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
                events.push(...(page.items || []).filter((e: any) => e.status !== 'cancelled').map(googleEventToRemote));
                pageToken = page.nextPageToken || '';
            } while (pageToken);
            return events;
        },

        async createEvent(calendarId, input) {
            return googleEventToRemote(await api(`/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: JSON.stringify(googleEventBody(input)) }));
        },

        async updateEvent(calendarId, eventId, input) {
            return googleEventToRemote(await api(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: JSON.stringify(googleEventBody(input)) }));
        },
    };
}

// --- Microsoft ---

const GRAPH_API = 'https://graph.microsoft.com/v1.0';
const MICROSOFT_AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const MICROSOFT_SCOPES = 'offline_access User.Read Calendars.ReadWrite';
const OAUTH_CHANNEL = 'labtrail-oauth';
const SIGN_IN_TIMEOUT_MS = 5 * 60 * 1000;

const base64Url = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const randomString = (): string => base64Url(crypto.getRandomValues(new Uint8Array(32)));

const microsoftEventToRemote = (event: any): RemoteEvent => {
    const allDay = !!event.isAllDay;
    const readTime = (value: any) => allDay
        ? parseDateOnly(value.dateTime)
        : new Date(`${String(value.dateTime).replace(/\.\d+$/, '')}Z`); // Requested as UTC below
    return {
        id: event.id,
        title: event.subject || '(No title)',
        start: readTime(event.start),
        end: readTime(event.end),
        allDay,
        description: event.body?.content || '',
        location: event.location?.displayName || undefined,
        updated: event.lastModifiedDateTime,
    };
};

const microsoftEventBody = (input: EventInput) => {
    const write = (date: Date) => ({
        dateTime: input.allDay ? `${toDateOnly(date)}T00:00:00` : date.toISOString().slice(0, 19),
        timeZone: 'UTC',
    });
    return {
        subject: input.title,
        isAllDay: input.allDay,
        body: { contentType: 'text', content: input.description },
        location: { displayName: input.location || '' },
        start: write(input.start),
        end: write(input.end),
    };
};

export function createMicrosoftProvider(clientId: string): CalendarProvider {
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    let expiresAt = 0;

    const redirectUri = () => new URL('oauth-callback.html', document.baseURI).href;

    const requestToken = async (params: Record<string, string>) => {
        const response = await fetch(`${MICROSOFT_AUTHORITY}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, scope: MICROSOFT_SCOPES, ...params }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.access_token) {
            throw new Error(body.error_description?.split('\n')[0] || 'Microsoft sign-in failed.');
        }
        accessToken = body.access_token;
        refreshToken = body.refresh_token || refreshToken;
        expiresAt = Date.now() + (Number(body.expires_in) || 3600) * 1000;
    };

    const currentToken = async (): Promise<string> => {
        if (accessToken && Date.now() < expiresAt - 60_000) return accessToken;
        if (!refreshToken) throw new CalendarAuthExpiredError('Connect Microsoft Outlook first.');
        try {
            await requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken });
        } catch {
            accessToken = refreshToken = null;
            throw new CalendarAuthExpiredError('Microsoft sign-in has expired.');
        }
        return accessToken!;
    };

    const api = async (path: string, init: RequestInit = {}) => callApi(path.startsWith('http') ? path : `${GRAPH_API}${path}`, await currentToken(), {
        ...init,
        headers: { Prefer: 'outlook.timezone="UTC", outlook.body-content-type="text"', ...(init.headers || {}) },
    });

    return {
        id: 'outlook',
        label: 'Microsoft Outlook',
        isConfigured: () => !!clientId,

        async signIn() {
            // Opened before any await so the browser treats it as part of the click.
            const popup = window.open('', 'labtrail-microsoft-sign-in', 'width=520,height=680');
            if (!popup) throw new Error('Allow pop-ups for this page, then try again.');

            const state = randomString();
            const verifier = randomString();
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
            popup.location.href = `${MICROSOFT_AUTHORITY}/authorize?${new URLSearchParams({
                client_id: clientId,
                response_type: 'code',
                redirect_uri: redirectUri(),
                response_mode: 'query',
                scope: MICROSOFT_SCOPES,
                state,
                code_challenge: base64Url(new Uint8Array(digest)),
                code_challenge_method: 'S256',
                prompt: 'select_account',
            })}`;

            const code = await new Promise<string>((resolve, reject) => {
                const channel = new BroadcastChannel(OAUTH_CHANNEL);
                let closedAt = 0;
                const finish = (settle: () => void) => {
                    channel.close();
                    window.clearInterval(watcher);
                    window.clearTimeout(timeout);
                    settle();
                };
                channel.onmessage = event => {
                    const params = new URLSearchParams(String(event.data || ''));
                    if (params.get('state') !== state) return;
                    const receivedCode = params.get('code');
                    if (receivedCode) finish(() => resolve(receivedCode));
                    else finish(() => reject(new Error(params.get('error_description')?.split('\n')[0] || 'Microsoft sign-in failed.')));
                };
                // A little grace, because the result can arrive just as the window closes.
                const watcher = window.setInterval(() => {
                    if (!popup.closed) return;
                    if (!closedAt) closedAt = Date.now();
                    else if (Date.now() - closedAt > 1500) finish(() => reject(new Error('Microsoft sign-in was closed.')));
                }, 500);
                const timeout = window.setTimeout(() => finish(() => reject(new Error('Microsoft sign-in timed out.'))), SIGN_IN_TIMEOUT_MS);
            });

            await requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: verifier });
            const me = await api('/me?$select=displayName,mail,userPrincipalName');
            return me.mail || me.userPrincipalName || me.displayName || 'Microsoft account';
        },

        signOut() {
            accessToken = refreshToken = null;
            expiresAt = 0;
        },

        async ensureLabtrailCalendar(knownId) {
            const calendars: any[] = [];
            let next: string | null = '/me/calendars?$select=id,name,canEdit&$top=100';
            while (next) {
                const page: any = await api(next);
                calendars.push(...(page.value || []));
                next = page['@odata.nextLink'] || null;
            }
            const existing = calendars.find(c => c.id === knownId) || calendars.find(c => c.name === LABTRAIL_CALENDAR_NAME && c.canEdit);
            if (existing) return existing.id;
            const created = await api('/me/calendars', { method: 'POST', body: JSON.stringify({ name: LABTRAIL_CALENDAR_NAME }) });
            return created.id;
        },

        async listEvents(calendarId, range) {
            const root = calendarId === 'primary' ? '/me/calendar' : `/me/calendars/${encodeURIComponent(calendarId)}`;
            const select = '$select=id,subject,start,end,isAllDay,body,location,lastModifiedDateTime,isCancelled&$top=100';
            let next: string | null = range
                ? `${root}/calendarView?startDateTime=${encodeURIComponent(range.from.toISOString())}&endDateTime=${encodeURIComponent(range.to.toISOString())}&${select}`
                : `${root}/events?${select}`;
            const events: RemoteEvent[] = [];
            while (next) {
                const page: any = await api(next);
                events.push(...(page.value || []).filter((e: any) => !e.isCancelled).map(microsoftEventToRemote));
                next = page['@odata.nextLink'] || null;
            }
            return events;
        },

        async createEvent(calendarId, input) {
            return microsoftEventToRemote(await api(`/me/calendars/${encodeURIComponent(calendarId)}/events`, { method: 'POST', body: JSON.stringify(microsoftEventBody(input)) }));
        },

        async updateEvent(_calendarId, eventId, input) {
            return microsoftEventToRemote(await api(`/me/events/${encodeURIComponent(eventId)}`, { method: 'PATCH', body: JSON.stringify(microsoftEventBody(input)) }));
        },
    };
}
