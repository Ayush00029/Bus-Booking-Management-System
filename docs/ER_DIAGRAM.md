# Entity-Relationship (ER) Diagram & Schema Specifications

This document outlines the database schema, entity relationships, integrity constraints, and indexing strategy for the **Bus Booking Management System** (Algions AI Labs Internship Assessment).

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ Booking : "places"
    User ||--o{ AuditLog : "initiates"
    BusOperator ||--|{ Bus : "owns"
    BusOperator ||--o{ Trip : "operates"
    Bus ||--o{ Trip : "assigned_to"
    Route ||--o{ Trip : "defines_path"
    Trip ||--o{ Booking : "receives"
    Trip ||--o{ BookedSeat : "holds_reservations"
    Booking ||--|{ BookedSeat : "reserves"

    User {
        ObjectId _id PK
        string name
        string email UK "Indexed, unique"
        string password "bcrypt hashed, select false"
        string role "passenger | admin"
        string phone
        date createdAt
        date updatedAt
    }

    BusOperator {
        ObjectId _id PK
        string name
        string code UK "Indexed, unique code (e.g., KSRTC)"
        string contactPhone
        string contactEmail
        string address
        number rating "1.0 - 5.0"
        boolean isActive
    }

    Bus {
        ObjectId _id PK
        ObjectId operator FK "ref: BusOperator"
        string busNumber UK "Indexed, unique"
        string busType "AC Sleeper | AC Seater | Volvo"
        string layoutType "2+2_seater | 2+1_sleeper"
        number totalSeats "10 - 60"
        array seatConfiguration "deck, row, column, window, multiplier"
        array amenities
        string status "active | maintenance | inactive"
    }

    Route {
        ObjectId _id PK
        string sourceCity "Compound indexed"
        string destinationCity "Compound indexed"
        number distanceKm
        number estimatedDurationMinutes
        array intermediateStops "stopName, city, distanceFromOriginKm"
        array boardingPoints "pointName, landmark, timeOffsetMinutes"
        array droppingPoints "pointName, landmark, timeOffsetMinutes"
        boolean isActive "Compound indexed"
    }

    Trip {
        ObjectId _id PK
        ObjectId route FK "ref: Route"
        ObjectId bus FK "ref: Bus"
        ObjectId operator FK "ref: BusOperator"
        date departureDateTime "Indexed"
        date arrivalDateTime
        number baseFare
        number totalSeats
        number availableSeats
        string status "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED"
    }

    BookedSeat {
        ObjectId _id PK
        ObjectId tripId FK "Compound UK: (tripId, seatNumber)"
        string seatNumber "Compound UK: (tripId, seatNumber)"
        ObjectId bookingId FK "ref: Booking"
        string passengerName
        number seatFare
        string status "BOOKED | CANCELLED"
        date createdAt
    }

    Booking {
        ObjectId _id PK
        string pnr UK "Indexed, unique (e.g., ALG-XXXXXX)"
        ObjectId user FK "ref: User"
        ObjectId trip FK "ref: Trip"
        object tripSnapshot "Immutable historical record"
        array passengers "name, age, gender, seatNumber, fare"
        array seats "seat numbers array"
        object boardingPoint "pointName, landmark, time"
        object droppingPoint "pointName, landmark, time"
        string contactEmail
        string contactPhone
        number totalFare
        string paymentStatus "PAID | REFUNDED"
        string bookingStatus "CONFIRMED | CANCELLED"
        object cancellation "cancelledAt, reason, fee, refundAmount, status"
    }

    AuditLog {
        ObjectId _id PK
        ObjectId userId FK "ref: User (nullable)"
        string userRole "passenger | admin | system"
        string action "BOOKING_CREATE | BOOKING_CANCEL | BUS_CREATE"
        string entityType "User | Bus | Route | Trip | Booking | System"
        string entityId
        object details "Sanitized metadata without secrets"
        string ipAddress
        date timestamp "Indexed"
    }
```

---

## 2. Key Architectural Constraints & Compound Indexes

### 2.1 The Double-Booking Prevention Compound Unique Index
To guarantee that two users can never book the exact same seat on the exact same trip:
```javascript
// BookedSeat Collection
BookedSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });
```
- **Storage-Engine Enforcement**: Even if two HTTP requests arrive in parallel and pass the application-level availability check at the exact same millisecond, MongoDB's WiredTiger storage engine locks the index bucket on write.
- **Immediate Rejection**: One write commits, while the other raises an `E11000 duplicate key error` or `WriteConflict` transaction abort.
- **Clean Conflict Response**: The backend converts this error into an **HTTP 409 Conflict** error:
  `{ success: false, message: "One or more selected seats are no longer available. Please select different seats." }`

### 2.2 Search Optimization Index
```javascript
// Trip Collection
TripSchema.index({ route: 1, departureDateTime: 1, status: 1 });
```
- Accelerates passenger search queries matching route and calendar dates.

### 2.3 Route Origin-Destination Index
```javascript
// Route Collection
RouteSchema.index({ sourceCity: 1, destinationCity: 1, isActive: 1 });
```
- Enables instant case-insensitive route resolution.

### 2.4 PNR Uniqueness Index
```javascript
// Booking Collection
BookingSchema.index({ pnr: 1 }, { unique: true });
```
- Guarantees $O(1)$ ticket lookup and global uniqueness across millions of bookings.

