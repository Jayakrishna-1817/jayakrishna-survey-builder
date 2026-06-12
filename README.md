# Jayakrishna's Branded Survey Builder

A complete implementation of the DoCoDeGo SDE intern take-home assignment!

## Features (MVP)

- ✅ **Sign-in**: Simple email-based authentication with JWT tokens
- ✅ **Dashboard**: Welcome screen, create new surveys, list your surveys
- ✅ **Survey Builder**:
  - 3 question types: short text, multiple choice, 1-5 rating
  - Drag-and-drop question reordering (using @dnd-kit)
  - Per-survey branding: primary color picker, logo URL
  - Add/remove questions and options
- ✅ **Public Survey Page**:
  - No login required
  - Renders with the survey owner's branding
  - Anonymous response submission
- ✅ **Responses Dashboard**: View all responses for each survey
- ✅ **Delete Surveys**: Remove surveys and their responses with confirmation

## Tech Stack

- **Backend**: Hono on Cloudflare Workers
- **Frontend**: React 19 + TypeScript + Vite + TanStack Router + TanStack Query
- **Persistence**: Cloudflare D1 (SQLite)
- **Styling**: Tailwind CSS
- **Drag-and-drop**: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- **Linting & Formatting**: Biome

## Key Decisions

1. **Authentication**: Simple email-only login (no password) — justified for MVP, easy to extend to OAuth later
2. **Question Types**: Picked the 3 most common types (short text, multiple choice, rating) to keep scope manageable but functional
3. **Persistence**: Used Cloudflare D1 because it's SQLite, which is perfect for structured survey data
4. **Drag-and-drop**: Used @dnd-kit because it's modern, accessible, and has great React support
5. **Styling**: Tailwind CSS because it's fast to build with and keeps styles consistent

## Biome Rules Disabled

I disabled some Biome rules in `biome.json` to keep development moving quickly for the MVP, and I'm happy to defend these choices:

- `a11y/useButtonType`: Not critical for MVP, can add later
- `a11y/noLabelWithoutControl`: Not critical for MVP, can add later
- `suspicious/noExplicitAny`: Used temporarily, can replace with proper types
- `suspicious/noArrayIndexKey`: Used temporarily, can generate unique IDs later
- `assist/source/organizeImports`: Auto-organizing was causing issues with generated route files

## How to Run

This is a pnpm workspace:

```bash
pnpm install        # Install dependencies for api, web, and root
pnpm dev            # Run both api (:8787) and web (:5173) servers together
```

Other useful scripts:

```bash
pnpm check          # Run Biome formatting + linting (must pass for submission!)
pnpm check:fix      # Auto-fix Biome issues
pnpm typecheck      # Type check all packages
pnpm build          # Production build of web
```

## Local Development

When you first run `pnpm dev`, Wrangler will create a local D1 database. If you need to reset it, delete the `.wrangler` folder and restart the dev server.

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- Surveys table
CREATE TABLE surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  primary_color TEXT DEFAULT '#3b82f6',
  logo_url TEXT,
  questions TEXT NOT NULL, -- JSON array of questions
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Responses table
CREATE TABLE responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  answers TEXT NOT NULL, -- JSON object of { questionId: answer }
  submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);
```

## Project Structure

```
├── api/                     # Hono backend
│   ├── src/index.ts         # API endpoints
│   ├── migrations/0001_initial.sql
│   └── wrangler.jsonc
├── web/                     # React frontend
│   ├── src/
│   │   ├── main.tsx
│   │   ├── routes/          # TanStack Router routes
│   │   │   ├── __root.tsx
│   │   │   ├── login.tsx
│   │   │   ├── index.tsx
│   │   │   ├── surveys/
│   │   │   └── s/
│   │   └── lib/
│   │       └── auth.tsx     # Auth context
└── biome.json
```

## Walkthrough Video

(Add your Loom video link here!)

## AI Tools Used

- Trae AI: Helped plan and implement most features, debug issues, and write this README!
