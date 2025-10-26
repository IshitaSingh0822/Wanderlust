const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  numberOfNights: {
    type: Number,
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    default: "COD",
    enum: ["COD"]
  },
  paymentStatus: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Paid", "Cancelled"]
  },
  bookingStatus: {
    type: String,
    default: "Confirmed",
    enum: ["Confirmed", "Cancelled", "Completed"]
  },
  guestDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  specialRequests: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to check if dates are available for booking
bookingSchema.statics.checkAvailability = async function(listingId, checkIn, checkOut, excludeBookingId = null) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Build query to find conflicting bookings
  const query = {
    listing: listingId,
    bookingStatus: { $ne: 'Cancelled' }, // Ignore cancelled bookings
    $or: [
      // Case 1: New booking starts during existing booking
      {
        checkIn: { $lte: checkInDate },
        checkOut: { $gt: checkInDate }
      },
      // Case 2: New booking ends during existing booking
      {
        checkIn: { $lt: checkOutDate },
        checkOut: { $gte: checkOutDate }
      },
      // Case 3: New booking completely contains existing booking
      {
        checkIn: { $gte: checkInDate },
        checkOut: { $lte: checkOutDate }
      }
    ]
  };
  
  // If updating an existing booking, exclude it from the check
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBookings = await this.find(query);
  
  return {
    available: conflictingBookings.length === 0,
    conflictingBookings: conflictingBookings
  };
};

module.exports = mongoose.model("Booking", bookingSchema);