require('dotenv').config()
const express = require('express')
const ejs = require('ejs')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const md5 = require('md5')
// const encrypt = require('mongoose-encryption')



const port = 3000
const secret = process.env.SECRET
const app = express();



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));



mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

// userSchema.plugin(encrypt, {
//   secret: secret,
//   encryptedFields: ['password']
// });

const User = new mongoose.model('user', userSchema);



app.route('/')
  .get((req, res) => {
    res.render('home')
  })

// home route

app.route('/login')
  .get((req, res) => {
    res.render('login')
  })
  .post((req, res) => {
    username = req.body.username
    password = md5(req.body.password)
    User.findOne({
      email: username
    }, (err, foundUser) => {
      if (!err) {
        if (foundUser) {
          if (foundUser.password === password) {
            res.render('secrets');
            console.log(foundUser.password);
          } else {
            res.send(test)
          }
        } else {
          res.redirect('/register')
        }
      } //!err
    }) //findOne
  }) //post

// login route

app.route('/register')
  .get((req, res) => {
    res.render('register')
  })
  .post((req, res) => {
    const newUser = new User({
      email: req.body.username,
      password: md5(req.body.password)
    })
    newUser.save(err => {
      if (!err) {
        res.render('secrets');
      } else {
        console.log(err)
      }
    })
  })

// register route

app.listen(port, () => {
  console.log("Server started successfully");
})