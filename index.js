//use .env file for environment vars
require('dotenv').config();

//requring necessary packages for app
var methodOverride = require("method-override"),
    LocalStrategy  = require("passport-local"),
    bodyParser     = require("body-parser"),
    passport       = require("passport"),
    mongoose       = require("mongoose"),
    session        = require('express-session'),
    Product        = require("./models/product"),
    MongoStore     = require('connect-mongo')(session),
    express        = require("express"),
    multer         = require("multer"),
    Order          = require("./models/order"),
    flash          = require("connect-flash"),
    User           = require("./models/user"),
    app            = express();
    

//=======================
//INCLUDE ALL ROUTES
//=======================

var productRoute = require("./routes/product"),
    indexRoute   = require("./routes/index"),
    orderRoute   = require("./routes/order"),
    userRoute    = require("./routes/user");


//=======================
//SETTING APP USE AND SET
//=======================
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());


//=====================
//CONNECTION TO MONGODB
//=====================
mongoose.connect("mongodb+srv://admin:admin@shannanigans-cpest.mongodb.net/test?retryWrites=true&w=majority", { useUnifiedTopology: true, useNewUrlParser: true });


//====================================================
//NOTIFICATION IF ERROR OCCURS WHILE TRYING TO CONNECT
//====================================================
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
    console.log("Connection to shannanigans complete!");
})


//================
//PASSPORT CONFIG
//================
app.use(session({
  secret: 'mysupersecret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 180 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//set currentUser as a variable to be used in any res.render
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.session = req.session;
    next();
});


//==============================
// AQUIRE ALL ROUTES
//==============================

app.use("/products", productRoute);
app.use(indexRoute);
app.use("/users", userRoute);
app.use("/orders", orderRoute);


//==============================
// SERVER CONNECTION
//==============================

//make connection to server
/*app.listen(8000, () => {
    console.log('It is working!');
});*/

app.listen(process.env.PORT, process.env.IP);