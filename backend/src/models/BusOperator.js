const mongoose = require('mongoose');

const BusOperatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Operator name is required'],
      trim: true,
      maxlength: [120, 'Operator name cannot exceed 120 characters']
    },
    code: {
      type: String,
      required: [true, 'Operator short code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, 'Operator code must be at least 2 characters'],
      maxlength: [10, 'Operator code cannot exceed 10 characters']
    },
    contactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    rating: {
      type: Number,
      min: 1.0,
      max: 5.0,
      default: 4.5
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

module.exports = mongoose.model('BusOperator', BusOperatorSchema);

