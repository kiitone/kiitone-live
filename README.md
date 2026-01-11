# KIIT ONE - Vibe Update

## Overview
This update introduces "Vibe", a Gen-Z focused social layer for the KIIT ONE platform. It integrates anonymous confessions, a student directory with rich profiles, and a safety-first messaging system.

## Files Changed/Added
1.  **`index.html`**: Updated Sidebar to include the "Vibe" entry point.
2.  **`vibe.html`**: NEW FILE. The main container for the Vibe ecosystem (Confessions, People, Messages).
3.  **`style.css`**: Added styles for the Feed, Directory Grid, Chat Interface, and Profile Cards.
4.  **`vibe.js`**: NEW FILE. Handles tab switching, mock data generation, search filtering, and messaging logic.
5.  **`schema.sql`**: NEW FILE. Database schema for users, posts, and messages.

## Key Features
- **Confessions Feed**: Infinite scroll style anonymous posts.
- **Directory**: Searchable student list with badges and skills.
- **Smart Messaging**: Implements "Common Ground" checks. DMs are locked unless users share a context (Club, Branch, etc.) or accept a request.
- **Gamified Profiles**: XP, Levels, and Skill Radars.

## Testing
1.  Open `index.html` and click "Vibe" in the sidebar.
2.  Navigate tabs: Confessions -> People -> Messages.
3.  In "People", search for "ML" or "Designer".
4.  Click "Message" on a user to see the Safety Lock logic.