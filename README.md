# AlgionsBus — Bus Booking Management System
### Full-Stack Web Development Internship Assessment Project
**Company**: Algions AI Labs Private Limited  
**Author**: Full-Stack Software Engineering Candidate

---

## 🚀 Live Demo & Quick Links
- **Backend API**: `http://localhost:5000/api`
- **Interactive Swagger Documentation**: `http://localhost:5000/api-docs`
- **Frontend Web Application**: `http://localhost:5173`
- **Architecture Documentation**: [`docs/ARCHITECTURE_AND_DESIGN.md`](./docs/ARCHITECTURE_AND_DESIGN.md)
- **Entity-Relationship Diagram**: [`docs/ER_DIAGRAM.md`](./docs/ER_DIAGRAM.md)
- **Technical Report**: [`docs/TECHNICAL_REPORT.md`](./docs/TECHNICAL_REPORT.md)
- **REST API Reference**: [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md)

---

## 🔑 Demo Evaluation Credentials

| Role | Email | Password | Privileges |
|---|---|---|---|
| **System Admin** | `admin@algions.com` | `admin123` | Full access to fleet management, scheduling, passenger manifests, audit logs, and analytics |
| **Passenger 1** | `rahul@gmail.com` | `password123` | Search trips, select seats, book tickets, download printable tickets, cancel bookings |
| **Passenger 2** | `priya@gmail.com` | `password123` | Independent passenger account for testing concurrency and authorization |

*(Note: The login page includes 1-click demo autofill buttons for immediate evaluation!)*

---

## 🛠️ Technology Stack

- **Frontend**:
  - React.js (Vite)
  - Tailwind CSS
  - React Router DOM
  - Axios
  - Recharts
  - Lucide React
- **Backend**:
  - Node.js & Express.js (Modular Monolith)
  - RESTful APIs with Swagger/OpenAPI 3.0
  - JWT Authentication & bcrypt password hashing
  - Express-Validator & Centralized Error Middleware
- **Database**:
  - MongoDB & Mongoose
  - Compound Unique Index constraints (`{ tripId: 1, seatNumber: 1 }`)
  - Multi-document transactions & aggregation pipelines
- **Testing**:
  - Jest & Supertest
  - In-memory replica set testing harness (`mongodb-memory-server`)

---

## 📋 Evaluation Priorities & Implemented Features

### 1. Core Passenger Workflow (End-to-End)
1. **User Registration & Login**: JWT issuance, secure session restoration, password hashing.
2. **Trip Search Engine**: Origin, destination, date, price, and bus type filters with case-insensitive search.
3. **Interactive Deck Seat Selection**: Visual 2+2 Seater and 2+1 Sleeper (Dual Lower & Upper Deck) layout with real-time seat status (Available, Selected, Booked).
4. **Checkout & Passenger Manifest**: Captures name, age, gender, boarding points, and contact info.
5. **Atomic Seat Booking**: Real-time locking with unique PNR generation (`ALG-XXXXXX`).
6. **Digital Ticket & Printable Layout**: Downloadable and printable ticket with route timeline, passenger list, and barcode mockup.
7. **Idempotent Cancellation & Simulated Refund**: Time-based refund calculation (80% / 50% / 0%) and instant seat release.

### 2. Admin Operations & Fleet Analytics
1. **Dashboard KPI Telemetry**: Total revenue, bookings count, occupancy percentage, and vehicle capacity computed via live MongoDB aggregation pipelines.
2. **Recharts Visualizations**: Time-series booking volume, revenue rankings by route, and bus occupancy rates.
3. **Bus Management**: Create, edit, and delete physical vehicles with automated seat layout generation.
4. **Route Management**: Configure origins, destinations, distance, duration, and intermediate boarding points.
5. **Trip Scheduling**: Assign vehicles and routes to specific dates and times with dynamic seat inventory.
6. **Passenger Manifest Generator**: Generates and prints official passenger roll calls per departure.
7. **Compliance Audit Trail**: Chronological immutable log of system events and state mutations.

### 3. Mission-Critical: Double-Booking Prevention
Two concurrent users can **never** secure the same seat on the same scheduled trip:
- **Database Level Constraint**: The `BookedSeat` collection enforces a compound unique index:
  ```javascript
  BookedSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });
  ```
- **WiredTiger Engine Lock**: When concurrent requests attempt to reserve the same seat, MongoDB locks the index. Exactly one request succeeds; the other triggers an `E11000 duplicate key error` or `WriteConflict`.
- **HTTP 409 Conflict**: The backend intercepts this conflict and aborts the transaction, returning an immediate HTTP 409 Conflict response.
- **Automated Verification**: Rigorous test in `backend/tests/booking.test.js` verifies simultaneous `Promise.all` requests.

---

## 💻 Setup & Installation Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB (v6.0 or higher running on `localhost:27017` or MongoDB Atlas URI)

### Step 1: Clone Repository & Setup Backend
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bus_booking_db
JWT_SECRET=algions_bus_booking_jwt_secret_key_prod_safe_2026
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Seed the Database
Populate the database with verified operators, buses, routes, trips, sample bookings, and audit logs:
```bash
npm run seed
```

### Step 4: Run Automated Tests
Execute the 40 automated Jest & Supertest tests:
```bash
npm test
```

### Step 5: Start Backend Server
```bash
npm run dev:backend
# or: cd backend && npm run dev
```
*Backend runs on `http://localhost:5000` with Swagger docs at `http://localhost:5000/api-docs`.*

### Step 6: Setup & Start Frontend
```bash
npm run dev:frontend
# or: cd frontend && npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Test Suite Execution Summary

```
PASS tests/admin.test.js
PASS tests/cancellation.test.js
PASS tests/booking.test.js
PASS tests/search.test.js
PASS tests/auth.test.js
PASS tests/authorization.test.js
PASS tests/health.test.js

Test Suites: 7 passed, 7 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        32.011 s
```

---

## 📐 Database Schema Summary

```
User (id, name, email [UK], password, role, phone, timestamps)
  │
  ├── places ──> Booking (id, pnr [UK], user, trip, passengers, seats, totalFare, status, cancellation)
  │                │
  │                └── reserves ──> BookedSeat (tripId, seatNumber [Compound UK], bookingId, status)
  │                                    │
  └── performs ──> AuditLog            └── holds ──> Trip (id, route, bus, operator, dates, fare, availableSeats)
                                                        ├── Route (sourceCity, destinationCity, stops, points)
                                                        └── Bus (busNumber [UK], layoutType, seatConfiguration)
                                                              └── BusOperator (code [UK], name, rating)
```

---

## 📄 License & Evaluation Rights
Developed specifically for the **Algions AI Labs Private Limited Full-Stack Web Development Assessment**. All rights reserved.

