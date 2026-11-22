
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const flash = require("connect-flash");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const userRouter = require("./routes/user.js");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

app.engine("ejs", ejsMate);

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error" , () => {
    console.log("error in mongosession store", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// User routes
app.use("/", userRouter);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/demouser", async (req, res) => {
    let fakeUser = new User({
        email: "student2@gmail.com",
        username: "delta-student2",
    });

    let registeredUser = await User.register(
        fakeUser,
        "helloworld"
    );

    res.json(registeredUser);
});

// Listing validation middleware
const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Review validation middleware
const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


const listingRouter = require("./routes/listing.js");

app.use("/listings", listingRouter);

// 404 handler - sabhi routes ke baad
app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// Error handler - sabse aakhir mein
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;

    res.status(statusCode).render("error.ejs", { err });
});

// const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';


const dbUrl = process.env.ATLASDB_URL;

async function main() {
    if (!dbUrl) {
        throw new Error("ATLASDB_URL is missing from .env file");
    }

    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB Atlas successfully!");
}

main()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is listening at port ${port}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
    });
