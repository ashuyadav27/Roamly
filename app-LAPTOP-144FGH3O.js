const express = require("express");
const app = express();
const port = 8080;
const Listing = require("./models/listing.js");
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema , reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

const listings = require("./routes/listing.js");
const review = require("./routes/review.js");

app.set("view engine", "ejs");
app.set("views",path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.engine("ejs", ejsMate);

const cors = require("cors");
app.use(cors());

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

main().then(() => {
    console.log("connected to database.")
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);

}

//For start server
app.listen(port , () => {
    console.log("server is listening at port 8080.");
});



app.use("/listings" , listings);
app.use("/listings/:id/reviews" , review);


// 404 handler - sabhi routes ke baad
app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error handler - sabse aakhir mein
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    res.status(statusCode).render("error.ejs", { err });
});
