
const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.renderBookingForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");
  
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  
  const existingBookings = await Booking.find({
    listing: id,
    bookingStatus: { $ne: 'Cancelled' }
  }).select('checkIn checkOut');
  
  res.render("bookings/new.ejs", { listing, existingBookings });
};

module.exports.createBooking = async (req, res) => {
  const { listingId } = req.query;
  const listing = await Listing.findById(listingId);
  
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  const { checkIn, checkOut, guests, name, email, phone, specialRequests } = req.body;
  
  // Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (checkInDate < today) {
    req.flash("error", "Check-in date cannot be in the past!");
    return res.redirect(`/bookings/new/${listingId}`);
  }
  
  if (checkOutDate <= checkInDate) {
    req.flash("error", "Check-out date must be after check-in date!");
    return res.redirect(`/bookings/new/${listingId}`);
  }
  
  // CHECK AVAILABILITY 
  const availability = await Booking.checkAvailability(listingId, checkInDate, checkOutDate);
  
  if (!availability.available) {
    req.flash("error", "Sorry! This property is already booked for the selected dates. Please choose different dates.");
    return res.redirect(`/bookings/new/${listingId}`);
  }
  
  // Calculate number of nights
  const numberOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  
  // Calculate total price (including 18% GST)
  const basePrice = listing.price * numberOfNights;
  const gst = basePrice * 0.18;
  const totalPrice = basePrice + gst;

  const newBooking = new Booking({
    listing: listingId,
    user: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: guests,
    numberOfNights: numberOfNights,
    totalPrice: totalPrice,
    paymentMethod: "COD",
    guestDetails: {
      name: name,
      email: email,
      phone: phone
    },
    specialRequests: specialRequests || ""
  });

  await newBooking.save();
  
  // Update listing stats for trending
  listing.bookingCount += 1;
  listing.recentBookings.push({ date: new Date() });
  await listing.save();
  
  req.flash("success", "Booking confirmed successfully! You will pay cash on arrival.");
  res.redirect(`/bookings/${newBooking._id}`);
};

module.exports.showBooking = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id)
    .populate("listing")
    .populate("user");
  
  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/listings");
  }

  // Check if user is authorized to view this booking
  if (!booking.user._id.equals(req.user._id)) {
    req.flash("error", "You don't have permission to view this booking!");
    return res.redirect("/listings");
  }

  res.render("bookings/show.ejs", { booking });
};

module.exports.userBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  
  res.render("bookings/index.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id);
  
  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings");
  }

  // Check if user owns this booking
  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You don't have permission to cancel this booking!");
    return res.redirect("/bookings");
  }

  booking.bookingStatus = "Cancelled";
  booking.paymentStatus = "Cancelled";
  await booking.save();

  req.flash("success", "Booking cancelled successfully!");
  res.redirect("/bookings");
};