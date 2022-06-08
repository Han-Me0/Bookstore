

const { Router } = require('express')
const router = new Router()


const mongoose = require('mongoose') // <== has to be added
const bcryptjs = require('bcryptjs')
const saltRounds = 10

const Book = require('../models/Book.model')
const User = require('../models/User.model')

// GET route ==> to display the signup form to users
router.get('/signup', (req, res) => res.render('auth/signup'))

// POST route ==> to process form data
router.post('/signup', (req, res, next) => {
  // console.log("The form data: ", req.body);

  const { username, email, password } = req.body

  // make sure users fill all mandatory fields:
  if (!username || !email || !password) {
    res.render('auth/signup', {
      errorMessage: 'All fields are mandatory. Please provide your username, email and password.',
    })
    return
  }

  // make sure passwords are strong:
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/
  if (!regex.test(password)) {
    res.status(500).render('auth/signup', {
      errorMessage:
        'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.',
    })
    return
  }

  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      return User.create({
        // username: username
        username,
        email,
       
        passwordHash: hashedPassword,
      })
    })
    .then(userFromDB => {
      // console.log("Newly created user is: ", userFromDB);
      res.redirect('/userProfile')
    })
    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render('auth/signup', { errorMessage: error.message })
      } else if (error.code === 11000) {
        res.status(500).render('auth/signup', {
          errorMessage:
            'Username and email need to be unique. Either username or email is already used.',
        })
      } else {
        next(error)
      }
    }) // close .catch()
})

//////////// L O G I N ///////////

// GET route ==> to display the login form to users
router.get('/login', (req, res) => res.render('auth/login'))

// POST login route ==> to process form data
router.post('/login', (req, res, next) => {
  console.log('SESSION =====> ', req.session)
  const { email, password } = req.body

  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Please enter both, email and password to login.',
    })
    return
  }

  User.findOne({ email }) // <== check if there's user with the provided email
    .then(user => {
      // <== "user" here is just a placeholder and represents the response from the DB
      if (!user) {
        // <== if there's no user with provided email, notify the user who is trying to login
        res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' })
        return
      }
      // if there's a user, compare provided password
      // with the hashed password saved in the database
      else if (bcryptjs.compareSync(password, user.passwordHash)) {
        // if the two passwords match, render the user-profile.ejs and
        //                   pass the user object to this view
        //                                 |
        //                                 V
        // res.render("users/user-profile", { user });

        // when we introduce session, the following line gets replaced with what follows:
        
        //res.render('users/user-profile', { user });

        //******* SAVE THE USER IN THE SESSION ********//
        req.session.currentUser = user
  res.redirect('/userProfile')
} else {
        // if the two passwords DON'T match, render the login form again
        // and send the error message to the user
        res.render('auth/login', { errorMessage: 'Incorrect password.' })
      }
    })
    .catch(error => next(error))
})

router.get('/userProfile', async (req, res) => {
  const currentUser = req.session.currentUser;
  let allBooks = await Book.find()
  const userBooks = {
    currentUser,
    allBooks
  }
  console.log(userBooks)
  res.render('users/user-profile', { userBooks })
  
})

router.get('/book/:id', async (req, res, next) => {
  
  const bookId = req.params.id
  let oneBook = await Book.findById(bookId)
  console.log(oneBook)
 
  res.render('oneBook', { oneBook })
});


router.post('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
module.exports = router