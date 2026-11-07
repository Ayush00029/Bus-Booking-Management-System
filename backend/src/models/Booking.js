const mongoose = require('mongoose');

const PassengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Passenger name is required'],
      trim: true
    },
    age: {
      type: Number,
      required: [true, 'Passenger age is required'],
      min: [1, 'Age must be at least 1'],
      max: [120, 'Age cannot exceed 120']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other']
    },
    seatNumber: {
      type: String,
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true
    },
    fare: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    pnr: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip reference is required'],
      index: true
    },
    tripSnapshot: {
      operatorName: String,
      operatorCode: String,
      busNumber: String,
      busType: String,
      sourceCity: String,
      destinationCity: String,
      departureDateTime: Date,
      arrivalDateTime: Date,
      distanceKm: Number,
      estimatedDurationMinutes: Number
    },
    passengers: {
      type: [PassengerSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A booking must have at least one passenger'
      }
    },
    seats: {
      type: [String],
      required: true
    },
    boardingPoint: {
      pointName: { type: String, required: true },
      landmark: { type: String, default: '' },
      time: { type: Date, required: true }
    },
    droppingPoint: {
      pointName: { type: String, required: true },
      landmark: { type: String, default: '' },
      time: { type: Date, required: true }
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true
    },
    totalFare: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PENDING', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PAID'
    },
    bookingStatus: {
      type: String,
      enum: ['CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true
    },
    cancellation: {
      cancelledAt: Date,
      cancellationReason: { type: String, default: '' },
      cancellationFee: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      refundPercentage: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'PROCESSED'],
        default: 'NONE'
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for passenger search and admin manifests
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ trip: 1, bookingStatus: 1 });

module.exports = mongoose.model('Booking', BookingSchema);

