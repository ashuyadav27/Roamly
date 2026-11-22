
const Listing = require("../models/listing");

// INDEX ROUTE
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// RENDER NEW FORM
module.exports.renderNewForm = async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to create listing!");
        return res.redirect("/login");
    }

    res.render("listings/new.ejs");
};

// SHOW ROUTE
module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("reviews")
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist.");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

// CREATE ROUTE
module.exports.createListing = async (req, res) => {
    const { path, filename } = req.file || {};

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;

    if (path && filename) {
        newListing.image = { url: path, filename: filename };
    }

    await newListing.save();

    req.flash("success", "New Listing Created.");

    res.redirect("/listings");
};

// RENDER EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist.");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
};

// UPDATE ROUTE
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true, runValidators: true }
    );

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist.");
        return res.redirect("/listings");
    }

    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;

        listing.image = { url, filename };

        await listing.save();
    }

    req.flash("success", "Listing Updated!");

    res.redirect(`/listings/${id}`);
};

// DESTROY ROUTE
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted!");

    res.redirect("/listings");
};
