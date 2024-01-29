//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption')
mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedField: ['password']});
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res)=>{
   res.render('home')
})
app.get('/register', (req, res)=>{
    res.render('register')
 })
 app.get('/login', (req, res)=>{
    res.render('login');
 })
 app.post("/register", (req, res)=>{
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save().then(user=>{
        res.render("secrets")
    }).catch((err)=>console.log("hubo un error" + err))
 })


 app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}).then((foundUser)=>{
        if(foundUser == null){
            console.log("no se encontró el usuario");
        }
        else{
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
    })
 })
app.listen('3000')