require("dotenv").config();
const Product = require("./product");
const User = require("./User");
const upload = require("./Storage");
const Deletefile = require("./Delete");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const db = require("./db");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy; // Require the LocalStrategy for passport
const app = express();

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Express and Passport Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Passport Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////////

const secret = process.env.SECRET;
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session()); // Add passport session middleware
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

////////////////////////////////////////////////////////////////////////////////////////////////////////
// Routing
////////////////////////////////////////////////////////////////////////////////////////////////////////

app.route("/").get(async (req, res) => {
  try {
    const itemss = await Product.find();
    res.render("home", { items: itemss });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
// register
///////////////////////////////////////////////////////////////////////////////////////////////////////

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post(async (req, res) => {
    try {
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.render("register", {
          error: "User already exists. Please choose a different email.",
        });
      }
      User.register(
        new User({
          username: req.body.username,
          isadmin: req.body.isadmin === "on",
        }),
        req.body.password,
        (err, user) => {
          if (err) {
            console.log(err);
            res.redirect("/register");
          } else {
            passport.authenticate("local")(req, res, () => {
              res.redirect("/login");
            });
          }
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// login
////////////////////////////////////////////////////////////////////////////////////////////////////////////

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post(
    passport.authenticate("local", {
      successRedirect: "/adminDashboard",
      failureRedirect: "/login",
    })
  );

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// adding product via admin
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.route("/adminDashboard").get((req, res) => {
  if (req.isAuthenticated() && req.user.isadmin) {
    res.render("adminDashboard");
  } else if (req.isAuthenticated()) {
    res.redirect("/UserCart");
  } else {
    res.redirect("/login");
  }
})
  .post(upload.array("images"), (req, res) => {
    const images = req.files.map((file) => file.filename);
    const product = new Product({
      name: req.body.name,
      specs: req.body.specs,
      price: req.body.price,
      class: req.body.class,
      productCode: req.body.productcode,
      image: {
        img1: images[0],
        img2: images[1],
        img3: images[2],
      },
    });
    product
      .save()
      .then(() => {
        console.log("Saved product: ", product, images);
        res.redirect("/login");
      })
      .catch((error) => {
        console.error("Error saving product: ", error);
        res.redirect("/login");
      });
  });
  app.route("/UserCart").get((req, res) => {
    if (req.isAuthenticated() && !req.user.isadmin) {
      res.render("usercart");
    } else {
      res.redirect("/login");
    }
  });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// deleting item access via admin
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.route("/Delete").get((req, res) => {
  if (req.isAuthenticated()) {
    Product.find().then((Items) => {
      res.render("Delete", { items: Items });
    });
  } else {
    res.redirect("/login");
  }
});
app.post("/delete", async (req, res) => {
  const deleting_Item_ID = req.body.deleting;
  await Deletefile(deleting_Item_ID, fs, Product);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// finding specific item
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/Product/:Productid", async (req, res) => {
  const requestedProductId = req.params.Productid;
  try {
    const items1 = await Product.find({ _id: requestedProductId });
    res.render("product", { items: items1 });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Error handling middleware
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
};
app.use(errorHandler);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// port config
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
