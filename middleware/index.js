var middlewareObj = {};
var User = require("../models/user");
var Product = require("../models/product");

middlewareObj.checkAdmin = function(req, res, next) {
    if(req.isAuthenticated() && req.user.isAdmin) {
        next();
    } else {
        req.flash("error", "You need to be an admin to do that.");
        res.redirect("/products");
    }
};

middlewareObj.checkUser = function(req, res, next) {
    if(req.isAuthenticated()) {
        User.findById(req.params.id, function(err, foundUser) {
            if(err || !foundUser) {
                res.redirect("back");
            } else {
                if(foundUser.id === req.user.id) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that.");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");
    }
};

middlewareObj.checkExist = function(req, res, next) {
    User.find({username : req.body.username}, function(err, foundUsername) {
        if(err) {
            console.log(err);
        }
        if (foundUsername.length) {
            req.flash("error", "Email already exists.");
            res.redirect("back");
        } else {
            next();
        }
    });
};

module.exports = middlewareObj;