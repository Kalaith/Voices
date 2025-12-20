# WebHatchery Frontend Standards

This document covers frontend development standards for React/TypeScript projects within our ecosystem, with specific focus on clean code principles and game application patterns.

## 📋 Frontend Standards (React/TypeScript)

### Core Technologies

*   **Framework**: React (latest stable version)
*   **Language**: TypeScript (latest stable version)
    *   **Rationale**: Provides static type checking, improving code quality, readability, and reducing runtime errors.
*   **Build Tool**: Vite
    *   **Rationale**: Offers extremely fast cold start times, instant hot module replacement (HMR), and optimized production builds.
*   **Styling**: Tailwind CSS
    *   **Rationale**: Utility-first CSS framework for rapid UI development, consistent design, and highly optimized CSS bundles.
*   **Animation**: Framer Motion
    *   **Rationale**: A production-ready motion library for React, enabling smooth and performant animations and transitions.
*   **Routing**: React Router DOM
    *   **Rationale**: Standard solution for declarative routing in React applications.
*   **State Management**: Zustand
    *   **Rationale**: Lightweight, performant, and easy-to-use state management solution.
*   **Server State (Optional)**: React Query
    *   **Rationale**: For applications with significant backend interaction, React Query provides robust solutions for data fetching, caching, synchronization, and error handling.

## 🚨 Critical TypeScript Export Standards

**CRITICAL LESSON LEARNED**: TypeScript `interface` declarations are stripped during Vite compilation and don't exist at runtime, causing "does not provide an export named" errors.

### Correct Export Patterns

**✅ CORRECT: Use classes for runtime exports**
```typescript
// API client exports - these survive compilation
export class ApiResponse<T = any> {
  success!: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**✅ CORRECT: Use type aliases for type-only imports**
```typescript
export type UserData = {
  id: string;
  name: string;
  email: string;
};

// Import with type-only import
import type { UserData } from './types';
import { ApiResponse } from './client'; // Class import works at runtime
```

**❌ WRONG: Interface exports that will be imported as values**
```typescript
// This will be stripped during compilation
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// This will cause runtime error:
// "The requested module does not provide an export named 'ApiResponse'"
import { ApiResponse } from './client';
```

### Debugging Runtime Import Errors

When encountering "does not provide an export named" errors:

1. **Check compiled output**: Examine DevTools Sources tab to see what actually exists at runtime
2. **Understand compilation pipeline**: Vite/TypeScript strips type-only constructs
3. **Use browser DevTools**: Verify module exports in Network tab and console
4. **Test imports directly**: Use browser console to verify what's actually exported from modules

### Export Decision Matrix

| Use Case | Export Type | Reason |
|----------|-------------|---------|
| Runtime values (API responses, error classes) | `class` | Survives compilation, available at runtime |
| Type-only definitions | `type` or `interface` | Stripped at compile time, type-only imports |
| Utility functions | `function` | Available at runtime |
| Constants | `const` | Available at runtime |
| Enums | `enum` | Available at runtime (compiled to objects) |

## 📦 Required Dependencies

### Production Dependencies
```json
{
  "dependencies": {
    "@tailwindcss/vite": "^4.1.10",
    "framer-motion": "^11.0.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.2",
    "tailwindcss": "^4.1.10",
    "zustand": "^5.0.5",
    "axios": "^1.11.0"
  }
}
```

### Optional Dependencies (Add as needed)
```json
{
  "dependencies": {
    "@auth0/auth0-react": "^2.4.0",
    "@tanstack/react-query": "^5.85.5",
    "chart.js": "^4.4.9",
    "react-use": "^17.6.0",
    "formik": "^2.4.6",
    "yup": "^1.6.1",
    "react-toastify": "^11.0.5"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@eslint/js": "^9.25.0",
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.4.1",
    "eslint": "^9.25.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "jsdom": "^25.0.1",
    "prettier": "^3.6.2",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.30.1",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
```

## 📜 Required Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "preview": "vite preview",
    "ci": "npm run lint && npm run type-check && npm run test:run && npm run build",
    "ci:quick": "npm run lint && npm run type-check && npm run test:run"
  }
}
```

**Key Scripts:**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run ci` - Full CI pipeline (lint, type-check, test, build)
- `npm run ci:quick` - Quick validation (skip build)

### Project Structure

All React frontend projects **must** adhere to the following standardized directory structure. This promotes discoverability, modularity, and consistency.

```
src/
├── api/                # (Optional) API service definitions, client instances, and related types for backend interaction.
│                       # Use this for centralized API calls, e.g., `api/auth.ts`, `api/game.ts`.
├── components/         # Reusable React components.
│   ├── ui/             # Generic, presentational UI components (e.g., Button, Modal, Input, Card).
│   │                   # These components should be highly reusable and have minimal business logic.
│   ├── game/           # Game-specific components (e.g., DragonDisplay, UpgradeCard, MinionPanel, AdventurerList).
│   │                   # These components encapsulate game-specific UI and logic.
│   └── layout/         # Components defining the overall application layout (e.g., Header, Sidebar, MainContent, Footer).
├── hooks/              # Custom React hooks for encapsulating reusable logic and stateful behavior.
│                       # (e.g., `useGameLoop`, `useOfflineEarnings`, `useAuth`, `useFormValidation`).
├── stores/             # State management definitions using Zustand.
│                       # Each file in this directory should define a single Zustand store.
│                       # (e.g., `useGameStore.ts`, `usePlayerStore.ts`, `useSettingsStore.ts`).
├── types/              # Centralized TypeScript type definitions and interfaces.
│                       # This includes interfaces for API responses, game entities, component props, and global types.
│                       # (e.g., `game.d.ts`, `api.d.ts`, `components.d.ts`).
├── data/               # Static, immutable game data or configuration files.
│                       # (e.g., `treasures.ts`, `upgrades.ts`, `achievements.ts`, `npcs.ts`).
│                       # These files should export plain JavaScript objects/arrays.
├── utils/              # Utility functions and core game logic that are not tied to React components or hooks.
│                       # (e.g., calculation functions, data transformers, helper functions).
├── assets/             # Static assets like images, icons, fonts, and other media files.
│                       # (If not served from the `public/` directory).
├── styles/             # Global CSS files, Tailwind CSS configuration, and any custom base styles.
│                       # (e.g., `index.css`, `tailwind.css`).
├── App.tsx             # The main application component.
├── main.tsx            # Entry point for the React application (ReactDOM.render).
└── vite-env.d.ts       # Vite environment type definitions.
```

#### Directory Structure & Modularity

For larger applications, organize code by feature/domain rather than technical layer to improve scalability:

*   **Feature Folders**: Group related components, hooks, stores, and types together:
    ```
    src/features/
    ├── user-profile/
    │   ├── components/
    │   ├── hooks/
    │   ├── stores/
    │   ├── types/
    │   └── index.ts
    ├── game-inventory/
    │   ├── components/
    │   ├── hooks/
    │   ├── stores/
    │   └── types/
    └── quest-system/
        ├── components/
        ├── hooks/
        ├── stores/
        └── types/
    ```
*   **Monorepo Setup**: For multi-team environments, use Yarn/NPM workspaces to create a monorepo where each feature or shared library is its own package. This allows parallel development and independent versioning.
*   **Shared Packages**: Extract common UI components and utilities into separate packages that can be published and reused across projects.

#### Shared Components & Design System

To promote consistency across multiple projects and teams:

*   **Design System**: Establish a shared component library using Storybook for documentation and testing. Publish it as an npm package or host it in a monorepo.
*   **Component Library**: Create reusable UI components (buttons, forms, modals) in a dedicated package that all projects can import.
*   **Storybook Documentation**: Document every shared component with usage examples, props, and variations.
*   **Versioning**: Use semantic versioning for the shared library to manage breaking changes.
*   **Consistency Enforcement**: Require all teams to use the shared components instead of creating duplicates.

Example shared library structure:
```
packages/ui-library/
├── src/
│   ├── components/
│   ├── stories/
│   └── index.ts
├── package.json
└── .storybook/
```

### Data Flow & Storage

*   **Static Data**: Stored in `src/data/` as TypeScript files exporting plain objects/arrays. Loaded once at application startup or as needed.
*   **Client-Side Dynamic State**: Managed exclusively by Zustand stores (`src/stores/`). This is the single source of truth for the UI.
*   **Local Storage**: Used for persisting critical game state (e.g., player progress, settings) via Zustand's `persist` middleware.
*   **API Interaction**:
    *   Centralize API calls within the `src/api/` directory.
    *   Use `fetch` API or a lightweight library like `axios` for HTTP requests.
    *   Define clear request and response types in `src/types/api.d.ts`.
    *   Handle loading, error, and success states in components, often facilitated by React Query if used.

### Component Standards
```typescript
// ✅ CORRECT: Functional component with proper typing
interface GameComponentProps {
  title: string;
  onAction: (action: string) => void;
  isActive?: boolean;
}

export const GameComponent: React.FC<GameComponentProps> = ({
  title,
  onAction,
  isActive = false
}) => {
  const [localState, setLocalState] = useState<string>('');

  const handleClick = useCallback((action: string) => {
    onAction(action);
  }, [onAction]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {/* Component content */}
    </div>
  );
};

// ❌ WRONG: Class components, any types, inline styles
```

## 🛠️ Development Workflow

*   **Linting**: ESLint with TypeScript ESLint plugin.
    *   **Configuration**: Use a consistent `.eslintrc.js` across projects.
    *   **Enforcement**: Integrate linting into pre-commit hooks or CI/CD pipelines.
*   **Code Formatting**: Prettier (recommended, but not strictly enforced by this document).
*   **Testing**: Vitest with React Testing Library.
    *   **Configuration**: Use `vitest.config.ts` for test setup.
    *   **Coverage**: Aim for comprehensive test coverage for components and hooks.
*   **Build & Serve**: Use Vite scripts (`npm run dev`, `npm run build`, `npm run preview`).

## 🔄 CI/CD Configuration (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: ./frontend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:run

      - name: Build application
        run: npm run build

      - name: Check build artifacts
        run: |
          if [ ! -d "dist" ]; then
            echo "Build failed - dist directory not found"
            exit 1
          fi
          if [ ! -f "dist/index.html" ]; then
            echo "Build failed - index.html not found"
            exit 1
          fi
          echo "Build successful - artifacts verified"
```

**Key Features:**
- ✅ Runs on PRs and pushes to main/master
- ✅ Node.js 18 LTS with dependency caching
- ✅ Full quality gate pipeline
- ✅ Build artifact verification
- ✅ Monorepo support (frontend subdirectory)

### CI/CD and Enforcement

To ensure consistency across all projects, implement the following CI/CD practices:
*   **Git Hooks**: Use Husky and lint-staged for pre-commit enforcement:
    ```bash
    npm install --save-dev husky lint-staged
    npx husky install
    npx husky add .husky/pre-commit "npx lint-staged"
    ```
    Add to `package.json`:
    ```json
    "lint-staged": {
      "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
      "*.{json,css,md}": ["prettier --write"]
    }
    ```
*   **Pre-commit Hook**: Automatically run linting, formatting, and tests before commits.

## 📦 Required Configuration Files

### 1. TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "outDir": "dist",
    "module": "ESNext",
    "target": "ES2020",
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "sourceMap": true,
    "allowJs": false,
    "declaration": true,
    "moduleResolution": "bundler",
    "forceConsistentCasingInFileNames": true,

    // Strict Type Checking
    "strict": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true,
    "noImplicitAny": true,

    // Module Resolution
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx"
  },
  "include": [
    "*.ts",
    "src/**/*.tsx",
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "rollup.config.mjs",
    "vitest.config.ts"
  ]
}
```

**Key Features:**
- ✅ Modern ES2020 target with proper DOM types
- ✅ Strictest TypeScript settings enabled
- ✅ React JSX support with new transform
- ✅ Comprehensive error catching

### 2. ESLint Configuration (`eslint.config.js`)

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', '*.config.ts', 'vitest.config.ts', 'vite.config.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Naming conventions per WebHatchery standards
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables and functions: camelCase
        {
          selector: 'variableLike',
          format: ['camelCase', 'PascalCase'], // Allow PascalCase for React components
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'], // Allow PascalCase for React components
        },
        // Types, interfaces, classes: PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        // Enum values: PascalCase
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
      ],
      // Strict TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Separate config for config files
  {
    files: ['*.config.{ts,js}', 'vitest.config.ts', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {},
  },
)
```

**Key Features:**
- ✅ WebHatchery naming conventions enforced
- ✅ Strict TypeScript rules (no `any`, no unused vars)
- ✅ React Hooks and React Refresh support
- ✅ Separate configuration for config files

### 3. Prettier Configuration (`prettier.config.js`)

```javascript
export default {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  bracketSameLine: false,
};
```

**Key Features:**
- ✅ Consistent code formatting across all files
- ✅ Single quotes for JS, double quotes for JSX
- ✅ 2-space indentation (industry standard)
- ✅ Trailing commas for cleaner diffs

### 4. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
```

### 5. Test Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom';
```

### Tooling Configuration

Provide shared configurations to ensure consistency:

*   **Shared ESLint Config**: Use the configuration above to enforce naming conventions and strict TypeScript rules.
*   **Shared Prettier Config**: Maintain consistent formatting across projects.
*   **Shared TypeScript Config**: The configuration above enables strict mode and comprehensive error checking.
*   **Automated Checks**: Use tools like `commitlint` for commit message standards and `stylelint` for CSS consistency.

### Naming Conventions

Follow these comprehensive naming rules for consistency:

*   **Components**: PascalCase (e.g., `GameBoard.tsx`, `UserProfile.tsx`)
*   **Pages**: PascalCase ending with 'Page' (e.g., `DashboardPage.tsx`)
*   **Hooks**: camelCase starting with 'use' (e.g., `useGameLogic.ts`)
*   **Stores**: camelCase ending with 'Store' (e.g., `gameStore.ts`)
*   **Types/Interfaces**: PascalCase (e.g., `GameState.ts`)
*   **Utils**: camelCase (e.g., `formatters.ts`)
*   **Constants**: UPPER_SNAKE_CASE for global constants (e.g., `MAX_LEVEL`, `API_BASE_URL`)
*   **Assets**: kebab-case for files (e.g., `dragon-icon.png`), camelCase for directories
*   **Tests**: Same name as the file being tested with `.test.tsx` suffix
*   **Enums**: PascalCase (e.g., `ItemRarity.Common`)

Enforce these rules via ESLint naming plugins and automated checks.

## 📚 Documentation Standards

*   **README.md**: Each project's `README.md` must provide a clear overview, setup instructions, and a summary of its architecture.
*   **Code Comments**: Use comments sparingly, primarily for explaining *why* a piece of code exists or for complex algorithms, rather than *what* it does.
*   **Type Definitions**: Leverage TypeScript interfaces and JSDoc comments for self-documenting code.
*   **API Documentation**: Document API endpoints and data structures clearly in the `src/api/` directory.

## 🧹 Clean Code Principles (React/TypeScript)

### 1. Meaningful Naming
```typescript
// ✅ CORRECT: Clear, descriptive names
interface UserProfileData {
  firstName: string;
  lastName: string;
  emailAddress: string;
}

const calculateUserExperiencePoints = (level: number): number => {
  return level * EXPERIENCE_MULTIPLIER;
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({ userData }) => {
  // Implementation
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({ userData }) => {
  // Implementation
};

// ❌ WRONG: Abbreviations, unclear names
interface UsrData {
  fn: string;
  ln: string;
  email: string;
}

const calc = (l: number): number => l * 100;
const UPC: React.FC = ({ data }) => { /* */ };
```

### 2. Single Responsibility Principle (SRP)
```typescript
// ✅ CORRECT: Each component has one responsibility
const UserAvatar: React.FC<{ imageUrl: string; size: 'sm' | 'md' | 'lg' }> = ({
  imageUrl,
  size
}) => (
  <img 
    src={imageUrl} 
    className={`rounded-full ${sizeClasses[size]}`}
    alt="User avatar"
  />
);

const UserName: React.FC<{ firstName: string; lastName: string }> = ({
  firstName,
  lastName
}) => (
  <span className="font-semibold">{firstName} {lastName}</span>
);

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => (
  <div className="p-4 bg-white rounded-lg shadow">
    <UserAvatar imageUrl={user.avatar} size="md" />
    <UserName firstName={user.firstName} lastName={user.lastName} />
  </div>
);

// ❌ WRONG: Single component doing everything
const UserCard: React.FC = ({ user }) => {
  // Avatar rendering logic
  // Name formatting logic  
  // Status display logic
  // Action handlers
  // API calls
  // ... (100+ lines)
};
```

### 3. Leverage TypeScript's Type System
```typescript
// ✅ CORRECT: Explicit types, no any
interface GameState {
  level: number;
  experience: number;
  gold: number;
  inventory: Item[];
}

interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  stats: ItemStats;
}

type ItemType = 'weapon' | 'armor' | 'consumable' | 'misc';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

const calculateItemValue = (item: Item): number => {
  const baseValue = getBaseValue(item.type);
  const rarityMultiplier = getRarityMultiplier(item.rarity);
  return baseValue * rarityMultiplier;
};

// ❌ WRONG: Using any, loose typing
const calcValue = (item: any): any => {
  return item.base * item.mult;
};

interface BadProps {
  data: any;
  callback: any;
}
```

### 4. Component Structure and Organization
```typescript
// ✅ CORRECT: Small, focused components
// components/game/PlayerStats.tsx
interface PlayerStatsProps {
  level: number;
  experience: number;
  nextLevelExp: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
  level,
  experience,
  nextLevelExp
}) => {
  const progressPercentage = (experience / nextLevelExp) * 100;

  return (
    <div className="player-stats">
      <div className="level">Level {level}</div>
      <div className="exp-bar">
        <div 
          className="exp-progress" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="exp-text">{experience} / {nextLevelExp} XP</div>
    </div>
  );
};

// components/game/PlayerInventory.tsx - Separate component
// components/game/PlayerActions.tsx - Separate component

// ❌ WRONG: One massive component
const PlayerPanel: React.FC = () => {
  // 200+ lines handling stats, inventory, actions, etc.
};
```

### 5. Functional Components and Hooks
```typescript
// ✅ CORRECT: Functional components with hooks
const GameTimer: React.FC<{ duration: number }> = ({ duration }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  return (
    <div className="game-timer">
      <div className="time-display">{formatTime(timeLeft)}</div>
      <button onClick={toggleTimer} className="timer-button">
        {isActive ? 'Pause' : 'Start'}
      </button>
    </div>
  );
};

// ❌ WRONG: Class components (avoid unless absolutely necessary)
class GameTimerClass extends React.Component {
  // Class implementation
}
```

### 6. Avoid Magic Numbers and Strings
```typescript
// ✅ CORRECT: Named constants
const GAME_CONFIG = {
  MAX_LEVEL: 100,
  BASE_EXPERIENCE: 1000,
  LEVEL_MULTIPLIER: 1.5,
  GOLD_PER_LEVEL: 250,
} as const;

const ITEM_RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6', 
  epic: '#8B5CF6',
  legendary: '#F59E0B',
} as const;

const calculateRequiredExperience = (level: number): number => {
  return GAME_CONFIG.BASE_EXPERIENCE * Math.pow(GAME_CONFIG.LEVEL_MULTIPLIER, level - 1);
};

const getRarityColor = (rarity: Rarity): string => {
  return ITEM_RARITY_COLORS[rarity];
};

// ❌ WRONG: Magic numbers and strings
const calcExp = (level: number): number => {
  return 1000 * Math.pow(1.5, level - 1); // What do these numbers mean?
};

const getColor = (rarity: string): string => {
  if (rarity === 'rare') return '#3B82F6'; // Hard-coded values
  // ...
};
```

### 7. Don't Repeat Yourself (DRY)
```typescript
// ✅ CORRECT: Reusable custom hook
const useGameTimer = (initialDuration: number) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setTimeLeft(initialDuration);
    setIsActive(false);
  }, [initialDuration]);

  return {
    timeLeft,
    isActive,
    start,
    pause,
    reset,
    isFinished: timeLeft === 0
  };
};

// Usage in multiple components
const QuestTimer: React.FC = () => {
  const { timeLeft, start, pause, isActive } = useGameTimer(300);
  // Component implementation
};

const CombatTimer: React.FC = () => {
  const { timeLeft, start, reset, isFinished } = useGameTimer(60);
  // Component implementation
};

// ❌ WRONG: Duplicated timer logic in multiple components
```

### 8. Error Handling
```typescript
// ✅ CORRECT: Comprehensive error handling
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

const useApiCall = <T>(apiFunction: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('API call failed:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  return { data, error, loading, execute };
};

// Error boundary for components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ❌ WRONG: No error handling
const BadComponent: React.FC = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData); // What if this fails?
  }, []);

  return <div>{data.name}</div>; // What if data is null?
};
```

### 9. Performance Optimization
```typescript
// ✅ CORRECT: Memoization for expensive calculations
const ExpensiveGameCalculation: React.FC<{ gameData: GameData }> = ({ gameData }) => {
  const complexCalculation = useMemo(() => {
    // Expensive calculation that depends on gameData
    return processComplexGameLogic(gameData);
  }, [gameData]);

  return <div>{complexCalculation.result}</div>;
};

// Memoize components that receive stable props
const PlayerCard = React.memo<PlayerCardProps>(({ player, onAction }) => {
  return (
    <div className="player-card">
      <h3>{player.name}</h3>
      <div>Level: {player.level}</div>
      <button onClick={() => onAction(player.id)}>Action</button>
    </div>
  );
});

// Memoize callback functions
const GameBoard: React.FC<{ players: Player[] }> = ({ players }) => {
  const handlePlayerAction = useCallback((playerId: string) => {
    // Action logic
  }, []);

  return (
    <div>
      {players.map(player => (
        <PlayerCard 
          key={player.id}
          player={player}
          onAction={handlePlayerAction}
        />
      ))}
    </div>
  );
};

// ❌ WRONG: No optimization, unnecessary re-renders
const SlowComponent: React.FC = ({ data }) => {
  const expensiveResult = processComplexLogic(data); // Runs every render
  
  return (
    <div>
      {items.map(item => (
        <ItemCard 
          key={item.id}
          item={item}
          onAction={() => handleAction(item.id)} // New function every render
        />
      ))}
    </div>
  );
};
```

### 10. Enhanced Testing Standards

#### Component Testing with Game Context
```typescript
// src/test/testUtils.tsx - Testing utilities with game context
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Zustand stores for testing
const createMockGameStore = (initialState = {}) => ({
  gameState: {
    level: 1,
    resources: { gold: 0, wood: 0 },
    inventory: [],
    ...initialState,
  },
  updateGame: vi.fn(),
  resetGame: vi.fn(),
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialGameState?: any;
  queryClient?: QueryClient;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialGameState, queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  }), ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0): Promise<{ data: T }> =>
  new Promise(resolve => 
    setTimeout(() => resolve({ data }), delay)
  );

export * from '@testing-library/react';
export { customRender as render };
```

#### Game Logic Testing
```typescript
// src/components/game/PlayerStats.test.tsx
import { render, screen } from '../test/testUtils';
import { PlayerStats } from './PlayerStats';

describe('PlayerStats', () => {
  const mockProps = {
    level: 5,
    experience: 1200,
    nextLevelExp: 2000,
  };

  it('displays the correct level', () => {
    render(<PlayerStats {...mockProps} />);
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(<PlayerStats {...mockProps} />);
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveStyle('width: 60%');
  });

  it('handles level progression', async () => {
    const { rerender } = render(<PlayerStats {...mockProps} />);
    
    // Simulate level up
    rerender(<PlayerStats level={6} experience={0} nextLevelExp={2500} />);
    
    expect(screen.getByText('Level 6')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveStyle('width: 0%');
  });
});
```

#### API Hook Testing
```typescript
// src/hooks/useGameApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGameApi } from './useGameApi';
import { mockApiResponse } from '../test/testUtils';

// Mock the API client
vi.mock('../api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useGameApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches game state successfully', async () => {
    const mockGameState = { level: 5, resources: { gold: 100 } };
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockGameState });

    const { result } = renderHook(() => useGameApi());
    
    await act(async () => {
      await result.current.fetchGameState();
    });

    await waitFor(() => {
      expect(result.current.gameState).toEqual(mockGameState);
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('API Error');
    vi.mocked(apiClient.get).mockRejectedValue(error);

    const { result } = renderHook(() => useGameApi());
    
    await act(async () => {
      await result.current.fetchGameState();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

#### Game Logic Unit Testing
```typescript
// src/utils/gameCalculations.test.ts
import { calculateOfflineEarnings, calculateLevelRequirement } from './gameCalculations';

describe('Game Calculations', () => {
  describe('calculateOfflineEarnings', () => {
    it('calculates basic offline earnings', () => {
      const gameState = {
        level: 5,
        baseIncome: 10,
        multipliers: { offline: 0.5 }
      };
      
      const earnings = calculateOfflineEarnings(3600000, gameState); // 1 hour
      
      expect(earnings.gold).toBe(18000); // 10 * 0.5 * 3600
      expect(earnings.totalValue).toBeGreaterThan(0);
    });

    it('caps offline earnings at maximum time', () => {
      const gameState = { level: 1, baseIncome: 1, multipliers: { offline: 1 } };
      
      const shortOffline = calculateOfflineEarnings(3600000, gameState); // 1 hour
      const longOffline = calculateOfflineEarnings(86400000, gameState); // 24 hours
      
      expect(longOffline.gold).toBeGreaterThan(shortOffline.gold);
      expect(longOffline.gold).toBeLessThanOrEqual(86400); // Max 24h earnings
    });
  });

  describe('calculateLevelRequirement', () => {
    it('follows exponential growth pattern', () => {
      expect(calculateLevelRequirement(1)).toBe(100);
      expect(calculateLevelRequirement(2)).toBe(150);
      expect(calculateLevelRequirement(10)).toBeGreaterThan(calculateLevelRequirement(5));
    });
  });
});
```

## 🔒 Security Standards

Implement these security practices to protect against common web vulnerabilities:

### XSS Prevention

*   **Avoid dangerouslySetInnerHTML**: Only use when absolutely necessary and sanitize input with DOMPurify:
    ```typescript
    import DOMPurify from 'dompurify';

    const SafeHtml: React.FC<{ html: string }> = ({ html }) => {
      const sanitizedHtml = useMemo(() => DOMPurify.sanitize(html), [html]);
      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
    };
    ```
*   **Content Security Policy (CSP)**: Implement strict CSP headers to block inline scripts and reduce XSS risk.
*   **Input Validation**: Always validate and sanitize user input before rendering.

### CSRF Mitigation

*   **CSRF Token Pattern**: For applications using cookies for auth, implement the "cookie-to-header" pattern:
    ```typescript
    // Set CSRF token in cookie (server-side)
    // Include in all state-changing requests
    const apiClient = axios.create({
      baseURL: '/api'
    });

    apiClient.interceptors.request.use((config) => {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];
      
      if (csrfToken) {
        config.headers['X-CSRF-TOKEN'] = csrfToken;
      }
      return config;
    });
    ```
*   **SameSite Cookies**: Use SameSite=Strict or SameSite=Lax for session cookies.

### Authentication/Authorization

*   **Secure Token Storage**: Store JWTs or session tokens in HttpOnly, Secure, SameSite cookies instead of localStorage.
*   **Route Protection**: Use Higher-Order Components (HOCs) or hooks to protect routes:
    ```typescript
    const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const { isAuthenticated, loading } = useAuth();

      if (loading) return <div>Loading...</div>;
      if (!isAuthenticated) return <Navigate to="/login" />;

      return <>{children}</>;
    };
    ```
*   **SSL Enforcement**: Always use HTTPS in production and redirect HTTP requests.

### Dependency Security

*   **Regular Audits**: Run `npm audit` regularly and fix vulnerabilities promptly.
*   **Dependency Scanning**: Use tools like OWASP Dependency-Check or Dependabot for automated scanning.
*   **Version Pinning**: Pin dependency versions to avoid unexpected updates with vulnerabilities.
*   **Remove Unused Packages**: Regularly audit and remove unused dependencies.

### Safe API Usage

*   **Input Validation**: Validate and sanitize all data from the backend before rendering.
*   **Error Handling**: Use try/catch for all API calls and display user-friendly error messages:
    ```typescript
    const useSafeApiCall = <T>(apiFunction: () => Promise<T>) => {
      const [data, setData] = useState<T | null>(null);
      const [error, setError] = useState<string | null>(null);

      const execute = useCallback(async () => {
        try {
          setError(null);
          const result = await apiFunction();
          // Validate result here
          setData(result);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An error occurred';
          setError(message);
          console.error('API Error:', err);
        }
      }, [apiFunction]);

      return { data, error, execute };
    };
    ```
*   **HTTPS Only**: Never make API calls over HTTP in production.
*   **Response Validation**: Check `response.ok` and handle non-2xx responses appropriately.

## 📈 Scalability Standards

Implement these practices to ensure applications can grow with increasing complexity and user base:

### Code Splitting & Lazy Loading

*   **Dynamic Imports**: Use React.lazy and Suspense for route-based and component-level code splitting:
    ```typescript
    const GamePage = lazy(() => import('./pages/GamePage'));
    const ProfilePage = lazy(() => import('./pages/ProfilePage'));

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    );
    ```
*   **Bundle Analysis**: Regularly analyze bundle sizes and split large chunks.
*   **Asset Lazy Loading**: Use lazy loading for images and other assets where possible.

### Feature Flags

*   **Runtime Toggling**: Implement a feature flag system for progressive rollouts and A/B testing:
    ```typescript
    // Simple context-based flag system
    const FeatureFlagsContext = createContext<Record<string, boolean>>({});

    const useFeatureFlag = (flag: string): boolean => {
      const flags = useContext(FeatureFlagsContext);
      return flags[flag] || false;
    };

    // Usage
    const ExperimentalFeature = () => {
      const isEnabled = useFeatureFlag('experimental-ui');
      if (!isEnabled) return null;

      return <div>New Feature</div>;
    };
    ```
*   **Third-party Libraries**: Consider LaunchDarkly, Unleash, or similar for complex flag management.

### Modular Architecture

*   **Feature Isolation**: Organize code by domain/feature as the app grows. Each feature should be self-contained with its own components, hooks, stores, and tests.
*   **Monorepo Benefits**: Use multi-package setups for large teams to enable parallel development and independent releases.
*   **API Contracts**: Define clear interfaces between features to maintain loose coupling.

### State Management at Scale

*   **Domain-Specific Stores**: Split Zustand stores by domain to avoid bloated global state:
    ```typescript
    // Instead of one massive store
    const useUserStore = create<UserState & UserActions>((set) => ({ /* user logic */ }));
    const useGameStore = create<GameState & GameActions>((set) => ({ /* game logic */ }));
    const useInventoryStore = create<InventoryState & InventoryActions>((set) => ({ /* inventory logic */ }));
    ```
*   **Store Composition**: Use multiple smaller stores that communicate via events or shared utilities rather than direct dependencies.
*   **Performance**: Implement selectors and avoid unnecessary re-renders by being selective about what state triggers updates.

### Collaboration Practices

*   **Living Documentation**: Maintain a Storybook or similar for component documentation that evolves with the codebase.
*   **Code Reviews**: Establish guidelines for reviewing new patterns or large changes.
*   **Architecture Decision Records (ADRs)**: Document important decisions and their rationales.
*   **Team Alignment**: Use tech radars or regular syncs to ensure teams follow approved patterns and libraries.

### Performance Testing & Monitoring

*   **Bundle Size Budgets**: Set performance budgets in CI to prevent bundle bloat:
    ```javascript
    // vite.config.js
    export default {
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ui: ['framer-motion', 'tailwindcss']
            }
          }
        }
      }
    };
    ```
*   **Stress Testing**: Test components with large datasets to identify scaling issues.
*   **Monitoring**: Implement error tracking (e.g., Sentry) and performance monitoring.
*   **Profiling**: Use React Profiler in staging to catch performance bottlenecks early.

### State Management Standards (Zustand)
```typescript
// ✅ CORRECT: Typed Zustand store with persistence
interface GameState {
  gold: number;
  level: number;
  upgrades: Upgrade[];
}

interface GameActions {
  addGold: (amount: number) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // State
      gold: 0,
      level: 1,
      upgrades: [],
      
      // Actions
      addGold: (amount) => set(state => ({ 
        gold: state.gold + amount 
      })),
      
      purchaseUpgrade: (upgradeId) => set(state => ({
        upgrades: [...state.upgrades, findUpgrade(upgradeId)]
      })),
      
      resetGame: () => set({ gold: 0, level: 1, upgrades: [] })
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({ 
        gold: state.gold, 
        level: state.level, 
        upgrades: state.upgrades 
      })
    }
  )
);
```

### TypeScript Standards
```typescript
// ✅ CORRECT: Strict typing, no any types
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

type UserAction = 'create' | 'update' | 'delete';

// ✅ CORRECT: Generic types where appropriate
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ❌ WRONG: any types, loose typing
const badFunction = (data: any): any => { /* ... */ };
```

### API Layer Standards
```typescript
// ✅ CORRECT: Typed API client
interface ApiClient {
  get<T>(url: string): Promise<ApiResponse<T>>;
  post<T, U>(url: string, data: U): Promise<ApiResponse<T>>;
}

class GameApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }
}
```

## 🔐 Auth0 Integration Standards

### Auth0 Setup (When Authentication Required)

For projects requiring authentication, use the standardized Auth0 React integration:

```typescript
// src/auth/Auth0Provider.tsx
import React from 'react';
import { Auth0Provider as Auth0ReactProvider } from '@auth0/auth0-react';

const Auth0Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId || !audience) {
    throw new Error('Auth0 configuration missing. Check environment variables.');
  }

  return (
    <Auth0ReactProvider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: "openid profile email"
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0ReactProvider>
  );
};

export default Auth0Provider;
```

### Auth Hooks Pattern
```typescript
// src/hooks/useAuth.ts
import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const login = useCallback(() => {
    loginWithRedirect();
  }, [loginWithRedirect]);

  const logoutUser = useCallback(() => {
    logout({ 
      logoutParams: { returnTo: window.location.origin }
    });
  }, [logout]);

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }, [getAccessTokenSilently]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: logoutUser,
    getToken,
  };
};
```

### Protected Route Component
```typescript
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <div>Please log in to access this content.</div>
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```

### Environment Variables (Required for Auth0 projects)
```env
# .env.local
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
```

## 📊 Chart.js Integration Standards

### Chart Component Pattern
```typescript
// src/components/charts/BaseChart.tsx
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BaseChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  className?: string;
}

export const BaseChart: React.FC<BaseChartProps> = ({ 
  data, 
  options, 
  className = "w-full h-64" 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...options,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, options]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
};
```

## 🎮 Game Application Implementation Patterns

### API Integration Patterns

For all game applications, follow these consistent API interaction patterns:

```typescript
// src/api/apiClient.ts - Centralized API client with error handling
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth tokens
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
          status: error.response?.status,
          code: error.code,
        };
        return Promise.reject(apiError);
      }
    );
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(endpoint);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(endpoint);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
);
```

### API Hooks with Error Handling
```typescript
// src/hooks/useApiCall.ts - Reusable API hook with error handling
import { useState, useCallback } from 'react';
import { ApiError } from '../api/apiClient';

interface UseApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export const useApiCall = <T>() => {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await apiFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const apiError = error as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
```

### Game-specific API Implementation
```typescript
// src/api/gameApi.ts - Game-specific API functions
import { apiClient } from './apiClient';

export interface GameState {
  playerId: string;
  level: number;
  resources: Record<string, number>;
  inventory: Item[];
  lastSaved: string;
}

export const gameApi = {
  getGameState: () => apiClient.get<GameState>('/api/game/state'),
  
  updateGameState: (updates: Partial<GameState>) => 
    apiClient.put<GameState>('/api/game/state', updates),
  
  saveGame: (gameState: GameState) => 
    apiClient.post<{ message: string }>('/api/game/save', gameState),
  
  loadGame: () => apiClient.get<GameState>('/api/game/load'),
};
```

### State Management Patterns

```typescript
// Game store pattern
interface GameStore {
  // State
  gameState: GameState;
  loading: boolean;
  error: string | null;

  // Actions
  initializeGame: () => Promise<void>;
  updateGame: (updates: Partial<GameState>) => void;
  resetGame: () => void;
}

const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialGameState,
  loading: false,
  error: null,

  initializeGame: async () => {
    set({ loading: true, error: null });
    try {
      const gameState = await api.get<GameState>('/api/game');
      set({ gameState, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateGame: (updates) => set((state) => ({
    gameState: { ...state.gameState, ...updates }
  })),

  resetGame: () => set({ gameState: initialGameState })
}));
```

### Component Composition Patterns

```typescript
// Reusable game component pattern
interface GamePanelProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const GamePanel: React.FC<GamePanelProps> = ({
  title,
  children,
  actions,
  className
}) => (
  <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

// Usage in game-specific components
const DragonManagement = () => (
  <GamePanel
    title="Dragon Management"
    actions={<Button onClick={addDragon}>Add Dragon</Button>}
  >
    <DragonList dragons={dragons} />
  </GamePanel>
);
```

### Enhanced Game Loop and Offline Earnings Hooks

```typescript
// src/hooks/useGameLoop.ts - Advanced game loop with performance monitoring
import { useEffect, useRef, useCallback } from 'react';

interface GameLoopConfig {
  intervalMs?: number;
  enablePerformanceMonitoring?: boolean;
  maxFrameSkip?: number;
}

export const useGameLoop = (
  updateCallback: (deltaTime: number) => void,
  config: GameLoopConfig = {}
) => {
  const {
    intervalMs = 1000,
    enablePerformanceMonitoring = false,
    maxFrameSkip = 5
  } = config;

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<number>(Date.now());
  const performanceRef = useRef<number[]>([]);

  const gameUpdate = useCallback(() => {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastUpdateRef.current;
    
    // Performance monitoring
    if (enablePerformanceMonitoring) {
      performanceRef.current.push(deltaTime);
      if (performanceRef.current.length > 100) {
        performanceRef.current.shift();
      }
    }

    // Skip frames if performance is poor
    if (deltaTime > intervalMs * maxFrameSkip) {
      console.warn(`Game loop: Skipping ${Math.floor(deltaTime / intervalMs)} frames`);
      lastUpdateRef.current = currentTime;
      return;
    }

    updateCallback(deltaTime);
    lastUpdateRef.current = currentTime;
  }, [updateCallback, intervalMs, enablePerformanceMonitoring, maxFrameSkip]);

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    intervalRef.current = setInterval(gameUpdate, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameUpdate, intervalMs]);

  const getPerformanceStats = useCallback(() => {
    if (!enablePerformanceMonitoring || performanceRef.current.length === 0) {
      return null;
    }

    const times = performanceRef.current;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { averageMs: avg, minMs: min, maxMs: max, sampleSize: times.length };
  }, [enablePerformanceMonitoring]);

  return { getPerformanceStats };
};

// Enhanced offline earnings with detailed tracking
export const useOfflineEarnings = () => {
  const { gameState, updateGame } = useGameStore();
  const [offlineEarnings, setOfflineEarnings] = useState<OfflineEarningsResult | null>(null);

  useEffect(() => {
    const calculateAndApplyOfflineEarnings = () => {
      const lastSaveTime = localStorage.getItem('lastSaveTime');
      if (!lastSaveTime) return;

      const offlineTime = Date.now() - parseInt(lastSaveTime);
      
      // Don't calculate if offline for less than 30 seconds
      if (offlineTime < 30000) return;

      const earnings = calculateOfflineEarnings(offlineTime, gameState);
      
      if (earnings.totalValue > 0) {
        setOfflineEarnings(earnings);
        updateGame({ 
          resources: { ...gameState.resources, ...earnings.resources },
          experience: gameState.experience + earnings.experience
        });
      }
    };

    calculateAndApplyOfflineEarnings();
  }, [gameState, updateGame]);

  // Auto-save on visibility change and beforeunload
  useEffect(() => {
    const saveGame = () => {
      localStorage.setItem('lastSaveTime', Date.now().toString());
      localStorage.setItem('gameState', JSON.stringify(gameState));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveGame();
      }
    };

    const handleBeforeUnload = () => {
      saveGame();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(saveGame, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(autoSaveInterval);
    };
  }, [gameState]);

  const dismissOfflineEarnings = useCallback(() => {
    setOfflineEarnings(null);
  }, []);

  return {
    offlineEarnings,
    dismissOfflineEarnings,
  };
};
```

## 🎯 Game-Specific Implementation Examples

### Adventurer Guild Pattern
```typescript
interface Adventurer {
  id: string;
  name: string;
  level: number;
  class: 'Warrior' | 'Mage' | 'Rogue';
  experience: number;
  equipment: Equipment[];
}

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  requirements: QuestRequirement[];
}

interface Guild {
  name: string;
  level: number;
  resources: {
    gold: number;
    wood: number;
    mana: number;
  };
  adventurers: Adventurer[];
  activeQuests: Quest[];
}
```

### Dragons Den Pattern
```typescript
interface Dragon {
  id: string;
  name: string;
  element: 'Fire' | 'Water' | 'Earth' | 'Air';
  level: number;
  experience: number;
  stats: DragonStats;
  abilities: Ability[];
}

interface Habitat {
  id: string;
  type: 'Mountain' | 'Forest' | 'Volcano' | 'Ocean';
  capacity: number;
  dragons: string[]; // Dragon IDs
  environment: EnvironmentModifiers;
}

interface BreedingPair {
  parent1: string;
  parent2: string;
  breedingTime: number;
  offspring?: Dragon;
}
```

### Dungeon Core Pattern
```typescript
interface DungeonTile {
  id: string;
  type: 'Floor' | 'Wall' | 'Trap' | 'SpawnPoint' | 'Treasure';
  position: { x: number; y: number };
  properties: TileProperties;
}

interface Monster {
  id: string;
  type: MonsterType;
  level: number;
  health: number;
  damage: number;
  position: { x: number; y: number };
}

interface BattleLog {
  timestamp: number;
  message: string;
  type: 'combat' | 'system' | 'loot';
}
```

## 🦧 Basic Test Template (`src/App.test.tsx`)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Your App Title')).toBeDefined();
  });
  
  it('renders main UI elements', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeDefined();
  });
});
```

## 🎯 Quality Gates

The CI pipeline enforces these quality standards:

### ❌ **Blocking Issues** (CI will fail)
- ESLint violations
- TypeScript compilation errors
- Test failures
- Build failures
- Missing build artifacts

### ⚠️ **Warnings** (CI passes but should be addressed)
- React component export warnings
- Performance anti-patterns

## 🚀 Usage Instructions

### For New Projects:
1. Copy all configuration files to your project
2. Install required dependencies: `npm install`
3. Update `App.test.tsx` with your app's actual content
4. Commit `.github/workflows/ci.yml` to enable CI/CD
5. Run `npm run ci` to verify everything works

### For Existing Projects:
1. Update configuration files one by one
2. Fix any new linting/TypeScript errors
3. Add missing dependencies
4. Update scripts in `package.json`
5. Create basic tests
6. Test with `npm run ci`

## 📋 Benefits of This Configuration

✅ **Code Quality**: Strict TypeScript + ESLint rules catch bugs early  
✅ **Consistency**: Prettier ensures uniform code formatting  
✅ **Reliability**: Comprehensive testing with Vitest + Testing Library  
✅ **Automation**: GitHub Actions CI/CD for every PR  
✅ **Performance**: Optimized Vite builds for production  
✅ **Standards**: WebHatchery naming conventions enforced  
✅ **Developer Experience**: Fast feedback with local `npm run ci`  

## 🔧 Customization

### Project-Specific Adjustments:
- **Working Directory**: Update CI workflow if not using `frontend/` subdirectory
- **Branch Names**: Adjust CI triggers for your branching strategy
- **Test Patterns**: Add more specific test files as needed
- **Build Targets**: Modify TypeScript target if different browser support needed

### Optional Enhancements:
- Add code coverage thresholds in `vitest.config.ts`
- Enable pre-commit hooks with Husky + lint-staged
- Add Storybook for component documentation
- Include bundle analysis in CI for performance monitoring

---

*This configuration template ensures all WebHatchery frontends maintain consistent quality, reliability, and developer experience standards.*

## � Implementation Guidelines Summary

### Quick Reference Checklist

- ✅ **React 19+** with functional components and hooks
- ✅ **TypeScript** with strict mode enabled
- ✅ **Vite** for build tooling and development server
- ✅ **Tailwind CSS** for utility-first styling
- ✅ **Framer Motion** for animations and transitions
- ✅ **Zustand** for state management with persistence
- ✅ **React Router DOM** for client-side routing
- ✅ **React Query** for server state management (when applicable)
- ✅ **ESLint + TypeScript ESLint** for code quality
- ✅ **Prettier** for code formatting
- ✅ **Vitest + React Testing Library** for testing
- ✅ **Centralized API layer** in `/src/api/`
- ✅ **Component composition** over inheritance
- ✅ **Custom hooks** for business logic
- ✅ **Type-safe interfaces** for all data structures
- ✅ **Constants management** for configuration
- ✅ **Clean code principles** throughout
- ✅ **CI/CD pipeline** with automated linting, testing, and building
- ✅ **Git hooks** for pre-commit enforcement
- ✅ **Feature-based directory structure** for scalability
- ✅ **Shared component library** with Storybook documentation
- ✅ **Security practices**: XSS prevention, CSRF mitigation, secure auth
- ✅ **Dependency scanning** and vulnerability management
- ✅ **Code splitting and lazy loading** for performance
- ✅ **Feature flags** for progressive rollouts
- ✅ **Modular architecture** with domain-specific stores

### Project Bootstrap Commands

```bash
# Create new React + TypeScript + Vite project
npm create vite@latest my-game-app -- --template react-ts

# Install required dependencies
npm install zustand framer-motion react-router-dom @tanstack/react-query

# Install development dependencies
npm install -D tailwindcss postcss autoprefixer @types/node
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier

# Initialize Tailwind CSS
npx tailwindcss init -p
```

## �📁 File Organization Standards

### Frontend File Naming
- **Components**: PascalCase (`GameBoard.tsx`, `UserProfile.tsx`)
- **Pages**: PascalCase ending with 'Page' (`DashboardPage.tsx`, `GamePage.tsx`)
- **Hooks**: camelCase starting with 'use' (`useGameLogic.ts`, `useAuth.ts`)
- **Stores**: camelCase ending with 'Store' (`gameStore.ts`, `uiStore.ts`)
- **Types**: camelCase (`game.ts`, `user.ts`)
- **Utils**: camelCase (`formatters.ts`, `calculations.ts`)
- **Constants**: camelCase (`gameConfig.ts`, `apiEndpoints.ts`)

## 🔧 Environment Variable Standards

### Environment Configuration Pattern
```typescript
// src/config/env.ts - Centralized environment configuration
interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'production' | 'preview';
  auth0?: {
    domain: string;
    clientId: string;
    audience: string;
  };
  features: {
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    enableOfflineMode: boolean;
  };
}

const validateEnvironment = (): EnvironmentConfig => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required');
  }

  // Auth0 configuration (optional)
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  const auth0Config = auth0Domain && auth0ClientId && auth0Audience 
    ? { domain: auth0Domain, clientId: auth0ClientId, audience: auth0Audience }
    : undefined;

  return {
    apiBaseUrl,
    environment: environment as EnvironmentConfig['environment'],
    auth0: auth0Config,
    features: {
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableDebugMode: import.meta.env.VITE_DEBUG_MODE === 'true' || environment === 'development',
      enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
    },
  };
};

export const env = validateEnvironment();

// Type-safe environment variable access
export const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
};
```

### Environment Files Structure
```bash
# .env (default/fallback values)
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:8000
VITE_DEBUG_MODE=true

# .env.local (local development - git ignored)
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH0_DOMAIN=dev-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-dev-client-id
VITE_AUTH0_AUDIENCE=your-dev-audience

# .env.preview (preview/staging)
VITE_ENVIRONMENT=preview
VITE_API_BASE_URL=https://staging-api.webhatchery.com
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=true

# .env.production (production)
VITE_ENVIRONMENT=production
VITE_API_BASE_URL=https://api.webhatchery.com
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG_MODE=false
VITE_ENABLE_OFFLINE_MODE=true
```

### Environment Variable Usage
```typescript
// ✅ CORRECT: Using centralized config
import { env } from '../config/env';

const apiClient = new ApiClient(env.apiBaseUrl);

if (env.features.enableDebugMode) {
  console.log('Debug mode enabled');
}

// ✅ CORRECT: Runtime environment checks
const isDevelopment = env.environment === 'development';
const isProduction = env.environment === 'production';

// ❌ WRONG: Direct environment variable access throughout codebase
const apiUrl = import.meta.env.VITE_API_BASE_URL; // Use env.apiBaseUrl instead

// ❌ WRONG: No validation or fallbacks
const config = {
  api: import.meta.env.VITE_API_URL, // Could be undefined
};
```

## ❌ Frontend Prohibitions

#### Architecture Violations
- ❌ Class components (use functional components only)
- ❌ Business logic in App.tsx (only routing and providers)
- ❌ Missing standardized project structure
- ❌ Massive components (>100 lines - break into smaller components)
- ❌ Direct DOM manipulation (use React paradigms)
- ❌ Not using Zustand for state management
- ❌ Mixing static data with dynamic state

#### Clean Code Violations
- ❌ `any` types in TypeScript (always use explicit types)
- ❌ Magic numbers and strings (use named constants)
- ❌ Abbreviated variable names (use descriptive names)
- ❌ Single-letter variables (except for obvious iterators)
- ❌ Functions with >5 parameters (use objects or break down)
- ❌ Nested ternary operators (use proper if/else or early returns)
- ❌ Deep nesting (>3 levels - extract functions/components)
- ❌ Not using custom hooks for reusable logic
- ❌ Inline styles (use Tailwind classes)

#### Game Development Violations
- ❌ Not using TypeScript interfaces for game entities
- ❌ Missing game state persistence with Zustand
- ❌ Direct localStorage manipulation (use Zustand persist)
- ❌ Not centralizing API calls in `/src/api/`
- ❌ Mixing game logic with UI components
- ❌ Not using Framer Motion for animations
- ❌ Missing error boundaries for game components
- ❌ Not implementing offline earnings calculations properly

#### Performance and Maintenance Violations
- ❌ Inline styles (use Tailwind classes or CSS modules)
- ❌ Global variables (use proper state management)
- ❌ Inline object/array creation in render (use useMemo/useCallback)
- ❌ Missing error boundaries for component trees
- ❌ No loading states for async operations
- ❌ Duplicated code without abstraction
- ❌ Missing TypeScript strict mode
- ❌ Unused imports or variables
- ❌ Console.log statements in production code
- ❌ Not using React.memo for expensive components
- ❌ Missing dependency arrays in useEffect/useCallback

#### Security Violations
- ❌ Using `dangerouslySetInnerHTML` without sanitization
- ❌ Storing sensitive tokens in localStorage (use HttpOnly cookies)
- ❌ Making API calls over HTTP in production
- ❌ Missing input validation and sanitization
- ❌ Not implementing CSRF protection for state-changing requests
- ❌ Hard-coding secrets or sensitive environment variables in client bundles
- ❌ Ignoring dependency vulnerabilities (npm audit warnings)
- ❌ Not validating API responses before rendering

#### Environment and Configuration Violations
- ❌ Direct `import.meta.env` usage throughout codebase (use centralized config)
- ❌ Missing environment variable validation on app startup
- ❌ No fallback values or error handling for missing env vars
- ❌ Mixing different environment variable naming conventions
- ❌ Not using type-safe environment configuration

#### Testing Violations
- ❌ No tests for game logic and calculations
- ❌ Missing test setup files or utilities
- ❌ Not mocking API calls in tests
- ❌ Tests without proper cleanup (timers, event listeners)
- ❌ Not testing error states and edge cases
- ❌ Missing integration tests for critical user flows

#### Auth0 Integration Violations  
- ❌ Implementing custom Auth0 token handling (use @auth0/auth0-react)
- ❌ Not using protected route components
- ❌ Missing error handling for Auth0 failures
- ❌ Storing Auth0 tokens in localStorage
- ❌ Not implementing proper logout flows

#### Scalability Violations
- ❌ Not implementing code splitting for large applications
- ❌ Single massive bundle without lazy loading
- ❌ Global state stores that bloat with unrelated data
- ❌ Deep coupling between features/modules
- ❌ Missing feature flags for experimental features
- ❌ Not monitoring bundle sizes or performance metrics
- ❌ Ignoring performance budgets in CI/CD
