/*const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.
route("/signup")
.get(userController.renderSignupForm)
.post( wrapAsync(userController.signup));

router.
route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login" , 
    failureFlash: true,
 }),
 userController.login
);
router.get("/logout", userController.logout);
module.exports = router;*/

const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

// Enhanced login with better error handling
router.route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        // Trim username before authentication
        (req, res, next) => {
            if (req.body.username) {
                req.body.username = req.body.username.trim();
            }
            if (req.body.password) {
                req.body.password = req.body.password.trim();
            }
            next();
        },
        passport.authenticate("local", { 
            failureRedirect: "/login",
            failureFlash: true,
            failureMessage: 'Invalid username or password.'
        }),
        userController.login
    );

router.get("/logout", userController.logout);

module.exports = router;
