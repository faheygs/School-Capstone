var middleware     = require("../middleware/index"),
    nodemailer     = require("nodemailer"),
    passport       = require("passport"),
    express        = require("express"),
    router         = express.Router(),
    crypto         = require("crypto"),
    async          = require("async"),
    User           = require("../models/user");

//===============================
// GET ROUTES TO INDEX AND ABOUT
//===============================

//root get route
router.get("/", function(req, res) {
    res.render("index", {page : "home"});
});

//about get route
router.get("/about", function(req, res) {
    res.render("about", {page : "about"});
});


//==============================
// LOGIN POST AND GET ROUTES
//==============================

//login get route, show login form
router.get("/login", function(req, res) {
    res.render("login", {page : "login"});
});

//handling login logic
//middleware calls authenticate method via passport-local-mongoose package
router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login"
}), function(req, res) {
    //nothing happens here
});


//==============================
// REGISTER POST AND GET ROUTES
//==============================

//register get route, show register form
router.get("/register", function(req, res) {
    res.render("register", {page : "register"});
});


//post route for sign up logic
router.post("/register", function(req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    });
    
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            req.flash("error", err.message);
        } else {
            passport.authenticate("local")(req, res, function() {
                req.flash("success", "Welcome " + user.username + "!");
                res.redirect("/");
            });
        }
    });
});


//==============================
// LOGOUT ROUTE
//==============================
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});


//==============================
// FORGOT PASSWORD GET AND POST
//==============================

// forgot password get route
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

//forgot password post route
router.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        
        function(token, done) {
            User.findOne({ username: req.body.username }, function(err, user) {
                if(err) {
                    req.flash("error", err.message);
                }
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
         
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'billy.bobby.test.email.2018@gmail.com',
                    pass: process.env.GMAIL_PASS
                }
            });
            
            var mailOptions = {
                to: user.username,
                from: 'faheygs@gmail.com',
                subject: 'Shannanigans Password Reset',
                text: 'You are receiving this because you (or someone else) has requested the reset of the password for your account.\n\n' +
                        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) {
            req.flash("error", err.message);
            return next(err);
        }
        res.redirect('/forgot');
    });
});


//======================================
// GET AND POST FOR PASSWORD TOKEN RESET
//======================================

//get route for token to be used for password reset
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err) {
            req.flash("error", err.message);
        }
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if(err) {
                    req.flash("error", err.message);
                    
                }
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        if(err) {
                            req.flash("error", err.message);
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
    
                        user.save(function(err) {
                            if(err) {
                                req.flash("error", err.message);
                            }
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'billy.bobby.test.email.2018@gmail.com',
                    pass: process.env.GMAIL_PASS
                }
            });
            var mailOptions = {
                to: user.username,
                from: 'faheygs@mail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                        'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ],
    function(err) {
        if(err) {
            req.flash("error", err.message);
        }
        res.redirect('/');
    });
});

module.exports = router;