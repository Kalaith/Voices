# WebHatchery Backend Standards

This document covers backend development standards for PHP projects.

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
    "respect/validation": "^2.2",
    "firebase/php-jwt": "^6.0",
    "guzzlehttp/guzzle": "^7.10"
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

### Auth0 Integration (MANDATORY)
For projects requiring authentication, Auth0 must be integrated using these standardized patterns:

#### Auth0 Service (Required)
```php
<?php
// ✅ CORRECT: Standardized Auth0Service
declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\JWK;
use GuzzleHttp\Client;

final class Auth0Service
{
    private string $domain;
    private string $audience;
    private array $jwksCache = [];
    private int $jwksCacheTime = 0;
    private int $jwksCacheDuration = 3600; // 1 hour
    
    public function __construct()
    {
        $this->domain = $_ENV['AUTH0_DOMAIN'] ?? '';
        $this->audience = $_ENV['AUTH0_AUDIENCE'] ?? '';
        
        if (empty($this->domain) || empty($this->audience)) {
            throw new \Exception('Auth0 configuration missing. Set AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables.');
        }
    }
    
    public function validateToken(string $token): array
    {
        try {
            // Get JWKS
            $jwks = $this->getJwks();
            
            // Set leeway for clock skew (5 minutes)
            JWT::$leeway = 300;
            
            // Decode and validate token
            $decoded = JWT::decode($token, JWK::parseKeySet($jwks));
            
            // Convert to array
            $payload = (array) $decoded;
            
            // Validate audience
            $tokenAudience = $payload['aud'] ?? [];
            if (is_string($tokenAudience)) {
                $tokenAudience = [$tokenAudience];
            }
            
            if (!in_array($this->audience, $tokenAudience, true)) {
                throw new \Exception('Invalid audience');
            }
            
            return $payload;
            
        } catch (\Exception $e) {
            throw new \Exception('Token validation failed: ' . $e->getMessage());
        }
    }
    
    private function getJwks(): array
    {
        // Use cached JWKS if still valid
        if ($this->jwksCache && (time() - $this->jwksCacheTime) < $this->jwksCacheDuration) {
            return $this->jwksCache;
        }
        
        $client = new Client();
        $response = $client->get("https://{$this->domain}/.well-known/jwks.json");
        
        $jwks = json_decode($response->getBody()->getContents(), true);
        
        if (!$jwks || !isset($jwks['keys'])) {
            throw new \Exception('Invalid JWKS response from Auth0');
        }
        
        // Cache the JWKS
        $this->jwksCache = $jwks;
        $this->jwksCacheTime = time();
        
        return $jwks;
    }
}
```

#### Auth0 Middleware (Required)
```php
<?php
// ✅ CORRECT: Standardized Auth0Middleware
declare(strict_types=1);

namespace App\Middleware;

use App\Services\Auth0Service;
use App\Actions\Auth0\CreateOrUpdateUserAction;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

final class Auth0Middleware implements MiddlewareInterface
{
    public function __construct(
        private readonly Auth0Service $auth0Service,
        private readonly CreateOrUpdateUserAction $createOrUpdateUserAction
    ) {}

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        // Get Authorization header
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return $this->createUnauthorizedResponse('Authorization header missing or invalid');
        }

        $token = substr($authHeader, 7); // Remove "Bearer " prefix

        try {
            // Validate the JWT token
            $payload = $this->auth0Service->validateToken($token);
            
            // Add Auth0 user info to request
            $request = $request->withAttribute('auth0_payload', $payload);
            
            // Get or create user in our database
            $user = $this->createOrUpdateUserAction->execute($payload);
            if ($user) {
                $request = $request->withAttribute('user', $user);
                $request = $request->withAttribute('user_id', $user->id);
            }

            return $handler->handle($request);

        } catch (\Exception $e) {
            error_log("Auth0 Middleware Error: " . $e->getMessage());
            return $this->createUnauthorizedResponse('Token validation failed');
        }
    }

    private function createUnauthorizedResponse(string $message = 'Unauthorized'): Response
    {
        $response = new \Slim\Psr7\Response();
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => $message,
            'error' => 'Authentication required'
        ]));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
```

#### Auth0 Actions (Required)
```php
<?php
// ✅ CORRECT: Auth0 user creation/update action
declare(strict_types=1);

namespace App\Actions\Auth0;

use App\External\UserRepository;
use App\Models\User;

final class CreateOrUpdateUserAction
{
    public function __construct(
        private readonly UserRepository $userRepository
    ) {}

    public function execute(array $auth0Payload): User
    {
        $auth0Id = $auth0Payload['sub'] ?? '';
        
        if (empty($auth0Id)) {
            throw new \InvalidArgumentException('Auth0 user ID is required');
        }

        // Try to find existing user
        $user = $this->userRepository->findByAuth0Id($auth0Id);
        
        if (!$user) {
            // Create new user
            $user = new User();
            $user->auth0_id = $auth0Id;
            $user->email = $auth0Payload['email'] ?? '';
            $user->username = $auth0Payload['nickname'] ?? explode('@', $auth0Payload['email'] ?? 'user')[0];
            $user->first_name = $auth0Payload['given_name'] ?? '';
            $user->last_name = $auth0Payload['family_name'] ?? '';
            $user->is_active = true;
            $user->created_at = new \DateTime();
            $user->updated_at = new \DateTime();
            
            $user = $this->userRepository->create($user);
            
            // Add default role if role system exists
            if (method_exists($user, 'assignRole')) {
                $user->assignRole('user');
            }
        } else {
            // Update existing user with latest Auth0 data
            $user->email = $auth0Payload['email'] ?? $user->email;
            $user->username = $auth0Payload['nickname'] ?? $user->username;
            $user->first_name = $auth0Payload['given_name'] ?? $user->first_name;
            $user->last_name = $auth0Payload['family_name'] ?? $user->last_name;
            $user->updated_at = new \DateTime();
            
            $user = $this->userRepository->update($user);
        }
        
        return $user;
    }
}
```

#### Environment Variables (Required)
```env
# Auth0 Configuration (Required for authenticated projects)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_CLIENT_ID=your-client-id
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

### Backend File Naming  
- **Classes**: PascalCase (`UserController.php`, `CreateUserAction.php`)
- **Interfaces**: PascalCase with Interface suffix (`UserRepositoryInterface.php`)
- **Traits**: PascalCase with Trait suffix (`ApiResponseTrait.php`)

## ❌ Backend Prohibitions
- ❌ Business logic in Controllers
- ❌ Direct database queries in Controllers
- ❌ Missing type declarations (`declare(strict_types=1)`)
- ❌ SQL injection vulnerabilities (use Eloquent/prepared statements)
- ❌ Missing error handling
- ❌ Custom Auth0 validation patterns (use standardized Auth0Service)
- ❌ Direct Auth0 userinfo endpoint calls in middleware
- ❌ Missing required dependencies (monolog, respect/validation, firebase/php-jwt)
- ❌ Incorrect PHP version format (use "^8.1", not ">=8.1")
- ❌ Missing composer scripts (test, cs-check, cs-fix)
- ❌ Environment variable fallbacks (fail fast on missing config)
