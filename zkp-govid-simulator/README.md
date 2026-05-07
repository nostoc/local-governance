# ZKP GovID Simulator

A TypeScript-based server that simulates a government citizen authentication system using Zero-Knowledge Proofs (ZKP). This simulator generates cryptographic proofs for citizen verification while preserving privacy—no personal information is exposed to the Relayer.

##  Features

- **Privacy-Preserving Authentication**: Authenticates citizens without revealing their identity
- **ZKP Simulation**: Generates simulated Zero-Knowledge Proofs
- **Deterministic Nullifier Hash**: Prevents duplicate report submissions using unique hashes
- **SQLite Database**: Persistent storage of 20+ citizen records with rich attributes
- **TypeScript**: Fully typed for safety and maintainability
- **Hot Reload**: Development with Nodemon for auto-restart on file changes
- **Error Handling**: Comprehensive error handling with meaningful messages

##  Project Structure

```
zkp-govid-simulator/
├── src/
│   ├── app.ts                      # Express app setup & middleware
│   ├── server.ts                   # Server initialization
│   ├── models/
│   │   └── citizen.ts              # Database queries (SQLite)
│   ├── services/
│   │   └── authService.ts          # Business logic for ZKP proof generation
│   ├── controllers/
│   │   └── authController.ts       # Request handlers & validation
│   ├── routes/
│   │   └── auth.ts                 # Route definitions
│   ├── database/
│   │   ├── db.ts                   # SQLite initialization & connection
│   │   └── seed.ts                 # Seed 20 citizens into database
│   └── middlewares/                # Custom middleware (expandable)
├── data/
│   └── citizens.db                 # SQLite database (auto-created)
├── dist/                           # Compiled JavaScript output
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── SQLITE_SETUP_GUIDE.md           # DBeaver & database guide
└── README.md                       # This file
```

##  Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **SQLite 3** (better-sqlite3) - Lightweight database
- **Crypto** - Built-in Node.js cryptography
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-reload
- **ts-node** - TypeScript execution for development

##  Quick Start

### Prerequisites
- Node.js 18+ and npm
- SQLite 3 (included with better-sqlite3)

### Installation

```bash
npm install
npm run build
npm run dev
```

**Server starts at:** `http://localhost:5000`

**Health check:** `http://localhost:5000/health`

### First API Call

```bash
curl -X POST http://localhost:5000/api/govid/verify-citizen \
  -H "Content-Type: application/json" \
  -d '{
    "govId": "199812345678",
    "password": "0711234567",
    "reportContext": "Pothole_MainSt"
  }'
```

**Response:**
```json
{
  "mockProof": "zkp_valid_proof_a1b2c3d4e5f6g7h8",
  "nullifierHash": "0x7f3e9a2c1b5d6a8f..."
}
```

##  Database Features

- **20 Seeded Citizens** with realistic Sri Lankan names and mobile numbers
- **Rich Attributes**: govId, password, name, email, phone, address, status
- **Automatic Initialization**: Database created and seeded on first startup
- **Fast Lookups**: Indexed by govId for quick citizen verification
- **Easy Management**: View and edit data using DBeaver (see guide below)

### All Citizens Available

See [SQLITE_SETUP_GUIDE.md](SQLITE_SETUP_GUIDE.md#all-20-seeded-citizens) for complete list of all 20 test citizens you can use.

##  API Endpoint

### POST /api/govid/verify-citizen

Authenticates a citizen and generates a ZKP proof.

**Request Body:**
```json
{
  "govId": "12-digit government ID",
  "password": "citizen password (typically mobile)",
  "reportContext": "context string for nullifier hash"
}
```

**Success Response (200):**
```json
{
  "mockProof": "zkp_valid_proof_...",
  "nullifierHash": "0x..."
}
```

**Error Response (400/401):**
```json
{
  "error": "Invalid citizen credentials"
}
```

##  Database Management

### View Data with DBeaver

**Free GUI tool to view/edit SQLite database:**

1. Download DBeaver: https://dbeaver.io/download/
2. Create SQLite connection pointing to `data/citizens.db`
3. Browse, edit, and query 20 citizen records
4. Export data to CSV or other formats

See [SQLITE_SETUP_GUIDE.md](SQLITE_SETUP_GUIDE.md#viewing--managing-database-with-dbeaver) for detailed instructions.

### Database File Location

```
zkp-govid-simulator/data/citizens.db
```

Automatically created on first run. Safe to delete (will be recreated).

##  Environment Variables

- `PORT` (default: 5000) – Server listening port
- `DB_PATH` (default: `data/citizens.db`) – SQLite database location

Example:
```bash
PORT=5001 DB_PATH=/custom/path/citizens.db npm run dev
```

##  Scripts

```bash
npm run dev       # Start with hot reload (Nodemon)
npm run build     # Compile TypeScript → JavaScript
npm start         # Run compiled build (production)
npm test          # Run tests (not yet configured)
```

##  Testing

Full list of 20 test citizens with govId and password pairs in [SQLITE_SETUP_GUIDE.md](SQLITE_SETUP_GUIDE.md#all-20-seeded-citizens).

Example test users:
- **Kamal Perera** – govId: `199812345678`, password: `0711234567`
- **Nimali Silva** – govId: `199587654321`, password: `0779876543`

All 20 citizens are seeded on first startup automatically.

##  Architecture

**Separation of Concerns:**
- **Models** (`citizen.ts`): SQLite queries for citizen lookups
- **Services** (`authService.ts`): ZKP proof and nullifier hash generation
- **Controllers** (`authController.ts`): HTTP request handling and validation
- **Routes** (`auth.ts`): Endpoint definitions

##  Next Steps

1. **Frontend Integration** – Call `/api/govid/verify-citizen` from web app
2. **Real ZKP** – Replace simulated proofs with actual cryptographic proofs (SnarkJS)
3. **Test Suite** – Add Jest tests for services and controllers
4. **Rate Limiting** – Protect endpoints with rate limiting middleware
5. **Logging** – Add structured logging with Winston/Pino

##  Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `PORT=5001 npm run dev` |
| Database locked | Close DBeaver or other tools accessing the database |
| TypeScript errors | Run `npm run build` to see detailed errors |
| Citizens not found | Check database file exists: `ls data/citizens.db` |

##  Resources

- [SQLite Setup & Testing Guide](SQLITE_SETUP_GUIDE.md)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [better-sqlite3 Docs](https://github.com/WiseLibs/better-sqlite3)

---

**Last Updated:** April 2026  
**Status:** Development with SQLite integration ✓

- Node.js v16+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or navigate to project directory
cd zkp-govid-simulator

# Install dependencies
npm install
```

### Running the Server

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Build**:
```bash
npm run build
npm start
```

**Expected Output**:
```
 Simulated ZKP GovID Server running on port 5000
 API Available at http://localhost:5000
 Health check: http://localhost:5000/health
```

##  API Documentation

### Base URL
```
http://localhost:5000
```

### Endpoints

#### 1. Health Check
Check if the server is running.

```
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "message": "ZKP GovID Simulator is running"
}
```

---

#### 2. Authenticate & Generate ZKP Proof
Authenticate a citizen and generate a privacy-preserving proof.

```
POST /api/govid/authenticate
```

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "citizenId": "citizen_001",
  "password": "password123",
  "reportContext": "broken_streetlight_zone_4"
}
```

**Response** (200 OK):
```json
{
  "mockProof": "zkp_valid_proof_a1b2c3d4e5f6g7h8",
  "nullifierHash": "0x7d1a8e3c4f9b2e6a1d5c8a3b7e2f4c9a1d5e8b3c6f9a2d5e8b1c4f7a0d3e6a"
}
```

**Error Responses**:

- **Missing Fields** (400 Bad Request):
```json
{
  "error": "Missing required fields: citizenId, password, reportContext"
}
```

- **Invalid Credentials** (401 Unauthorized):
```json
{
  "error": "Invalid citizen credentials"
}
```

---

##  How It Works

### 1. Authentication Flow
```
User → Server
  ├─ Sends: citizenId + password + reportContext
  ├─ Server: Verifies credentials against mock database
  └─ If valid: Generate proof & nullifier hash
```

### 2. ZKP Proof Generation
- Random 16-character hex string appended to `zkp_valid_proof_` prefix
- Simulates mathematical proof without exposing citizen identity

### 3. Nullifier Hash (Duplicate Prevention)
- SHA-256 hash of: `citizenId + reportContext`
- **Deterministic**: Same input → Same hash
- **Purpose**: Smart contract checks this hash; repeated submissions are rejected
- Converts to hex format with `0x` prefix for blockchain compatibility

### 4. Privacy Preservation
-  Citizen's name is NOT returned
-  Citizen's ID is NOT returned
-  Only proof & nullifier hash are sent to Relayer
-  Relayer cannot identify the citizen

---

##  Testing the API

### Using cURL

**Health Check**:
```bash
curl http://localhost:5000/health
```

**Authenticate (Success)**:
```bash
curl -X POST http://localhost:5000/api/govid/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "citizen_001",
    "password": "password123",
    "reportContext": "broken_streetlight_zone_4"
  }'
```

**Authenticate (Failure)**:
```bash
curl -X POST http://localhost:5000/api/govid/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "citizenId": "citizen_001",
    "password": "wrongpassword",
    "reportContext": "broken_streetlight_zone_4"
  }'
```

### Using Postman

1. Open Postman
2. Create a new POST request
3. URL: `http://localhost:5000/api/govid/authenticate`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "citizenId": "citizen_001",
  "password": "password123",
  "reportContext": "broken_streetlight_zone_4"
}
```
6. Click **Send**

### Using JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:5000/api/govid/authenticate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    citizenId: 'citizen_001',
    password: 'password123',
    reportContext: 'broken_streetlight_zone_4'
  })
});

const data = await response.json();
console.log(data);
```

---

##  Mock Database Users

The simulator includes two pre-registered citizens:

| Citizen ID | Name | Password |
|-----------|------|----------|
| citizen_001 | Alice | password123 |
| citizen_002 | Bob | password123 |

** Note**: This is a mock database for simulation. In production, use secure authentication systems.

---

##  Available npm Scripts

```bash
npm run dev      # Start dev server with auto-reload (Nodemon)
npm run build    # Compile TypeScript to JavaScript
npm start        # Run production server
npm test         # Run tests (placeholder)
```

---

##  Example Workflow

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Send authentication request:**
   ```bash
   curl -X POST http://localhost:5000/api/govid/authenticate \
     -H "Content-Type: application/json" \
     -d '{"citizenId":"citizen_001","password":"password123","reportContext":"pothole_main_street"}'
   ```

3. **Receive proof & nullifier:**
   ```json
   {
     "mockProof": "zkp_valid_proof_f7e3c1a9",
     "nullifierHash": "0x4a2c8e1f..."
   }
   ```

4. **Use in your DApp:**
   - Send `mockProof` to your smart contract for verification
   - Send `nullifierHash` to prevent duplicate submissions
   - Privacy maintained: Contract never knows citizen identity

---

##  Security Notes

-  Passwords are verified server-side
-  No sensitive data in response
-  CORS enabled for frontend integration
-  This is a simulator for educational/development purposes
-  Replace mock database with real authentication in production
-  Use HTTPS in production
-  Implement proper input validation & rate limiting

---

## Development Roadmap

- [ ] Add JWT token support
- [ ] Implement real database connection
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add unit tests
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add environment configuration

---

##  License

ISC

---

##  Author

Undergraduate Project - ZKP GovID Simulator

---

##  Support

For issues or questions, refer to the API documentation above or contact the development team.
