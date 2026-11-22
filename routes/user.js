const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router.route("/signup")
.get(userController.renderSignupForm )
.post(wrapAsync(userController.signup));

router.route("/login")
.get(userController.renderLoginForm )
.post(
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true
    }),
    userController.login
);
// // Signup Route
// router.get("/signup", userController.renderSignupForm );

// // Signup POST Route
// router.post(
//     "/signup",
//     wrapAsync(userController.signup)
// );

// Login Route
// router.get("/login",userController.renderLoginForm );

// // Login POST Route

// router.post(
//     "/login",
//     saveRedirectUrl,
//     passport.authenticate("local", {
//         failureRedirect: "/login",
//         failureFlash: true
//     }),
//     userController.login
// );

// Logout Route
router.get("/logout",userController.logout);

module.exports = router;