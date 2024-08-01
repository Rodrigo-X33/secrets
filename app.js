//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');


const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const path = require("path");
const app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.engine("ejs", require("ejs").__express);
app.set("views", path.join(__dirname, "./views"));


mongoose.connect('mongodb+srv://rodrigochacon:11b0Jwf4AdmCIXmr@cluster0.wg7ktnz.mongodb.net/userDB');

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate)
const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
passport.deserializeUser(function(user, cb) {
process.nextTick(function() {
    return cb(null, user);
});
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      console.log(profile)
      return cb(err, user);
    });
  }
));


app.get('/', (req, res)=>{
   res.render('home')
})

app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}))

app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/register' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/register', (req, res)=>{
    res.render('register')
 })
 app.get('/login', (req, res)=>{
    res.render('login');
 })
 app.post("/register", (req, res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect('/register');
        }
        passport.authenticate("local") (req, res, ()=>{
            res.redirect('/secrets');
        })
    })
 })


 app.post("/login", (req, res)=>{
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, (err)=>{
        if(err){return next(err)}
        return res.redirect('/secrets');
    })
})
 app.get('/secrets', (req, res)=>{
  User.find({"secret": {$ne: null}}).then((foundUsers)=>{
      res.render("secrets", {usersWithSecrets: foundUsers});
  })
})

 app.get("/submit", (req, res)=>{
  if(req.isAuthenticated()){
    res.render('submit');
  }
  else{
    res.redirect("/login");
  }
 })

 app.post("/submit", (req, res)=>{
  const submitsecret = req.body.secret;
  User.findById(req.user.id).then(foundUser=>{
  foundUser.secret = submitsecret;
  foundUser.save().then(()=>res.redirect('/secrets'))
  })
 })
app.get('/logout', (req,res)=>{
    req.logout(()=>{
        res.redirect('/login');
    });
})
app.listen(process.env.PORT || 3000, ()=>{console.log("listen on port")})