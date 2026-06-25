# PocketRemit API
 
A production-grade cross-border money transfer API built with Node.js, TypeScript, Express, PostgreSQL, TypeORM, Redis, and Jest.
 
PocketRemit allows users to register, hold multi-currency wallets, look up bank accounts, and send money — domestically or internationally — through two mock bank providers. Every architectural pattern in this project exists, at larger scale, in a real production fintech system.
 
---
 
## Tech Stack
 
- **Runtime** — Node.js
- **Language** — TypeScript
- **Framework** — Express.js
- **Database** — PostgreSQL (via TypeORM)
- **Cache** — Redis
- **Authentication** — JWT (JSON Web Tokens)
- **Validation** — class-validator + class-transformer
- **Logging** — Winston
- **Testing** — Jest + Supertest
---
 
## Getting Started
 
### Prerequisites
 
- Node.js v20+
- Docker Desktop (for PostgreSQL and Redis)
### Installation
 
```bash
# Clone the repository
git clone https://github.com/AY4LIFE/pocket-remit_api.git
cd pocket-remit_api
 
# Install dependencies
npm install
 
# Copy the environment variables template
cp .env.example .env
# Fill in your own values in .env
 
# Start the databases
docker compose up -d
 
# Build the project
npm run build
 
# Start the server
npm start
```
 
### Development Mode
 
```bash
npm run dev
```
 
### Running Tests
 
```bash
npm test
```
 
---
 
## Environment Variables
 
See `.env.example` for all required variables:
 
```
POSTGRES_HOST=localhost
POSTGRES_USER=your_db_username
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=your_db_name
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_long_random_secret_key_here
PORT=3000
```
 
---
 
## API Endpoints
 
### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/register | None | Create a new account |
| POST | /auth/login | None | Login and receive JWT |
| GET | /auth/me | JWT | Get current user profile |
 
### Wallets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /wallets | JWT | List all my wallets |
| POST | /wallets | JWT | Create a wallet for a currency |
| GET | /wallets/:id/balance | JWT | Get wallet balance |
 
### Transfers
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /transfers | JWT | Initiate a transfer |
| GET | /transfers | JWT | Get transaction history (paginated) |
| GET | /transfers/:id | JWT | Get single transaction receipt |
| GET | /transfers/:id/status | JWT | Re-check transfer status |
 
### FX Rates
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | /fx/rate?from=NGN&to=USD | JWT | Get exchange rate |
| GET | /fx/convert?from=NGN&to=USD&amount=5000 | JWT | Convert an amount |
 
---
 
## Project Structure
 
```
src/
├── config/          # Database and Redis connection
├── controllers/     # HTTP layer — parse request, call service, return response
├── services/        # Business logic
├── repositories/    # All DB queries live here, nowhere else
├── providers/       # Bank provider implementations
│   ├── base.provider.ts
│   ├── localbank.provider.ts
│   ├── globalbank.provider.ts
│   └── provider.router.ts
├── models/          # TypeORM entities
├── dto/             # Input shapes and validation rules
├── middlewares/     # Auth, validation, request logging
├── utils/           # Logger, error classes, response helpers
└── routes/          # Express route definitions
 
tests/
├── unit/            # Unit tests (mocked dependencies)
└── integration/     # Integration tests (real database)
```
 
---
 
## What I Learned — Week by Week
 
### Week 1 — Project Bootstrap
Setting up a production-ready Node.js + TypeScript + Express skeleton from scratch.
 
- **Project Bootstrap** — scaffolding a project with `ts-node`, `nodemon`, and `tsconfig`; setting up `docker-compose.yml` for PostgreSQL and Redis
- **Error Handling Middleware** — writing a global error handler in Express so every error across the entire app returns a consistent JSON response
- **Why `dotenv` and secrets never go in code** — environment variables keep sensitive values like database passwords and JWT secrets out of source code and out of version control; `.env` is always in `.gitignore`
---
 
### Week 2 — Authentication
Implementing user registration, login, and JWT-protected routes.
 
- **User Model** — defining a TypeORM entity with fields for email, hashed password, full name, and role; understanding why you never store plain text passwords
- **Data Transfer Objects (DTOs)** — using `class-validator` decorators (`@IsEmail`, `@MinLength`) to validate and shape incoming request data before it ever reaches the service layer
- **Auth Service** — hashing passwords with `bcryptjs`, generating JWTs with `jsonwebtoken`, and separating business logic from the HTTP layer
- **Auth Controller** — parsing requests, calling the service, and returning consistent responses
- **Authenticate Middleware — Protecting Routes with JWT** — extracting the Bearer token from the `Authorization` header, verifying it with `jwt.verify()`, and attaching the decoded user to `req.user` so downstream handlers know who is making the request
- **Auth Routes** — wiring controllers to Express routes and applying middleware selectively
- **How Register Works** — checks for duplicate email → hashes password → saves user → returns JWT
- **How Login Works** — finds user by email → compares password hash → returns JWT
- **How Protected Routes Work** — every request hits the `authenticate` middleware first; if the token is missing or invalid the request is rejected with `401` before the controller ever runs
---
 
### Week 3 — Wallets & Accounts
Building multi-currency wallets and understanding data modelling.
 
- **Repository Pattern** — all database queries live in dedicated repository classes; services never call the database directly, keeping business logic cleanly separated from data access
- **Entities** — TypeORM entity classes decorated with `@Entity`, `@Column`, `@PrimaryGeneratedColumn` that map directly to database tables
- **Many-To-One Relationships** — one User can have many Wallets; TypeORM's `@ManyToOne` decorator handles the foreign key relationship automatically
- **Entity-Repository-Service-Database Pattern** — the four-layer architecture where entities define the shape, repositories handle queries, services contain logic, and the database persists everything
- **Floating Point Errors and Why They Exist** — `0.1 + 0.2 !== 0.3` in JavaScript because floats can't represent all decimal numbers exactly in binary; money always uses `decimal` columns in PostgreSQL (not `float`) and the `decimal.js` library in application code to avoid precision loss
- **Data Migrations and Seedings** — migrations version-control database schema changes so the DB structure can be reproduced consistently across environments; seedings populate initial data
---
 
### Week 4 — The Provider System
Building the Strategy Pattern for bank providers — the most important architectural week.
 
- **Abstract Classes and Interfaces** — `abstract class BaseProvider` defines a contract that every bank must follow; abstract methods have no implementation in the base class and must be implemented by child classes; TypeScript enforces this at compile time
- **The Strategy Design Pattern** — a family of behaviours (bank providers) are each encapsulated in their own class, all following the same contract, and swapped at runtime without the calling code needing to know which one is in use; `getProvider('NGN')` returns `LocalBankProvider`, `getProvider('USD')` returns `GlobalBankProvider` — the transfer service never needs an `if/else` chain
- **Simulating External APIs** — mocking bank responses with fake latency (`sleep()`) and deterministic fake data so the system can be developed and tested without real bank credentials; the same concept used by Paystack and Stripe's sandbox environments
- **The Open/Closed Principle** — code should be open for extension but closed for modification; adding a new bank provider means creating one new file and adding one line to the router — zero existing files need to change
---
 
### Week 5 — Transfers & Transactions
Wiring everything together with transactional integrity.
 
- **Database Transactions (ACID)** — wrapping multiple DB operations in a single atomic unit using `AppDataSource.transaction()`; either all operations succeed and commit together, or none of them do and everything rolls back automatically; prevents partial state like a wallet being debited with no transaction record created
- **Pagination** — returning large datasets in pages using `limit` (how many records per page) and `offset` (how many to skip); the formula is `offset = (page - 1) * limit`; `findAndCount()` returns both the page of data and the total count so the frontend knows how many pages exist
- **Why External API Calls Go Outside DB Transactions** — DB transactions hold row locks while open; if a bank API call (which can take 30+ seconds) happens inside a transaction, those locks are held for the entire duration, blocking all other operations on those rows; the correct pattern is to commit the debit first, then call the bank outside the transaction
- **Idempotency** — the guarantee that sending the same request multiple times produces the same result as sending it once; implemented via a `clientReference` field — a unique ID the client generates per transfer attempt; if a transfer with that reference already exists, the duplicate is rejected rather than processed again; used by Paystack, Flutterwave, and Stripe on every payment request
---
 
### Week 6 — FX Rates & Redis Caching
Exposing exchange rates with intelligent caching.
 
- **Caching** — storing the result of an expensive operation (external API call) in fast storage (Redis) so subsequent requests for the same data can be served instantly without repeating the expensive operation
- **The Cache-Aside Pattern** — check the cache first; on a cache hit return the cached value immediately; on a cache miss fetch from the source, store in cache, then return the value; the application manages the cache explicitly rather than the cache sitting transparently in front of the database
- **TTL: Time To Live** — a expiry time set on a cached value after which Redis automatically deletes it; TTL should reflect how frequently the data changes — FX rates use 5 minutes, static data like country lists could use 30 days; when data changes unexpectedly, use `redis.del()` (cache invalidation) to immediately remove the stale value rather than waiting for TTL expiry
- **Redis as a Data Structure Server** — Redis supports strings, hashes, lists, sets, and sorted sets — not just simple key-value pairs; this makes it useful for queues (lists), session storage (hashes), unique visitor tracking (sets), and leaderboards (sorted sets), not just caching
- **Cache Invalidation** — manually deleting a cached key when the underlying data changes so the next request fetches fresh data rather than serving stale values
- **Why Caching Matters at Scale** — without caching, 10,000 simultaneous users checking the NGN→USD rate would trigger 10,000 external API calls, hitting rate limits and causing slow responses; with caching, only the first request per TTL window hits the API — the remaining 9,999 are served from Redis in under 1ms
---
 
### Week 7 — Testing
Writing tests that actually catch bugs.
 
- **Unit Testing** — testing one function in complete isolation; all dependencies (database, external APIs, other services) are replaced with mocks so the test verifies only the logic of the function under test; fast, precise, and good for catching logic bugs
- **Integration Testing** — testing the real assembled system end to end with nothing mocked; a real HTTP request hits a real Express route, which calls the real service, which talks to the real database; slower but proves the actual wiring works correctly
- **Jest** — the JavaScript/TypeScript testing framework used to write, organise, and run tests; provides `describe()` for grouping tests, `it()` for individual test cases, `expect()` for assertions, and `jest.fn()` / `jest.spyOn()` for mocking
- **AAA — Arrange, Act, Assert** — the universal structure of every unit test: Arrange sets up fake data and mocks; Act calls the function being tested; Assert checks that the result matches what was expected; this structure applies to every unit test regardless of language or framework
---
 
### Week 8 — Security & Polish
Hardening the API for production.
 
- **Helmet.js** — an Express middleware that sets 13 security HTTP headers automatically with a single `app.use(helmet())` call; removes the `X-Powered-By: Express` header (which reveals the tech stack to attackers), prevents clickjacking via `X-Frame-Options`, blocks XSS via `Content-Security-Policy`, and more
- **Rate Limiting** — using `express-rate-limit` to restrict how many requests a client can make in a time window; a global limiter (100 requests per 15 minutes) protects all routes from general abuse; a strict auth limiter (5 attempts per 15 minutes with `skipSuccessfulRequests: true`) specifically protects `/auth/login` from brute force attacks; when the limit is hit the server returns `429 Too Many Requests`
- **Header References** — HTTP response headers communicate metadata about the response; security headers (set by Helmet) tell browsers how to handle the content safely; rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) tell clients how many requests they have left and when the window resets; standard headers use the modern IETF format while legacy headers use the older `X-RateLimit-*` prefix
---
 
## Security Checklist
 
- [x] `helmet` — sets secure HTTP headers
- [x] `express-rate-limit` — prevents brute force on `/auth/login`
- [x] Input sanitization on all DTOs via `class-validator`
- [x] Passwords never logged or returned in responses
- [x] JWT expiry set to 24h
- [x] `.env.example` committed, `.env` in `.gitignore`
- [x] No hardcoded secrets anywhere in code
- [x] SQL injection impossible — TypeORM parameterizes all queries
- [x] Decimal precision correct for all money fields
---
 
## Key Fintech Concepts
 
| Concept | Where it appears |
|---|---|
| Never store plain passwords | Week 2 — `bcryptjs` |
| Float precision kills money | Week 3 — `decimal` columns |
| Pre-validate before debiting | Week 5 — account name lookup |
| Debit first, call bank second | Week 5 — transaction ordering |
| Idempotency keys | Week 5 — `clientReference` field |
| Cache FX rates, not transfers | Week 6 — Redis TTL |
| Audit trail in logs | Week 8 — structured Winston logs |
 
---
 
## Recommended Reading
 
- [The Twelve-Factor App](https://12factor.net/) — config, logs, and backing services methodology
- [TypeORM Docs — Relations and Migrations](https://typeorm.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — web application security risks
- [Designing Data-Intensive Applications](https://dataintensive.net/) Ch. 7 — transactions and isolation levels
---
 
## Author
 
Built as part of an internship capstone project following the PocketRemit API curriculum.