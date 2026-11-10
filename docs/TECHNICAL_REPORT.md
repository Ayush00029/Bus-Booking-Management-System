# Engineering Technical Report
**Algions AI Labs Full-Stack Web Development Assessment**
**Author**: Full-Stack Software Engineering Candidate

---

## 1. System Architecture Decision & Trade-Offs

### 1.1 Architectural Pattern: Modular Monolith vs Microservices
For an internship assessment and mid-scale travel booking platform, a **Modular Monolith** was purposefully chosen over microservices.
- **Benefits**:
  - Eliminates network overhead, distributed tracing complexity, and eventual consistency lag.
  - Allows strict database-level ACID transactions across reservations, seat locks, and booking creation.
  - Clean directory boundary separation (`models/`, `services/`, `controllers/`, `routes/`, `validators/`, `middleware/`) allows seamless horizontal extraction into microservices if volume demands it in the future.
- **Trade-Off**: Scaling requires scaling the entire monolith rather than individual services; however, with stateless JWT authentication and connection pooling, vertical and horizontal container scaling is trivial.

---

## 2. Deep Dive: Double-Booking Prevention Strategy

Preventing two users from securing the same seat concurrently is the cornerstone of any ticketing system. Simple frontend disablement or naive `if (seat.isBooked) return error` checks suffer from the classic **Time-of-Check to Time-of-Use (TOCTOU)** race condition.

### 2.1 The Solution: Four-Tier Defense
1. **Tier 1: Pre-Checkout Real-Time Seat Locking (`SeatLock` Collection)**:
   - When a passenger selects a berth on the visual seat map, a `POST /trips/:id/lock-seats` request holds that seat for **10 minutes**.
   - MongoDB automatically enforces a **TTL index** (`expiresAt: { expires: 0 }`), purging abandoned holds without requiring manual cron jobs.
   - Any other passenger opening or polling the trip sees the berth marked as `status: 'locked'` with an amber badge ("Held by Others"), preventing selection attempts.
   - If user unselects or navigates away, `POST /trips/:id/unlock-seats` frees the berth immediately.
2. **Tier 2: Application-Level Fast Filter**: Fast query checking if requested seats are listed in active reservations.
3. **Tier 3: Dedicated `BookedSeat` Collection with Compound Unique Index**:
   ```javascript
   BookedSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });
   ```
   - Two concurrent HTTP requests attempting to insert `{ tripId: T, seatNumber: '1A' }` collide directly at the MongoDB storage engine level.
   - WiredTiger uses document-level row locks. Exactly one insert writes successfully; the second insert fails immediately with an `E11000 duplicate key error`.
4. **Tier 4: Transaction Rollback & 409 Conflict Response**:
   - The entire booking operation runs in a transaction session.
   - On duplicate key conflict or transaction conflict, any intermediate state is aborted.
   - The user receives an immediate **HTTP 409 Conflict** error with a polite notification explaining that the seat was claimed a fraction of a second earlier.
   - Upon successful payment, temporary `SeatLock` documents are atomically converted and deleted.

### 2.2 Automated Verification
In `backend/tests/booking.test.js`, our concurrent simulation test spawns simultaneous `Promise.all` requests targeting the exact same seat:
- Exactly 1 request receives `201 Created`.
- Exactly 1 request receives `409 Conflict`.
- Database query confirms that exactly 1 record was written.

---

## 3. Idempotent Cancellation & Simulated Refund Engine

### 3.1 Time-Decayed Refund Model
Real transport platforms implement tiered cancellation charges based on notice time:
- **> 24 hours prior to departure**: 80% refund (20% administrative fee)
- **Between 12 and 24 hours prior**: 50% refund (50% fee)
- **< 12 hours prior or past departure**: 0% refund (100% forfeiture)

### 3.2 Idempotency and Atomic Seat Release
- If a user triggers cancellation on an already cancelled ticket, the server immediately returns a `400 Bad Request` ("This booking has already been cancelled").
- Upon valid cancellation, `BookedSeat.deleteMany({ bookingId })` executes inside an atomic operation, instantly releasing the compound unique constraint so other searching passengers can immediately view and book those seats.
- `trip.availableSeats` is restored.
- The action is recorded in `AuditLog`.

---

## 4. Security, Authorization & Auditing

1. **Role-Based Access Control (RBAC)**:
   - Server-side authorization in `authMiddleware.js`: `requireAuth` validates JWT signature; `requireRole('admin')` strictly bars regular passengers with `403 Forbidden`.
   - Passenger endpoints verify that `booking.user.equals(req.user._id)`. A passenger can never view, download, or cancel another passenger's ticket.
2. **Password Security**:
   - Passwords hashed with `bcryptjs` (salt rounds: 10).
   - In Mongoose schema: `select: false` prevents passwords from accidentally being returned in database queries or API responses.
3. **Compliance Audit Trail**:
   - `AuditLog` records every administrative change and booking action with timestamp, user ID, role, action name, entity type, and sanitized JSON details (stripping tokens and passwords).

---

## 5. Testing & Verification Summary

All 40 automated tests executed with Jest and Supertest pass with 100% success across 7 test suites:
- `tests/health.test.js` (3/3 passed)
- `tests/auth.test.js` (9/9 passed)
- `tests/authorization.test.js` (4/4 passed)
- `tests/search.test.js` (6/6 passed)
- `tests/booking.test.js` (5/5 passed)
- `tests/cancellation.test.js` (5/5 passed)
- `tests/admin.test.js` (8/8 passed)

Total: **40 passed, 40 total (100% pass rate)**.

