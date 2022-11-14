require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')


const port = 3000
const app = express()


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));


app.use(session({
  secret: 'some secret text',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())



mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.route('/')
  .get((req, res) => {
    res.render('home')
  })

// home route

app.route('/secrets')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render('secrets')
    } else {
      res.redirect('/login')
    }
  })


app.route('/login')
  .get((req, res) => {
    res.render('login')
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password
    })
    req.login(user, err => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate('local')(req, res, () => {
          res.redirect('/secrets')
        })
      }
    })
  }) //post

// login route

app.route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post((req, res) => {
    User.register({
      username: req.body.username
    }, req.body.password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect('/')
      } else {
        passport.authenticate('local')(req, res, () => {
          res.redirect('/secrets')
        })
      }
    })
  })

// register route


app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  })
})

app.listen(port, () => {
  console.log("Server started successfully");
})