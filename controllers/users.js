const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async(req, res, next) => {
    try {
        let { username, email, password } = req.body;
        
        // CRITICAL: Trim whitespace and normalize
        username = username.trim();
        email = email.trim().toLowerCase();
        password = password.trim();  // Remove accidental spaces
        
        // Validate inputs
        if (!username || !email || !password) {
            req.flash("error", "All fields are required!");
            return res.redirect("/signup");
        }
        
        if (password.length < 6) {
            req.flash("error", "Password must be at least 6 characters long!");
            return res.redirect("/signup");
        }
        
        // Create new user
        const newUser = new User({ email, username });
        
        // Register with passport-local-mongoose (handles hashing automatically)
        const registeredUser = await User.register(newUser, password);
        
        console.log("User registered successfully:", registeredUser.username);
        
        // Auto-login after signup
        req.login(registeredUser, (err) => {
            if (err) {
                console.error("Login after signup error:", err);
                return next(err);
            }
            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });
        
    } catch(e) {
        console.error("Signup error:", e);
        
        // Better error messages
        if (e.name === 'UserExistsError') {
            req.flash("error", "A user with this username already exists!");
        } else if (e.code === 11000) {
            req.flash("error", "This email is already registered!");
        } else {
            req.flash("error", e.message);
        }
        
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async(req, res) => {
    console.log("Login successful for user:", req.user.username);
    req.flash("success", "Welcome back to Wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};





 
