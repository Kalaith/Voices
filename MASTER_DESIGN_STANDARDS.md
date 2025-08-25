# WebHatchery Game Apps - Master Design Standards

This document establishes the mandatory coding standards, architecture patterns, and best practices that ALL projects in this repository must follow.

## 🏗️ Architecture Requirements

### Mandatory Stack
- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: PHP 8.1+ with Slim Framework, Eloquent ORM
- **State Management**: Zustand with persistence
- **Testing**: PHPUnit (backend), ESLint (frontend)
- **Code Style**: PSR-12 (PHP), ESLint + Prettier (TypeScript)

### Project Structure (MANDATORY)
```
<project_name>/
├── README.md                    # Must exist with setup instructions
├── publish.ps1                  # Deployment script following standard template  
├── frontend/
│   ├── package.json            # Must include all required scripts
│   ├── vite.config.ts          # Standard Vite configuration
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── eslint.config.js        # ESLint configuration
│   ├── src/
│   │   ├── App.tsx             # Main application component
│   │   ├── main.tsx            # Application entry point
│   │   ├── components/         # Component organization
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── game/           # Game-specific components
│   │   │   └── layout/         # Layout components
│   │   ├── stores/             # Zustand stores
│   │   ├── types/              # TypeScript definitions
│   │   ├── hooks/              # Custom hooks
│   │   ├── api/                # API layer
│   │   ├── data/               # Static game data
│   │   ├── utils/              # Utility functions
│   │   └── styles/             # CSS and styling
│   └── dist/                   # Build output (gitignored)
└── backend/                    # Required for complex games
    ├── composer.json           # PHP dependencies and scripts
    ├── phpunit.xml             # Testing configuration
    ├── public/
    │   └── index.php           # Entry point
    ├── src/
    │   ├── Controllers/        # HTTP handlers (thin layer)
    │   ├── Actions/            # Business logic (Actions pattern)
    │   ├── Services/           # Complex business operations
    │   ├── Models/             # Eloquent models
    │   ├── External/           # Repository pattern
    │   ├── Routes/             # API routing
    │   ├── Middleware/         # HTTP middleware
    │   └── Utils/              # Helper utilities
    ├── tests/                  # Unit and integration tests
    ├── storage/                # Application storage
    └── vendor/                 # Composer dependencies (gitignored)
```

## 📋 Frontend Standards (React/TypeScript)

### Required Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0", 
    "typescript": "^5.0.0",
    "zustand": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^6.0.0",
    "eslint": "^9.0.0",
    "@types/react": "^18.0.0 || ^19.0.0",
    "@types/react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

### Required Scripts in package.json
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build", 
    "lint": "eslint .",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

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

### Required Configuration Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**eslint.config.js:**
```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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
    },
  },
)
```

## 🔧 Backend Standards (PHP)

### Required Dependencies (composer.json)
```json
{
  "require": {
    "php": "^8.1",
    "slim/slim": "^4.11",
    "slim/psr7": "^1.6", 
    "php-di/php-di": "^7.0",
    "illuminate/database": "^10.0",
    "vlucas/phpdotenv": "^5.5",
    "monolog/monolog": "^3.0",
    "respect/validation": "^2.2"
  },
  "require-dev": {
    "phpunit/phpunit": "^10.0",
    "squizlabs/php_codesniffer": "^3.7"
  },
  "scripts": {
    "start": "php -S localhost:8000 -t public/",
    "test": "phpunit",
    "cs-check": "phpcs --standard=PSR12 src/ tests/",
    "cs-fix": "phpcbf --standard=PSR12 src/ tests/"
  }
}
```

### Actions Pattern (MANDATORY)
```php
<?php
// ✅ CORRECT: Actions contain business logic
declare(strict_types=1);

namespace App\Actions;

use App\External\UserRepository;
use App\Models\User;

final class CreateUserAction
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function execute(string $name, string $email): User
    {
        // Validation
        if (empty($name) || empty($email)) {
            throw new \InvalidArgumentException('Name and email are required');
        }

        // Business logic
        $user = new User();
        $user->name = $name;
        $user->email = $email;
        $user->created_at = new \DateTime();

        // Persistence
        return $this->userRepository->create($user);
    }
}
```

### Controller Standards (Thin Layer)
```php
<?php
// ✅ CORRECT: Controllers are thin HTTP handlers
declare(strict_types=1);

namespace App\Controllers;

use App\Actions\CreateUserAction;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class UserController
{
    public function __construct(
        private readonly CreateUserAction $createUserAction
    ) {}

    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $data = json_decode($request->getBody()->getContents(), true);
            
            $user = $this->createUserAction->execute($data['name'], $data['email']);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $user->toArray()
            ]));
            
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]));
            
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }
}
```

### Model Standards (Eloquent)
```php
<?php
// ✅ CORRECT: Typed Eloquent models
declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class User extends Model
{
    protected $table = 'users';
    
    protected $fillable = [
        'name',
        'email',
        'level'
    ];

    protected $casts = [
        'level' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
```

### Repository Pattern (MANDATORY)
```php
<?php
// ✅ CORRECT: Repository for data access
declare(strict_types=1);

namespace App\External;

use App\Models\User;

final class UserRepository
{
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function create(User $user): User
    {
        $user->save();
        return $user;
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }
}
```

### Service Standards
```php
<?php
// ✅ CORRECT: Services for complex business logic
declare(strict_types=1);

namespace App\Services;

use App\External\UserRepository;
use App\Models\User;

final class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function calculateUserLevel(User $user): int
    {
        // Complex business logic
        return min(floor($user->experience / 1000) + 1, 100);
    }

    public function promoteUser(User $user): User
    {
        $newLevel = $this->calculateUserLevel($user);
        $user->level = $newLevel;
        
        return $this->userRepository->update($user);
    }
}
```

## 📁 File Organization Standards

### Frontend File Naming
- **Components**: PascalCase (`GameBoard.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (`useGameLogic.ts`, `useAuth.ts`)
- **Stores**: camelCase ending with 'Store' (`gameStore.ts`, `uiStore.ts`)
- **Types**: camelCase (`game.ts`, `user.ts`)
- **Utils**: camelCase (`formatters.ts`, `calculations.ts`)

### Backend File Naming  
- **Classes**: PascalCase (`UserController.php`, `CreateUserAction.php`)
- **Interfaces**: PascalCase with Interface suffix (`UserRepositoryInterface.php`)
- **Traits**: PascalCase with Trait suffix (`ApiResponseTrait.php`)

## 🧪 Testing Standards

### Backend Testing (MANDATORY)
```php
<?php
// ✅ CORRECT: PHPUnit test with proper setup
declare(strict_types=1);

namespace Tests\Actions;

use App\Actions\CreateUserAction;
use App\External\UserRepository;
use PHPUnit\Framework\TestCase;

final class CreateUserActionTest extends TestCase
{
    private CreateUserAction $action;
    private UserRepository $userRepository;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->action = new CreateUserAction($this->userRepository);
    }

    public function testExecuteCreatesUser(): void
    {
        $this->userRepository
            ->expects($this->once())
            ->method('create')
            ->willReturn(new User());

        $result = $this->action->execute('John Doe', 'john@example.com');
        
        $this->assertInstanceOf(User::class, $result);
    }
}
```

## 🚀 Deployment Standards

### Required Scripts
Every project MUST include a `publish.ps1` PowerShell script following the standard template with:
- Environment-specific builds (preview/production)
- Dependency optimization
- Asset compilation
- Error handling and validation

### Environment Configuration
- **Frontend**: `.env.preview`, `.env.production` files
- **Backend**: `.env.<environment>` files with database and API configurations
- **Security**: Never commit actual `.env` files, only `.env.example`

## 📊 Code Quality Standards

### Metrics Requirements
- **TypeScript**: Strict mode enabled, no `any` types
- **PHP**: PSR-12 compliance, strict types declared
- **Test Coverage**: Minimum 70% for backend Actions and Services
- **Linting**: Zero ESLint errors, zero PHP_CodeSniffer errors

### Documentation Requirements
- **README.md**: Setup instructions, API documentation
- **Code Comments**: Complex business logic must be documented
- **Type Definitions**: All public APIs must be fully typed

## ❌ Prohibited Patterns

### Frontend Prohibitions
- ❌ Class components (use functional components only)
- ❌ `any` types in TypeScript
- ❌ Inline styles (use Tailwind classes)
- ❌ Direct DOM manipulation (use React paradigms)
- ❌ Global variables (use proper state management)

### Backend Prohibitions
- ❌ Business logic in Controllers
- ❌ Direct database queries in Controllers
- ❌ Missing type declarations (`declare(strict_types=1)`)
- ❌ SQL injection vulnerabilities (use Eloquent/prepared statements)
- ❌ Missing error handling

## 🔄 Migration Path

Projects not meeting these standards must be refactored to comply. Priority order:
1. **Critical**: Security vulnerabilities, type safety
2. **High**: Architecture patterns (Actions, proper separation)
3. **Medium**: File organization, naming conventions
4. **Low**: Code style, documentation improvements

This document serves as the single source of truth for all development in this repository. No exceptions without explicit architectural committee approval.