
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");
const listingRouter = require("./routes/listing.js");

const app = express();
const PORT = process.env.PORT || 8080;

const dbUrl = process.env.ATLASDB_URL;
const secret = process.env.SECRET;

if (!dbUrl || !secret) {
    throw new Error("Missing environment variables");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret },
    touchAfter: 24 * 60 * 60
});

store.on("error", (err) => {
    console.log("Session Store Error:", err);
});

app.use(session({
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }
}));

app.use(flash());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/", userRouter);
app.use("/listings", listingRouter);

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).render("error.ejs", { err });
});

async function main() {
    await mongoose.connect(dbUrl);
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

main().catch((err) => {
    console.error("Database Connection Error:", err);
    process.exit(1);
});
