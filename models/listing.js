const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    url: { type: String, required: false },
    filename: { type: String, required: false }
  },
  category: { 
    type: [String],
    default: []
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  recentBookings: [{
    date: {
      type: Date,
      default: Date.now
    }
  }],
  price: Number,
  location: String,
  country: String,
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

// Helper function to calculate if listing is trending
listingSchema.methods.isTrending = function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Count bookings in last 30 days
  const recentBookingsCount = this.recentBookings.filter(booking => 
    booking.date >= thirtyDaysAgo
  ).length;
  
  // Trending criteria: 3+ bookings in last 30 days
  return recentBookingsCount >= 3;
};

// Auto-categorize based on title, description, location, and trending status
listingSchema.pre('save', function(next) {
  const listing = this;
  const categories = [];
  const text = `${listing.title} ${listing.description} ${listing.location}`.toLowerCase();

  // Check for category keywords
  if (text.includes('mountain') || text.includes('hill') || text.includes('peak')) {
    categories.push('Mountains');
  }
  if (text.includes('castle') || text.includes('fort') || text.includes('palace')) {
    categories.push('Castles');
  }
  if (text.includes('pool') || text.includes('swimming')) {
    categories.push('Amazing Pools');
  }
  if (text.includes('camp') || text.includes('tent')) {
    categories.push('Camping');
  }
  if (text.includes('farm') || text.includes('farmhouse')) {
    categories.push('Farms');
  }
  if (text.includes('arctic') || text.includes('snow') || text.includes('ice')) {
    categories.push('Arctic');
  }
  if (text.includes('desert') || text.includes('sand')) {
    categories.push('Desert');
  }
  if (text.includes('sea') || text.includes('ocean') || text.includes('beach')) {
    categories.push('Sea view');
  }
  if (text.includes('city') || text.includes('urban') || text.includes('downtown')) {
    categories.push('Iconic Cities');
  }
  if (text.includes('room') || text.includes('bedroom') || text.includes('suite')) {
    categories.push('Rooms');
  }

  // Clean up old bookings (keep only last 60 days for performance)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  listing.recentBookings = listing.recentBookings.filter(booking => 
    booking.date >= sixtyDaysAgo
  );

  // Check if trending based on recent bookings
  if (listing.isTrending()) {
    categories.push('Trending');
  }

  // Remove duplicates and update
  listing.category = [...new Set(categories)];
  next();
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;