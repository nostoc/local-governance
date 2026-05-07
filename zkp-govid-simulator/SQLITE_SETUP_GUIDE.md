# SQLite Database Setup & DBeaver Configuration

## Quick Start - Testing Your API

### 1. Start the Development Server

```bash
npm run dev
```

You should see:
```
✅ Database initialized successfully
✅ Seeded 20 citizens into database
🔐 Simulated ZKP GovID Server running on port 5000
📡 API Available at http://localhost:5000
🏥 Health check: http://localhost:5000/health
```

### 2. Test the Verify Citizen Endpoint

Use any of the 20 seeded citizens (here are a few):

**Test 1: Valid Citizen**
```bash
curl -X POST http://localhost:5000/api/govid/verify-citizen \
  -H "Content-Type: application/json" \
  -d '{
    "govId": "199812345678",
    "password": "0711234567",
    "reportContext": "Pothole_MainSt"
  }'
```

**Expected Response:**
```json
{
  "mockProof": "zkp_valid_proof_a1b2c3d4e5f6g7h8",
  "nullifierHash": "0x7f3e9a2c1b5d6a8f..."
}
```

**Test 2: Invalid Credentials**
```bash
curl -X POST http://localhost:5000/api/govid/verify-citizen \
  -H "Content-Type: application/json" \
  -d '{
    "govId": "199812345678",
    "password": "wrongpassword",
    "reportContext": "Pothole_MainSt"
  }'
```

**Expected Response:**
```json
{
  "error": "Invalid citizen credentials"
}
```

---

## All 20 Seeded Citizens

Use any of these 20 citizens for testing (govId + password pairs):

| Name | govId | Password (Mobile) |
|------|-------|-------------------|
| Kamal Perera | 199812345678 | 0711234567 |
| Nimali Silva | 199587654321 | 0779876543 |
| Arun Kumar | 199765432109 | 0712345890 |
| Chamari Jayasinghe | 199654321098 | 0769876540 |
| Ravi Dissanayake | 199543210987 | 0718765432 |
| Lakshmi Fernandez | 199432109876 | 0776543210 |
| Thilak Bandara | 199321098765 | 0712109876 |
| Anushka Weerasinghe | 199210987654 | 0779876541 |
| Sameer Malik | 199109876543 | 0713456789 |
| Priya Menon | 199098765432 | 0778765432 |
| Vishan Wijaya | 198987654321 | 0714567890 |
| Divya Sharma | 198876543210 | 0777654321 |
| Sanjay Reddy | 198765432109 | 0715678901 |
| Yasmin Ali | 198654321098 | 0776543211 |
| Rohan Gunarathne | 198543210987 | 0716789012 |
| Sheila Perera | 198432109876 | 0775432101 |
| Amit Patel | 198321098765 | 0717890123 |
| Asha Desai | 198210987654 | 0774321012 |
| Deepak Rajput | 198109876543 | 0718901234 |
| Malini Fernando | 198098765432 | 0773210123 |

---

## Viewing & Managing Database with DBeaver

### Step 1: Install DBeaver

**Download:** https://dbeaver.io/download/

Choose Community Edition (free) for your operating system:
- Windows: `dbeaver-ce-latest-x86_64-setup.exe`
- macOS: `dbeaver-ce-latest-macos.dmg`
- Linux: `dbeaver-ce-latest-linux.gtk.x86_64.tar.gz`

### Step 2: Create a New SQLite Connection

1. **Open DBeaver** and click `Database → New Database Connection`
2. **Select SQLite** from the list and click `Next`
3. **Configure Connection:**
   - **Connection Name:** `Local GovID SQLite`
   - **Database File (path):** Navigate to your project and select:
     ```
     /home/cooper/projects/local-governance/zkp-govid-simulator/data/citizens.db
     ```
   - Click `Test Connection` to verify
   - Click `Finish`

### Step 3: Browse the Citizens Table

1. In the left sidebar, expand `Local GovID SQLite` → `Main` → `Tables`
2. Double-click the `citizens` table to view all 20 records
3. You can:
   - **View Data:** See all columns (govId, name, email, phone, address, status, etc.)
   - **Edit Rows:** Right-click a row and select `Edit` to modify
   - **Add Row:** Click the `+` button at the top to add new citizens
   - **Delete Row:** Right-click and select `Delete`
   - **Filter/Search:** Use the filter panel to search by govId or name

### Step 4: Run SQL Queries in DBeaver

Click `SQL → New SQL Script` to write custom queries:

**Query 1: Count all citizens**
```sql
SELECT COUNT(*) as total_citizens FROM citizens;
```

**Query 2: View only active citizens with email**
```sql
SELECT govId, name, email, phone, status FROM citizens 
WHERE status = 'Active' AND email IS NOT NULL;
```

**Query 3: Find citizen by govId**
```sql
SELECT * FROM citizens WHERE govId = '199812345678';
```

**Query 4: List citizens by city (address)**
```sql
SELECT name, address, status FROM citizens 
ORDER BY address ASC;
```

**Query 5: Update a citizen's status**
```sql
UPDATE citizens SET status = 'Inactive' WHERE govId = '199812345678';
```

---

## Database File Location

- **Development:** `/home/cooper/projects/local-governance/zkp-govid-simulator/data/citizens.db`
- **Size:** ~12 KB (SQLite is lightweight)
- **Format:** Binary SQLite 3 format

### Backing Up the Database

```bash
# Create a backup
cp data/citizens.db data/citizens.backup.db

# Restore from backup
cp data/citizens.backup.db data/citizens.db
```

---

## Database Schema

```sql
CREATE TABLE citizens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  govId TEXT UNIQUE NOT NULL,           -- 12-digit government ID
  password TEXT NOT NULL,                -- Mobile number (7-10 digits)
  name TEXT NOT NULL,                    -- Citizen name
  email TEXT,                            -- Email address
  phone TEXT,                            -- Phone number (same as password typically)
  address TEXT,                          -- Street address
  status TEXT DEFAULT 'Active',          -- Status (Active/Inactive)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_govId ON citizens(govId);  -- Fast lookups by govId
```

---

## Common DBeaver Tasks

| Task | Steps |
|------|-------|
| **View all citizens** | Expand `citizens` table → Right-click → `View Data` |
| **Search for a citizen** | Click filter icon in data view → Enter govId or name |
| **Add new citizen** | Click `+` button above data grid → Fill fields → Press `Ctrl+S` |
| **Modify citizen data** | Double-click cell → Edit value → Press `Tab` or `Enter` |
| **Delete citizen** | Right-click row → `Delete Rows` → Confirm |
| **Export to CSV** | Right-click table → `Export Data` → Choose CSV format |
| **Run custom SQL** | `SQL → New SQL Editor` → Write query → Press `Ctrl+Enter` |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DBeaver can't find database file | Check the file path ends with `citizens.db` and file exists |
| "Database is locked" error | Close the Node.js server (`npm run dev`) before making changes in DBeaver |
| Changes not visible in API | Click `F5` in DBeaver to refresh, or restart the Node.js server |
| SQLite driver not installed | DBeaver downloads SQLite drivers automatically on first use |

---

## Best Practices

1. **Always backup** before making mass changes: `cp data/citizens.db data/citizens.backup.db`
2. **Use DBeaver for visual inspection**, but use the API for production updates
3. **Keep govId unique** – The database enforces this constraint
4. **Test with cURL first** before integrating with frontend
5. **Monitor file size** – Each citizen record ≈ 300 bytes

---

**Next Steps:**
- Try a few test requests with different citizens
- Explore the database structure in DBeaver
- Modify a citizen's data and re-test the API
