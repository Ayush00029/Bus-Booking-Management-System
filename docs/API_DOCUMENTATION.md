# REST API Reference & Endpoint Specifications

The Bus Booking Management System provides a clean, predictable REST API adhering to JSON standards and RFC HTTP status codes.

Base URL: `http://localhost:5000/api`
Interactive Swagger Documentation: `http://localhost:5000/api-docs`

---

## 1. Authentication & Identity (`/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "password": "password123",
    "phone": "+91 98765 43210",
    "role": "passenger"
  }
  ```
- **Responses**:
  - `201 Created`: Returns created user profile and signed JWT token.
  - `409 Conflict`: Email already exists.
  - `422 Unprocessable Entity`: Validation failure.

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "priya@example.com",
    "password": "password123"
  }
  ```
- **Responses**:
  - `200 OK`: Returns user profile and signed JWT.
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Get Current Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Access**: Authenticated (`Bearer <token>`)
- **Responses**:
  - `200 OK`: Returns authenticated user profile.
  - `401 Unauthorized`: Token missing or invalid.

---

## 2. Bus & Operator Inventory (`/buses`)

### 2.1 Get Operators
- **Method**: `GET`
- **Path**: `/buses/operators`
- **Access**: Public

### 2.2 Create Operator
- **Method**: `POST`
- **Path**: `/buses/operators`
- **Access**: Admin only

### 2.3 List Buses
- **Method**: `GET`
- **Path**: `/buses`
- **Access**: Public

### 2.4 Create Bus Vehicle
- **Method**: `POST`
- **Path**: `/buses`
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "operator": "65f0451...",
    "busNumber": "KA-01-AB-1234",
    "busType": "AC Sleeper (2+1)",
    "layoutType": "2+1_sleeper",
    "totalSeats": 30
  }
  ```
- Automatically generates Lower/Upper deck seat coordinates, window flags, and price multipliers.

---

## 3. Routes (`/routes`)

### 3.1 List Routes
- **Method**: `GET`
- **Path**: `/routes`
- **Access**: Public

### 3.2 Distinct Cities (Autocomplete)
- **Method**: `GET`
- **Path**: `/routes/cities`
- **Access**: Public

### 3.3 Create Route
- **Method**: `POST`
- **Path**: `/routes`
- **Access**: Admin only

---

## 4. Trips & Search (`/trips`)

### 4.1 Passenger Search Engine
- **Method**: `GET`
- **Path**: `/trips/search?origin=Bengaluru&destination=Chennai&travelDate=2026-11-10`
- **Access**: Public
- **Query Parameters**:
  - `origin` (required)
  - `destination` (required)
  - `travelDate` (YYYY-MM-DD)
  - `busType` (optional filter)
  - `sortBy` (`departure`, `fare`, `duration`, `seats`)
  - `sortOrder` (`asc`, `desc`)
- **Response**: Array of scheduled trips with populated operator, bus, route, and available seats.

### 4.2 Get Trip Details with Live Seat Layout
- **Method**: `GET`
- **Path**: `/trips/:id`
- **Access**: Public
- **Headers**: `x-client-token: <client_session_uuid>` (optional, identifies holding user)
- **Response**: Trip details augmented with live `seatLayout` array: each seat indicates `status: 'available'`, `status: 'selected'` (held by current client), `status: 'locked'` (temporarily held by another passenger), or `status: 'booked'`. Also returns `lockRemainingSeconds` for active holds.

### 4.3 Temporary Real-Time Seat Locking
- **Method**: `POST`
- **Path**: `/trips/:id/lock-seats`
- **Access**: Public / Passenger
- **Request Body**:
  ```json
  {
    "seatNumbers": ["1A", "1B"],
    "lockDurationMinutes": 10
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "tripId": "65f045...",
      "lockedSeats": ["1A", "1B"],
      "expiresAt": "2026-11-09T14:40:00.000Z",
      "expiresInSeconds": 600
    },
    "message": "Seats locked successfully"
  }
  ```
- **Error Response** (`409 Conflict`):
  ```json
  {
    "success": false,
    "message": "Berth(s) 1A are currently held by another passenger. Please select another berth."
  }
  ```

### 4.4 Release Seat Lock
- **Method**: `POST`
- **Path**: `/trips/:id/unlock-seats`
- **Access**: Public / Passenger
- **Request Body**:
  ```json
  {
    "seatNumbers": ["1A"]
  }
  ```
- **Response** (`200 OK`): Releases the hold immediately in MongoDB.

### 4.5 Schedule New Trip
- **Method**: `POST`
- **Path**: `/trips`
- **Access**: Admin only

---

## 5. Bookings & Double-Booking Prevention (`/bookings`)

### 5.1 Confirm Booking (Atomic Double-Booking Guard)
- **Method**: `POST`
- **Path**: `/bookings`
- **Access**: Authenticated Passenger
- **Request Body**:
  ```json
  {
    "tripId": "65f045...",
    "passengers": [
      { "name": "Rahul Sharma", "age": 29, "gender": "Male", "seatNumber": "1A" }
    ],
    "boardingPoint": { "pointName": "Majestic Bus Stand", "time": "2026-11-10T22:00:00.000Z" },
    "droppingPoint": { "pointName": "Koyambedu CMBT", "time": "2026-11-11T05:00:00.000Z" },
    "contactEmail": "rahul@gmail.com",
    "contactPhone": "+91 98765 43210"
  }
  ```
- **Responses**:
  - `201 Created`: Unique PNR generated, seats locked in `BookedSeat`, `availableSeats` decremented.
  - `409 Conflict`: One or more seats are already booked. Database compound unique constraint prevents any double booking.

### 5.2 My Bookings History
- **Method**: `GET`
- **Path**: `/bookings/my-bookings`
- **Access**: Authenticated Passenger

### 5.3 Lookup Ticket by PNR (Authenticated Owner or Admin)
- **Method**: `GET`
- **Path**: `/bookings/pnr/:pnr`
- **Access**: Authenticated Passenger (must own the booking) or Admin
- **Responses**:
  - `200 OK`: Returns booking details.
  - `403 Forbidden`: Passenger attempts to access another passenger's booking.
  - `404 Not Found`: PNR does not exist.

### 5.4 Public Ticket Lookup (Guests & Quick Access)
- **Method**: `GET`
- **Path**: `/bookings/lookup?pnr=:pnr&contact=:emailOrPhone`
- **Access**: Public
- **Query Parameters**:
  - `pnr` (required): PNR identifier (e.g. `ALG-89A7B2`)
  - `contact` (optional): Passenger email or phone number for security matching
- **Responses**:
  - `200 OK`: Returns verified digital ticket information.
  - `403 Forbidden`: Email/phone fails to match ticket record.
  - `404 Not Found`: PNR not found.

### 5.5 Cancel Booking & Simulated Refund
- **Method**: `POST`
- **Path**: `/bookings/:id/cancel`
- **Access**: Authenticated Passenger (owner) or Admin
- **Request Body**:
  ```json
  { "cancellationReason": "Change of plans" }
  ```
- **Responses**:
  - `200 OK`: Booking marked `CANCELLED`, seats released atomically in `BookedSeat`, refund calculated (80%, 50%, or 0%), `availableSeats` restored.
  - `400 Bad Request`: Already cancelled (idempotent).
  - `403 Forbidden`: Not owner of booking.

---

## 6. Admin Reporting & Audit Logs (`/admin`)

### 6.1 Real Database Dashboard Metrics
- **Method**: `GET`
- **Path**: `/admin/dashboard`
- **Access**: Admin only
- **Response**: Aggregated revenue, total bookings, fleet occupancy rate, active trips.

### 6.2 Visual Analytics Data
- **Method**: `GET`
- **Path**: `/admin/analytics`
- **Access**: Admin only
- **Response**: Time-series booking trends, route revenue rankings, bus occupancy breakdown for Recharts.

### 6.3 Passenger Manifest
- **Method**: `GET`
- **Path**: `/admin/manifest/:tripId`
- **Access**: Admin only
- **Response**: Complete passenger manifest with seat numbers, names, ages, contact numbers, and boarding points.

### 6.4 System Audit Trail
- **Method**: `GET`
- **Path**: `/admin/audit-logs`
- **Access**: Admin only
- **Response**: Chronological mutation audit logs with user IDs, action names, timestamps, and JSON details.

