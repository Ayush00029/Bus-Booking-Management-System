const mongoose = require('mongoose');

const IntermediateStopSchema = new mongoose.Schema(
  {
    stopName: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    distanceFromOriginKm: {
      type: Number,
      required: true,
      min: 0
    },
    haltDurationMinutes: {
      type: Number,
      default: 10,
      min: 0
    },
    stopSequence: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const PointSchema = new mongoose.Schema(
  {
    pointName: {
      type: String,
      required: true,
      trim: true
    },
    landmark: {
      type: String,
      default: '',
      trim: true
    },
    timeOffsetMinutes: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const RouteSchema = new mongoose.Schema(
  {
    sourceCity: {
      type: String,
      required: [true, 'Source city is required'],
      trim: true,
      index: true
    },
    destinationCity: {
      type: String,
      required: [true, 'Destination city is required'],
      trim: true,
      index: true
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [1, 'Distance must be at least 1 km']
    },
    estimatedDurationMinutes: {
      type: Number,
      required: [true, 'Estimated duration in minutes is required'],
      min: [15, 'Estimated duration must be at least 15 minutes']
    },
    intermediateStops: [IntermediateStopSchema],
    boardingPoints: {
      type: [PointSchema],
      default: []
    },
    droppingPoints: {
      type: [PointSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast route searches
RouteSchema.index({ sourceCity: 1, destinationCity: 1, isActive: 1 });

module.exports = mongoose.model('Route', RouteSchema);

