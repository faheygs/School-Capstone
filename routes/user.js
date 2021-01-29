var middleware     = require("../middleware/index"),
    express        = require("express"),
    router         = express.Router(),
    User           = require("../models/user"),
    Cart           = require("../models/cart"),
    Order          = require("../models/order");

//======================================
// GET ROUTE FOR USER PROFILE
//======================================

//show user profile
router.get("/:id", middleware.checkUser, function(req, res) {
    Order.find({user : req.user}, function(err, orders) {
        if(err) {
            console.log(err);
            res.redirect("/");
        } else {
            var cart;
            orders.forEach(function(order) {
                cart = new Cart(order.cart);
                order.items = cart.generateArray();
            });
            res.render("users/show", {orders : orders, user: req.user});
        }
    });
});

//put request for updating user info
router.post("/:id", middleware.checkUser, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if(err) {
            console.log(err);
        }
        
        if(foundUser.username !== req.body.username) {
            middleware.checkExist;
            foundUser.username = req.body.username;
            foundUser.save();
            req.flash("success", "Email has been changed successfully, please re-login to verify cahnges.");
            return res.redirect("/login");
        }
        
        if(foundUser.firstName !== req.body.firstName) {
            foundUser.firstName = req.body.firstName;
        }
        
        if(foundUser.lastName !== req.body.lastName) {
            foundUser.lastName = req.body.lastName;
        }

        if(req.body.password !== "") {
            if(req.body.password === req.body.confirm) {
                foundUser.setPassword(req.body.password, function(err) {
                    if(err) {
                        req.flash("error", err.message);
                    }
                    foundUser.save();
                });
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
        }

        foundUser.save();
        req.flash("success", "Your changes have been saved!")
        res.redirect("/users/" + foundUser.id);
    });
});

module.exports = router;