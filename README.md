<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Labtrail

Labtrail (formerly *Benchline*, *Sai* and *Project Guru*) is a research project planner: a Gantt roadmap with dependencies, Kanban board, list, calendar with Google/Outlook sync, meetings, notes, experiments and an AI assistant.

## Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c9346899-ec17-4a3b-97ed-f287606f3b7e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Saving

Projects save automatically in this browser. Clearing browser data for this site removes them, and they don't move between browsers or computers. Use **File > Download Backup** to save a copy as a file and **File > Restore Backup** to load one back.

## Calendar sync setup

Settings > Calendar sync signs in directly with Google and Microsoft from the browser. Each one needs a free app registration in your own account. Add the IDs to `.env.local` (see `.env.local.example`) and restart the dev server.

Use the exact address you open Labtrail at. `localhost` and `127.0.0.1` count as different addresses.

**Google Calendar**

1. In the [Google Cloud console](https://console.cloud.google.com/), create or choose a project and enable the **Google Calendar API**.
2. Set up the OAuth consent screen. While it's in testing, add your own Google address as a test user.
3. Add these scopes: `calendar.app.created`, `calendar.events.readonly`, `calendar.calendarlist.readonly`.
4. Create an OAuth client ID of type **Web application** and add `http://localhost:3100` under **Authorized JavaScript origins**.
5. Copy the client ID into `GOOGLE_CALENDAR_CLIENT_ID`.

**Microsoft Outlook**

1. In the [Microsoft Entra admin center](https://entra.microsoft.com/), go to **App registrations** and create a new registration.
2. Under supported account types, choose personal Microsoft accounts plus accounts in any organization.
3. Add a redirect URI of type **Single-page application**: `http://localhost:3100/oauth-callback.html`.
4. Copy the **Application (client) ID** into `MICROSOFT_CALENDAR_CLIENT_ID`.

Some work or university accounts need an administrator's approval before they can connect.

**How sync behaves**

- Tasks, assignments and meetings go to a calendar named "Labtrail". Your main calendar is only read, and its events appear in Labtrail's Calendar view.
- If you edit an item in both places between syncs, the Labtrail version wins.
- Deleting something on one side doesn't delete it on the other.
- Sign-ins are kept in memory, so reloading the page means connecting again. Google sign-ins last about an hour and Microsoft's up to 24 hours.

