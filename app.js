require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

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



mongoose.connect('mongodb://localhost:27017/userDB')
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)
const User = new mongoose.model('user', userSchema)

passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));
passport.serializeUser((user, done) => {
  //user.id is not profile id. it is id that created by the database
  done(null, user.id)
})
passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user)
  })
})

app.route('/')
  .get((req, res) => {
    res.render('home')
  })

// home route
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  })
)
app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/secrets');
  })

app.route('/secrets')
  .get((req, res) => {
    User.find({
      'secrets': {
        $ne: null
      }
    }, (err, foundUsers) => {
      if (err) {
        console.log(err);
      } else {
        res.render('secrets', {
          userWithSecrets: foundUsers
        })
      }
    })
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

app.get('/submit', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit')
  } else {
    res.redirect('/login')
  }
})

app.post('/submit', (req, res) => {
  const submittedSecret = req.body.secret;
  const id = (req.user.id);
  console.log(req.user.id);
  User.findById(id, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      user.secret = req.body.secret;
      user.save(() =>
        res.redirect('/secrets'))
    }
  })
})

app.listen(port, () => {
  console.log("Server started successfully");
})