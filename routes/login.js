var express = require('express');
var router = express.Router();

var nodemailer = require('nodemailer');
var passwordHash = require('password-hash');


/* GET login page. */
router.get('/', function(req, res, next) {
  if(req.session.email && req.cookies.user_sid) {
    res.redirect('/profile');
  }
  else {
    res.render('login', {response: false});
  }
});

router.get('/profile', function(req, res) {
  console.log('Email:', req.session.email);
  console.log(req.cookies.user_sid);
  if(req.session.email && req.cookies.user_sid) {
    res.render('users', {profileData: req.session.email});
  }
  else {
    res.redirect('/');
  }
});

router.post('/profile', function(req, res) {
  console.log('email:', req.session.email);

  var db = req.db;

  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;

  var collection = db.get('account_info');

  collection.findOne ({ email: userEmail}, function(err, user) {
    if(user == null) {
      res.render('login', {response: true});
    }
    else if (user.email == userEmail && passwordHash.verify(userPassword, user.password)) {
      req.session.userName = req.body.userName;
      req.session.email = req.body.userEmail;
      if(user.isAdmin == true) {
        res.render('admin', {profileData: req.session});
      }
      else {
        res.render('users', {profileData: req.session});
      }
    } 
    else {
      console.log("Credentials wrong");
      res.render('login', {response: true});
    }
   });  
});

router.post('/apply_leave', function(req, res, next) {
  var db = req.db;
  var userEmail = req.body.userEmail;

  var collection = db.get('leaves');
  var startDate = req.body.startDate;
  var days = req.body.days;

  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    port: 587,
    secure: false,
    auth: {
      user: 'sachet@crowdspots.com', 
      pass: 'aaspaas@123'
    }
  });

  var mailOptions = {
    from: 'sachet@crowdspots.com',
    to: 'sachetshandilya@gmail.com',
    subject: 'Leave application for ' + userEmail + ' from ' + startDate + ' for ' + days + 'days',
    text: 'The user with the email: ' + userEmail + ' has applied for leaves starting from the date: ' + startDate + ' for ' + days + ' days.'
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error) {
      console.log(error);
    }
    else {
      console.log('Email sent: '+ info.response);
    }
  });

  collection.insert({
    "email" : userEmail,
    "start date" : startDate,
    "days" : days
  }, function (err, doc) {
    if(err) {
      res.send("There was a problem adding the information to the database.");
    }
    else {
      res.send({text: 'Leaves applied successfully.'});
    }
  });
});

router.post('/change_password', function(req, res, next) {
  res.render('change_password', { profileData: req.session });
});

router.post('/logout', function(req, res, next) {
    res.clearCookie('user_sid');
    req.session.destroy((err) => {
      if(err) {
        console.log("error:", err);
      }
      res.redirect('/');
    });
});

router.post('/add_user', function(req, res, next) {

  var db = req.db;
  var userName = req.body.userName;
  var userEmail = req.body.userEmail;
  var userPassword = passwordHash.generate(req.body.userPassword);

  var collection = db.get('account_info');

  collection.insert({
    "username" : userName,
    "email" : userEmail,
    "password" : userPassword
  }, function (err, doc) {
    if(err) {
      res.send("There was a problem adding the information to the database.");
    }
    else {
      res.send({text: 'New user added successfully.'});
    }
  });
});

router.post('/change', function(req, res, next) {
  var db = req.db;
  var collection = db.get('account_info');
  var oldPassword = req.body.userPassword1;
  var newPassword = req.body.userPassword2;
  var newPassword2 = req.body.userPassword3;
  if (!passwordHash.verify(oldPassword,profileData.password)) {
    res.send("Current password invalid.")
  }
  else {
    if(newPassword != newPassword2) {
      res.send("New passwords don't match.");
    }
    else {
      collection.update({"email": profileData.email}, {$set: {"password": passwordHash.generate(newPassword)}}, {multi: true});
      res.send("Password changed successfully.")
    }
  }  
});

module.exports = router;
