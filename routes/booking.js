const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

// Show all user bookings
router.get("/", isLoggedIn, wrapAsync(bookingController.userBookings));

// Show booking form for a listing
router.get("/new/:id", isLoggedIn, wrapAsync(bookingController.renderBookingForm));

// Create new booking
router.post("/", isLoggedIn, wrapAsync(bookingController.createBooking));

// Show specific booking
router.get("/:id", isLoggedIn, wrapAsync(bookingController.showBooking));

// Cancel booking
router.delete("/:id", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;