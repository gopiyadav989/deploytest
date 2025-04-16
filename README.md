# ClickBridge

## Overview
ClickBridge is a web-based data bridge application that enables seamless, bidirectional data transfer between ClickHouse databases and flat files (CSV). It features a modern React frontend and a robust Node.js/Express backend. The tool supports both ClickHouse-to-CSV export and CSV-to-ClickHouse import, with advanced features such as column selection, multi-table joins, JWT authentication, progress tracking, and data preview.

---

## Features
- **Bidirectional Data Flow:**
  - ClickHouse → Flat File (CSV export)
  - Flat File (CSV) → ClickHouse (import)
- **Source & Target Selection:** Choose ClickHouse or Flat File as source/target.
- **ClickHouse Connection:**
  - Host, port, protocol, database, user, password, JWT token support
- **Flat File Integration:**
  - Upload CSV, configure delimiter
- **Schema Discovery & Column Selection:**
  - Fetch tables/columns from ClickHouse or CSV
  - Select columns for ingestion/export
- **Multi-Table Join (Bonus):**
  - Join multiple ClickHouse tables with custom join conditions
- **Progress Bar & Status:**
  - Visual indicator and status updates for ingestion/export
- **Data Preview:**
  - Preview first 100 records before ingestion/export
- **Error Handling:**
  - Friendly messages for connection, auth, query, and ingestion errors
- **Record Count Reporting:**
  - Total number of records processed displayed on completion

---

## Setup & Installation

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- (Optional) Docker for running ClickHouse locally

### 1. Clone the Repository
```bash
git clone https://github.com/gopiyadav989/Clickbridge.git
cd ClickBridge
```

### 2. Install Dependencies
#### Backend
```bash
cd backend
npm install
```
#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configure Environment
- Copy `.env.example` to `.env` in `/backend` and adjust ClickHouse connection defaults as needed.

### 4. Run the Application
#### Start Backend
```bash
cd backend
npm run dev
```
#### Start Frontend
```bash
cd ../frontend
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## Usage
1. **Select Source & Target** (ClickHouse or Flat File)
2. **Configure Connection** (host, port, database, JWT, or upload CSV)
3. **Load Tables/Columns** and select columns to ingest/export
4. **(Optional) Configure Joins** for multi-table export
5. **Preview Data** (first 100 records)
6. **Start Ingestion/Export**
7. **Monitor Progress** and view results/record count

---

## Testing
- Use ClickHouse sample datasets (e.g., `uk_price_paid`, `ontime`) or your own CSVs
- Test all flows: ClickHouse→CSV, CSV→ClickHouse, multi-table joins, error scenarios

---

## Project Structure
```
ClickBridge/
├── backend/
│   ├── routes/
│   ├── utils/
│   └── index.js
├── frontend/
│   ├── src/
│   └── ...
├── uploads/
├── sample_data.csv
├── dummy_data.csv
└── README.md
```

---# deploytest
