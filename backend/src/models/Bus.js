const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema(
  {
    seatNumber: {
      type: String,
      required: true,
      trim: true
    },
    deck: {
      type: String,
      enum: ['lower', 'upper'],
      default: 'lower'
    },
    row: {
      type: Number,
      required: true
    },
    column: {
      type: Number,
      required: true
    },
    seatType: {
      type: String,
      enum: ['seater', 'sleeper', 'semi-sleeper'],
      default: 'seater'
    },
    isWindow: {
      type: Boolean,
      default: false
    },
    basePriceMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 3.0
    }
  },
  { _id: false }
);

const BusSchema = new mongoose.Schema(
  {
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusOperator',
      required: [true, 'Bus operator reference is required']
    },
    busNumber: {
      type: String,
      required: [true, 'Bus registration number is required'],
      unique: true,
      uppercase: true,
      trim: true
    },
    busType: {
      type: String,
      required: [true, 'Bus type is required'],
      enum: [
        'AC Sleeper (2+1)',
        'Non-AC Sleeper (2+1)',
        'AC Seater (2+2)',
        'Non-AC Seater (2+2)',
        'Volvo Multi-Axle AC'
      ]
    },
    layoutType: {
      type: String,
      enum: ['2+2_seater', '2+1_sleeper'],
      default: '2+2_seater'
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats count is required'],
      min: [10, 'Bus must have at least 10 seats'],
      max: [60, 'Bus cannot exceed 60 seats']
    },
    seatConfiguration: [SeatSchema],
    amenities: {
      type: [String],
      default: ['Water Bottle', 'Charging Point', 'Emergency Exit']
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Bus', BusSchema);

