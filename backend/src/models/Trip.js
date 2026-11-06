const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema(
  {
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required']
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus reference is required']
    },
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Operator reference is required']
    },
    departureDateTime: {
      type: Date,
      required: [true, 'Departure date and time is required'],
      index: true
    },
    arrivalDateTime: {
      type: Date,
      required: [true, 'Arrival date and time is required']
    },
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: [50, 'Base fare must be at least 50']
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats count is required'],
      min: 1
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats count is required'],
      min: 0
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for trip search optimization
TripSchema.index({ route: 1, departureDateTime: 1, status: 1 });
TripSchema.index({ operator: 1, departureDateTime: 1 });

module.exports = mongoose.model('Trip', TripSchema);

