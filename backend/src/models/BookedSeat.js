const mongoose = require('mongoose');

const BookedSeatSchema = new mongoose.Schema(
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
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
      index: true
    },
    passengerName: {
      type: String,
      required: true,
      trim: true
    },
    seatFare: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['BOOKED', 'CANCELLED'],
      default: 'BOOKED'
    }
  },
  {
    timestamps: true
  }
);

/**
 * CRITICAL DATABASE-LEVEL INTEGRITY CONSTRAINT:
 * Compound unique index on (tripId, seatNumber).
 * Two active reservations for the exact same seat on the exact same trip
 * are strictly rejected by the database storage engine.
 */
BookedSeatSchema.index({ tripId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('BookedSeat', BookedSeatSchema);

