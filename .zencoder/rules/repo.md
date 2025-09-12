---
description: Repository Information Overview
alwaysApply: true
---

# VoteRight Secure Information

## Summary
VoteRight Secure is a web application for secure online voting. It provides a user-friendly interface for voters to authenticate, verify their identity, and cast votes in various elections. The application focuses on security and usability with features like session timers, multi-step verification, and vote confirmation.

## Structure
- **src/**: Main source code directory
  - **components/**: UI components organized by functionality
  - **pages/**: Application pages and routes
  - **hooks/**: Custom React hooks
  - **lib/**: Utility functions and helpers
- **public/**: Static assets and resources

## Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.8.3
**Framework**: React 18.3.1
**Build System**: Vite 5.4.19
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React (18.3.1) - UI library
- React Router DOM (6.30.1) - Routing
- Radix UI components - Accessible UI primitives
- TanStack Query (5.83.0) - Data fetching
- Lucide React (0.462.0) - Icon library
- Tailwind CSS (3.4.17) - Utility-first CSS
- Zod (3.25.76) - Schema validation
- React Hook Form (7.61.1) - Form handling

**Development Dependencies**:
- Vite (5.4.19) - Build tool
- ESLint (9.32.0) - Code linting
- TypeScript ESLint (8.38.0) - TypeScript linting
- Tailwind plugins - Typography and animations

## Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Main Components

### Authentication
- **LoginForm**: User authentication with username/password
- **VerificationSteps**: Multi-step verification process

### Voting System
- **VoterDashboard**: Main interface for viewing and participating in elections
- **VoteConfirmation**: Confirmation screen after casting a vote

### UI Components
- Comprehensive UI component library built with shadcn/ui
- Custom components for voting-specific functionality
- Responsive design with Tailwind CSS

## Application Flow
1. User logs in with credentials
2. Multi-step verification process
3. Dashboard displays available elections
4. User selects an election and candidate
5. Vote is cast and confirmation is displayed
6. Session is managed with automatic timeout

## Entry Points
- **main.tsx**: Application entry point
- **App.tsx**: Main component with routing setup
- **Index.tsx**: Primary page with application state management