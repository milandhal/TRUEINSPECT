# TRUEINSPECT

**TRUEINSPECT** is an independent, professional full-stack web application for used-car exterior visual inspection, AI-assisted dent & defect detection, severity assessment, configurable MySQL refurbishment cost estimation, and inspection report generation (with downloadable PDF reports).

> **IMPORTANT DISCLAIMER:**  
> TRUEINSPECT is an independent academic and technical demonstration project. It is **NOT** an official Maruti Suzuki or Maruti Suzuki True Value application. It does not reproduce official logos, trademarks, or proprietary assets, and claims no official affiliation. All refurbishment estimates are project reference benchmarks derived from a configurable MySQL cost master.

---

## 1. System Architecture & Workflow

```text
New User Registration (Inspector / Manager)
        ↓
Login & JWT Authentication
        ↓
Inspection Dashboard (Live MySQL metrics)
        ↓
Create New Inspection (Registration, Make, Model, Date)
        ↓
Capture Photo (WebRTC getUserMedia) OR Upload Panel Images
        ↓
AI Dent & Defect Detection (CarDD / CDDM Taxonomy)
        ↓
Defect Type + Vehicle Component + Severity (Minor / Moderate / Major)
        ↓
Repair Cost Lookup from MySQL (repair_cost_master)
        ↓
Estimated Refurbishment Cost Range (Min – Max)
        ↓
TRUEINSPECT Visual Condition Assessment
        ↓
Final Inspection Report View & Downloadable PDF
```

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React
- **Backend**: Node.js, Express 4, mysql2 (Connection Pool), Multer, JWT, bcryptjs, PDFKit, CORS, dotenv
- **Database**: MySQL 8.x (InnoDB, Foreign Keys, UTF8mb4)
- **AI Microservice**: Python 3, Flask, Pillow, PyTorch/Torchvision architecture ready for CarDD / CDDM datasets

---

## 3. Step-by-Step MySQL Database Setup (MySQL Workbench)

As specified in project guidelines, database tables are **not** created silently on server startup. You must execute the SQL scripts manually in MySQL Workbench:

### Step 1: Verify MySQL Installation & Start Server
Ensure MySQL Server 8.x is installed and running. If on Windows:
```powershell
Get-Service -Name *mysql*
```

### Step 2: Open MySQL Workbench
1. Launch **MySQL Workbench**.
2. Connect to your local MySQL instance (e.g. `Local instance MySQL80` at `localhost:3306`).

### Step 3: Execute Database & Schema DDL (`database/schema.sql`)
1. In MySQL Workbench, click **File → Open SQL Script...**
2. Select:
   ```text
   database/schema.sql
   ```
3. Click the **Execute (Lightning Bolt)** icon.
4. This creates:
   - `trueinspect_db` database
   - `users` (Inspector / Manager roles, bcrypt hash)
   - `inspections` (Vehicle specs, inspector FK)
   - `inspection_images` (Photo metadata, area tags, camera/upload source)
   - `defects` (Defect type, component, severity, bounding boxes, nullable confidence)
   - `repair_cost_master` (Configurable benchmark repair rules)
   - `inspection_estimates` (Historical cost snapshot)
   - `reports` (Persisted report summaries)

### Step 4: Execute Repair Cost Master Benchmark Rules (`database/repair_cost_master_template.sql`)
1. In MySQL Workbench, open:
   ```text
   database/repair_cost_master_template.sql
   ```
2. Click the **Execute** icon.
3. This populates realistic Indian automotive repair benchmarks across:
   - Front Door, Rear Door, Front Bumper, Rear Bumper, Bonnet, Boot, Front Fender, Rear Quarter Panel, Headlamp, Taillamp, Windshield, Tire, Roof.
   - Defect classes: Dent, Scratch, Crack, Broken Lamp, Glass Damage, Tire Damage.

### Step 5: Verify Tables in MySQL Workbench
Run the verification query in a new query tab:
```sql
USE trueinspect_db;
SHOW TABLES;
SELECT COUNT(*) AS total_rules FROM repair_cost_master;
```

### Step 6: Configure Backend Connection
Open `backend/.env` and update your MySQL password:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=trueinspect_db

JWT_SECRET=trueinspect_secure_production_secret_key_2026_jwt
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:5001/detect
```

### Step 7: Test Connection
Start the backend server or test via curl:
```bash
curl http://localhost:5000/api/health
```
You will receive:
```json
{
  "status": "ok",
  "app": "TRUEINSPECT Backend API",
  "database": {
    "success": true,
    "message": "Connected to MySQL database: trueinspect_db"
  }
}
```

---

## 4. Running the Application

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm run dev
```

### 2. Start the Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your web browser.

### 3. (Optional) Start the AI Detection Microservice (Port 5001)
```bash
cd ai/inference
python app.py
```
*Note: If the AI service is offline, TRUEINSPECT remains fully functional. It gracefully displays `AI detection service unavailable` without generating fake detections or fabricated confidence scores.*

---

## 5. Technical Honesty & Interview Talking Points

For academic evaluation and MSIL interview panels:
1. **Separation of Concerns**:
   - **Computer Vision**: Detects damage and bounds the region of interest.
   - **Relational Database**: Source of truth for configurable repair-cost rules (`repair_cost_master`).
   - **Backend Engine**: Deterministic estimation, historical estimate snapshotting (`inspection_estimates`), and rule-based condition grading.
   - **User Interface**: Clear, uncluttered automotive workflow with real camera integration.
2. **Zero Fake Detections**:
   - The application starts with an empty database. All statistics come from real SQL queries.
   - Never fabricates confidence numbers; confidence is `NULL` for manual entries and strictly extracted from model outputs when connected.
3. **No Hardcoded Costs**:
   - Refurbishment calculations strictly query `repair_cost_master`. Managers can configure minimum and maximum costs directly from `/settings`.
