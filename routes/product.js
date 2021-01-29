var middleware = require("../middleware/index"),
    cloudinary = require('cloudinary'),
    express    = require("express"),
    Product    = require("../models/product"),
    router     = express.Router(),
    multer     = require("multer");
    

//==============================================
// SETUP UP LOGIC FOR IMG UPLOAD VIA CLOUDINARY
//==============================================

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})

//configure cloudinary
cloudinary.config({ 
    cloud_name: 'dcnm9w6or', 
    api_key: 447656581556927, 
    api_secret: 'l5VKdEHLvboOSi_peunUfPj13qg'
});


//==============================
// PRODUCT POST AND GET ROUTES
//==============================

//get request to show all products
router.get("/", function(req, res) {
    var path = req.originalUrl;
    if(req.query.filter) {
        if(req.query.filter === "all") {
            Product.find({}, function(err, allProducts) {
                if(err) {
                    req.flash("error", err.message);
                } else {
                    res.render("products/index", {page : "product" , product : allProducts, path : path});
                }
            });
        } else {
            Product.find({}).where("category").equals(req.query.filter).exec(function(err, allProducts) {
                if(err) {
                    req.flash("error", err.message);
                } else {
                    res.render("products/index", {page : "product" , product : allProducts, path : path});
                }
            });
        }
    } else if (req.query.filter === undefined) {
        Product.find({}, function(err, allProducts) {
            if(err) {
                req.flash("error", err.message);
            } else {
                res.render("products/index", {page : "product" , product : allProducts, path : path});
            }
        });
    }

});

//Admin view all products in DB
router.get("/view", middleware.checkAdmin, function(req, res) {
    Product.find({}, function(err, adminProducts) {
        if(err) {
            req.flash("error", err.message);
        } else {
            res.render("products/view", {product : adminProducts});
        }
    });
});

//Admin get edit route
router.get("/:id/edit", middleware.checkAdmin, function(req, res) {
    Product.findById(req.params.id, function(err, foundProduct) {
        if(err) {
            req.flash("error", err.message);
        } else {
            res.render("products/edit", {product : foundProduct});
        }
    });
});

//Admin put edit product via id
router.put("/:id", middleware.checkAdmin, upload.single('image'), function(req, res) {
    Product.findById(req.params.id, async function(err, product) {
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if(req.file) {
                try {
                    cloudinary.v2.uploader.destroy(product.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    product.imageId = result.public_id;
                    product.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }

                product.price = req.body.price;
                product.description = req.body.description;
                product.name = req.body.name;
                product.save();
                req.flash("success","Successfully Updated!");
                res.redirect("/products/view");
        }
    });
});

//Admin delete product from db
//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkAdmin, function(req, res) {
    Product.findById(req.params.id, async function(err, product) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(product.imageId);
            product.remove();
            req.flash('success', 'Product deleted successfully!');
            res.redirect('/products/view');
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
  });
});

//get request to show form to add new product to db
router.get("/new", middleware.checkAdmin, function(req, res) {
    res.render("products/new");
});

//product post route
//create product and add to db
router.post("/", middleware.checkAdmin, upload.single('image'), function(req, res) {
    var name = req.body.name;
    var price = req.body.price;
    var category = req.body.category;
    var description = req.body.description;
    
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        
        var uploadImage = result.secure_url;
        var uploadImageID = result.public_id;
    
        
        var newProduct = {
            name: name,
            price: price,
            description: description,
            category: category,
            image: uploadImage,
            imageId: uploadImageID
        };
        
        //create new campground and save to db
        Product.create(newProduct, function(err, newlyCreated) {
            if(err) {
                req.flash("error", err.message);
            } else {
                req.flash("success", "Successfully added Product");
                res.redirect("/products");
            }
        });
    });
});

//show selected product in more detail
router.get("/:id", function(req, res) {
    //find product with given :id
    Product.findById(req.params.id).exec(function(err, foundProduct) {
        if(err) {
            req.flash("error", err.message);
        } else {
            Product.find({}).where("category").equals(foundProduct.category).exec(function(err, allProducts) {
                if(err) {
                    req.flash("error", err.message);
                } else {
                    res.render("products/show", {product : foundProduct, allProducts : allProducts});
                }
            });
        }
    });
});

module.exports = router;