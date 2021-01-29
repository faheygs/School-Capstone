var middleware     = require("../middleware/index"),
    express        = require("express"),
    Product        = require("../models/product"),
    router         = express.Router(),
    Order          = require("../models/order"),
    User           = require("../models/user"),
    Cart           = require('../models/cart');



router.get('/add-to-cart/:id', function(req, res, next) {
    if(req.isAuthenticated()) {
        var productId = req.params.id;
        var cart = new Cart(req.session.cart ? req.session.cart : {});
        var qty = req.query.qty;
        
        Product.findById(productId, function(err, product) {
            if (err) {
                return res.redirect('/');
            }
            
            cart.add(product, product.id, qty);
            req.session.cart = cart;
            res.redirect('back');
        });
    } else {
        req.flash('error', "You must be logged in to do that.");
        res.redirect('back');
    }
});

router.get('/reduce/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('back');
});

router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('back');
});

router.get('/shopping-cart', function(req, res, next) {
  if(!req.session.cart) {
    return res.render('orders/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('orders/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', function(req, res, next) {
  if(!req.session.cart) {
    return res.redirect('/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0];
  res.render('orders/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', function(req, res, next) {
  if(!req.session.cart) {
    return res.redirect('/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);

  var stripe = require("stripe")("sk_test_UquCWGDcOnqeUCIT695ahY7H");

  stripe.charges.create({
    amount: cart.totalPrice * 100,
    currency: "usd",
    source: "tok_visa", // obtained with Stripe.js
    receipt_email: 'test@example.com'
  }, function(err, charge) {
    // asynchronously called
    if(err) {
      req.flash('error', err.message);
      return res.redirect('orders/checkout');
    }    
    var order = new Order({
      user: req.user,
      cart: cart,
      address: req.body.address,
      name: req.body.name,
      paymentId: charge.id
    });
    order.save(function(err, result) {
      req.flash('success', 'Successfully bought product');
      req.session.cart = 0;
      res.redirect('/');
    });
  });
});

module.exports = router;