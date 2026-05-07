# ZKP GovID Simulator - AI Assistant Instructions

## Project Overview

This is a TypeScript-based Express.js API that simulates a privacy-preserving government citizen authentication system using Zero-Knowledge Proofs (ZKP). The simulator verifies citizens without exposing personal information to external services (like the Relayer).

**Key Features:**
- Privacy-preserving authentication via ZKP
- Generates cryptographic proofs and deterministic nullifier hashes
- Single endpoint: `POST /api/govid/verify-citizen`
- In-memory mock citizen database (intended for SQLite integration)
- Full TypeScript with strict mode enabled

## Built With

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Language**: TypeScript 5.9.3 (strict mode)
- **Database**: In-memory mock (planning SQLite integration)
- **Development**: Nodemon for hot reload, ts-node for direct execution

## Architecture

```
src/
├── server.ts              # Entry point, initializes HTTP server
├── app.ts                 # Express setup, middleware (CORS, JSON), route registration
├── controllers/
│   └── authController.ts  # Request handlers, input validation
├── services/
│   └── authService.ts     # Business logic: proof generation, nullifier hashing
├── models/
│   └── citizen.ts         # Mock citizen database, credential verification
├── routes/
│   └── auth.ts            # Route definitions (/api/govid/verify-citizen)
└── middlewares/           # Custom middleware (expandable)
```

**Separation of Concerns:**
- **Models**: Data access layer (getCitizenById, verifyCitizen)
- **Services**: Business logic (generateMockProof, generateNullifierHash, authenticateAndGenerateProof)
- **Controllers**: HTTP handlers, validation, response formatting
- **Routes**: Endpoint definitions

## Key Endpoints

### POST /api/govid/verify-citizen

Authenticates a citizen and generates a ZKP proof for report submission.

**Request:**
```json
{
  "citizenId": "citizen_001",
  "password": "password123",
  "reportContext": "Pothole_MainSt"
}
```

**Response (Success):**
```json
{
  "mockProof": "zkp_valid_proof_a1b2c3d4",
  "nullifierHash": "0x7f3e9a2c1b5d6a8f..."
}
```

**Response (Failure):**
```json
{
  "error": "Invalid citizen credentials"
}
```

**Security Notes:**
- The nullifierHash is deterministic (SHA256 of citizenId + reportContext)
- Prevents duplicate submissions to the smart contract
- The mockProof simulates a valid ZKP in production

## Development Workflow

### Setup & Installation
```bash
npm install          # Install dependencies
```

### Running

```bash
npm run dev          # Start with hot reload (Nodemon + ts-node)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled JavaScript
```

**Default Port:** 5000 (configurable via `PORT` env var)

**Health Check:**
```bash
curl http://localhost:5000/health
# Response: { "status": "ok", "message": "ZKP GovID Simulator is running" }
```

## Key Development Tasks

### Adding a New Endpoint

1. **Define the route** in `src/routes/auth.ts`:
   ```typescript
   router.post('/govid/new-endpoint', newHandler);
   ```

2. **Implement the controller** in `src/controllers/authController.ts`:
   ```typescript
   const newHandler = (req: Request, res: Response): void => {
     // Validate input, call service, return response
   };
   ```

3. **Add business logic** in `src/services/authService.ts`:
   ```typescript
   const newBusinessLogic = (): ResultType => {
     // Core logic here
   };
   ```

### Extending the Citizen Database

**Current State:** In-memory mock in `src/models/citizen.ts`

## Database: SQLite with 20+ Citizens

**Location:** `data/citizens.db` (auto-created on first startup)

**Citizen Data:**
- **20 Seeded Citizens** with realistic Sri Lankan names
- **Attributes:** govId (12-digit), password (mobile number), name, email, phone, address, status
- **Auto-Seeding:** Database initialized and populated on first startup
- **Idempotent:** Running again won't duplicate data

**Example Citizens:**
```
ID: 199812345678, Name: Kamal Perera, Password: 0711234567
ID: 199587654321, Name: Nimali Silva, Password: 0779876543
ID: 199765432109, Name: Arun Kumar, Password: 0712345890
... (17 more citizens)
```

See [SQLITE_SETUP_GUIDE.md](#all-20-seeded-citizens) for complete list.

**Accessing Data:**
```
Services Layer:
  getCitizenByGovId(govId)  → Returns full Citizen record or undefined
  verifyCitizen(govId, password) → Returns boolean if credentials match & status=Active
  getAllCitizens()          → Returns all citizens (excluding passwords)
```

### Viewing with DBeaver

Free SQL GUI tool for browsing/editing database:
1. Download: https://dbeaver.io/download/
2. Create SQLite connection → Point to `data/citizens.db`
3. Browse `citizens` table with 20 seeded rows
4. Edit, delete, or export data

**See [SQLITE_SETUP_GUIDE.md](SQLITE_SETUP_GUIDE.md) for full DBeaver guide with screenshots.**

### Understanding the ZKP Logic

**Proof Generation** (`authService.ts`):
- Simulates a valid ZKP using randomized strings
- In production: Replace with actual ZKP circuits (e.g., SnarkJS)

**Nullifier Hash** (`authService.ts`):
- Deterministic SHA256 hash of `citizenId + reportContext`
- Prevents same citizen from reporting the same issue twice
- Linked to smart contract validation

## Code Conventions

1. **TypeScript**: Strict mode enabled, all types explicitly defined
2. **Naming**: camelCase for functions/variables, PascalCase for types/interfaces
3. **Error Handling**: Explicit validation, meaningful error messages
4. **Middleware Order**: CORS before routes, JSON parser before controllers
5. **Async Patterns**: Arrow functions, explicit return types

## Environment Variables

- `PORT` (default: 5000) – Server listening port

**Future variables** (for SQLite):
- `DB_PATH` – Path to SQLite database file
- `NODE_ENV` – Environment (development/production)

## Testing & Validation

**Current Status:** No test suite yet

**Mock Citizens** (for quick testing):
```
citizen_001: Alice, password123
citizen_002: Bob, password123
```

**Example cURL Test:**
```bash
curl -X POST http://localhost:5000/api/govid/verify-citizen \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "citizen_001",
    "password": "password123",
    "reportContext": "Pothole_MainSt"
  }'
```

## Common Patterns & Utilities

### Input Validation
Always validate required fields in controllers before calling services:
```typescript
if (!citizenId || !password || !reportContext) {
  res.status(400).json({ error: "Missing required fields: ..." });
  return;
}
```

### Error Responses
Use consistent error structure:
```typescript
{ error: "Descriptive message" }          // 400/401 status codes
{ success: false, error: "Message" }      // From services
```

### Crypto Functions
All cryptographic operations in `authService.ts`:
- `generateMockProof()` – Simulated ZKP
- `generateNullifierHash()` – Deterministic report deduplication hash

## Related Projects in Workspace

- **smart-contracts/**: Reporting.sol contract (validates nullifierHash, receives mockProof)
- **backend-relayer/**: NestJS service that receives proofs from this simulator
- **blockchain/**: Geth nodes for testing
- **ai-moderation/**: Face detection and plate recognition (separate concern)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Set `PORT` env var: `PORT=5001 npm run dev` |
| TypeScript compilation errors | Run `npm run build` to see full error output |
| Hot reload not working | Check Nodemon is running (should show "nodemon" in ps output) |
| Missing dependencies | Run `npm install` and verify node_modules/ exists |

## Next Steps for Enhancement

1. ✅ **SQLite Integration** – Complete with 20 seeded citizens
2. **Add test suite** – Jest or Mocha tests for services and controllers
3. **Real ZKP Integration** – Use SnarkJS or similar for actual proofs
4. **Validation Middleware** – Create reusable input validation middleware
5. **Logging** – Add Winston or Pino for structured logging
6. **Rate Limiting** – Protect /api/govid/verify-citizen with rate limiting
7. **API Documentation** – Add Swagger/OpenAPI spec
8. **Batch Operations** – Add `/api/govid/verify-batch` endpoint for multiple citizens

---

**Last Updated:** April 2026
