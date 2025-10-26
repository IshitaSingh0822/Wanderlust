
const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// New search functionality
module.exports.searchListings = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === "") {
      return res.json({ success: true, listings: [] });
    }

    // Search in title, location, and country (case-insensitive)
    const searchResults = await Listing.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { country: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    });

    res.json({ success: true, listings: searchResults });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, error: "Search failed" });
  }
};
module.exports.filterByCategory = async (req, res) => {
  const { category } = req.query;
  
  let listings;
  if (category) {
    listings = await Listing.find({ category: category }); // MongoDB will match if array contains the value
  } else {
    listings = await Listing.find({});
  }
  
  res.json({ success: true, listings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path:"reviews", populate:{path:"author"}}).populate("owner");
  if(!listing){
     req.flash("error", "Listing you requested for does not exist!");
     return res.redirect("/listings");
  }
  console.log(listing);
  
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  let url = req.file.path;
  let filename = req.file.filename;
   const newListing = new Listing(req.body.listing);
   newListing.owner= req.user._id;
   newListing.image = {url, filename};
   await newListing.save();
 
  req.flash("success", "Listing created successfully!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing){
     req.flash("error", "Listing you requested for does not exist!");
     return res.redirect("/listings");
  }
  let OriginalImageUrl = listing.image.url;
  OriginalImageUrl= OriginalImageUrl.replace("/upload" , "/upload/h_30,w_25/");
  res.render("listings/edit.ejs", { listing , OriginalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if( typeof req.file !== "undefined"){
  let url = req.file.path;
  let filename = req.file.filename;
  listing.image = {url, filename};
  await listing.save();
  }
  req.flash("success", "Listing Updated successfully!");
   return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted successfully!");
  res.redirect("/listings");
};