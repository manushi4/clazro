# Platform Studio

Configuration management web application for the multi-tenant mobile app.

## Features

- 🎨 **Drag & Drop Builder** - Visual editor for tabs, screens, and widgets
- 📱 **Live Preview** - Real-time mobile device preview
- 🚀 **Publish System** - Draft/publish workflow with validation
- 📊 **Debug Console** - Full logging and debugging
- 🔄 **Version History** - Rollback to previous configurations
- 🎯 **Multi-Role Support** - Configure for Student, Teacher, Parent, Admin

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project

### Installation

```bash
cd platform-studio
npm install
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Project Structure

```
platform-studio/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── studio/             # Main studio pages
│   │   │   ├── navigation/     # Tab builder
│   │   │   ├── screens/        # Screen/widget builder
│   │   │   ├── theme/          # Theme editor
│   │   │   ├── branding/       # White-label settings
│   │   │   ├── versions/       # Version history
│   │   │   └── debug/          # Debug console
│   │   └── page.tsx            # Home redirect
│   ├── components/
│   │   ├── builder/            # Drag & drop components
│   │   └── preview/            # Device preview
│   ├── config/
│   │   ├── widgetRegistry.ts   # 60+ widget definitions
│   │   └── screenRegistry.ts   # Screen definitions
│   ├── types/                  # TypeScript types
│   ├── lib/                    # Utilities
│   └── hooks/                  # React hooks
└── ...
```

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@dnd-kit** - Drag and drop
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Supabase** - Backend

## Documentation

See `/Doc/PLATFORM_STUDIO_TECHNICAL_SPEC.md` for complete technical specification.
