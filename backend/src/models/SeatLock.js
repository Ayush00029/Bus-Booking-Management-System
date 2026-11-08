const mongoose = require('mongoose');

/**
 * SeatLock Schema
 * Temporary real-time seat hold engine before checkout.
 * Auto-expires using MongoDB TTL index after 10 minutes.
 */
const SeatLockSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true
    },
    lockedBy: {
      type: String,
      required: [true, 'Identifier of locking user or session is required'],
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // MongoDB TTL index: automatically deletes expired documents!
    }
  },
  {
    timestamps: true
  }
);

/**
 * Compound unique index on (tripId, seatNumber).
 * Guarantees that only ONE user can hold or lock a specific seat on a trip.
 */
SeatLockSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('SeatLock', SeatLockSchema);

