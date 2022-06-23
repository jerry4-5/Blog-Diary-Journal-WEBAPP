//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: "our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://admin-isha:test123@cluster0.6j5ne.mongodb.net/userDB', {
  useNewUrlParser: true
});
// mongodb+srv://admin-angela:Test123@cluster0.nbxhk.mongodb.net/userDB

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  title: {
    type: [String],
    required: [true,"Error, Please enter the title field!"]
  },
  secret: [String]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done){
  done(null,user.id);
});


passport.deserializeUser(function(id, done){
  User.findById(id, function(err,user){
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb){
  User.findOrCreate({googleId: profile.id},function(err, user){
    return cb(err,user);
  });
}
));




const homeStartingContent = "Any journal, be it virtual or on paper, is a labor of love, and with our online journal maker, you can ensure that your journal has all the love and attention that it deserves. You can make as many journal entries as you desire and publish them directly using the compose url.Write down your goals every day. Keep a daily log, journal three things you're grateful for every day, journal your problems, journal your stresses, journal your answer to “What's the best thing that happened today?” every night before bed. Happy Journaling!❤️";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";





app.get("/", function(req, res) {
      //console.log(posts);
res.render("home");

      // Post.find({}, function(err, results) {
      //
      //   if (results.length === 0) {
      //   home.save();
      //     res.redirect("/");
      //   } else {
      //
      //     if (err) {
      //       console.log(err);
      //     } else {
            //console.log(results);
      //       res.render("home", {
      //         postArray: results
      //       });
      //     }
      //   }
      // });
      });


      app.get("/auth/google",  passport.authenticate("google",{scope: ['profile']}));

      app.get("/login",function(req,res){
        res.render("login");
      });

      app.get("/auth/google/secrets", passport.authenticate("google",{ failureRedirect : "/login"}),function(req,res){
        res.redirect("/secrets");
      });


      app.get("/register",function(req,res){
        res.render("register");
      });



















      app.get("/secrets",function(req,res){
        User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        res.render("secrets",{userWithSecrets: foundUser.secret,titlePost:foundUser.title});
      }
    }
  });
      });

      app.get("/about", function(req, res) {
        res.render("about", {
          aboutFiles: aboutContent
        });
      });





      app.get("/compose", function(req, res) {
        if(req.isAuthenticated()){
      res.render("compose");
    }
    else{
      res.redirect("/login");
    }
      });

      // app.post("/compose", function(req, res) {
        //console.log(req.body.postTitle);

      //   const newPost = new Post({
      //     title: req.body.postTitle,
      //     post: req.body.postBody
      //   });
      //   newPost.save(function(err){
      //     if(!err){
      //       res.redirect("/");
      //     }
      //   });
      // });








      app.post("/register",function(req,res){

        User.register({username: req.body.username}, req.body.password, function(err, user){
          if(err){
            console.log(err);
            res.redirect("/register");
          }
          else{
            passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
            });
          }
        });
      });



      app.post("/compose",function(req,res){
  const submittedSecret = req.body.postBody;
  const posttitle = req.body.postTitle;
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        foundUser.secret.push(submittedSecret);
        foundUser.title.push(posttitle);
        foundUser.save();
        res.redirect("/secrets");
      }
    }
  });
});

      app.post("/login",function(req,res){
      const user = new User({
        username : req.body.username,
        password: req.body.password
      });

      req.login(user, function(err){
        if(err){
          console.log(err);
        }
        else{
          passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
          });
        }
      });
      });


      app.get("/logout",function(req,res){
        req.logout(function(err){
          if(err){
            console.log(err);
          }
          else{
            res.redirect("/");
          }
        });
      });



      let port = process.env.PORT;
      if(port == null || port == ""){
        port = 3000;
      }
      app.listen(port, function() {
        console.log("Server started on port 3000");
      });
