var express = require('express');
var router = express.Router();

var nodemailer = require('nodemailer');
var passwordHash = require('password-hash');

var profileData;

/* GET login page. */
router.get('/', function(req, res, next) {
	res.render('login');
  });

router.post('/login', function(req, res) {
  var db = req.db;

  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;

  var collection = db.get('account_info');

  collection.findOne ({ email: userEmail}, function(err, user) {
    if(user == null) {
      res.jsonp({ flag: 1 });
    }
    else if (user.email == userEmail && passwordHash.verify(userPassword, user.password)) {
      if(user.isAdmin == true) {
        res.render('admin', { profileData: user });
      }
      else {
        res.render('users', { profileData: user });
      }
      profileData = user;
    } 
    else {
      console.log("Credentials wrong");
      res.jsonp({ flag: 1 });
    }
   });  
});

router.post('/apply_leave', function(req, res, next) {
  var db = req.db;

  var userEmail = profileData.email;

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
  res.render('change_password', { profileData: profileData });
});

router.post('/logout', function(req, res, next) {
  res.render('login');
});

router.post('/add_user', function(req, res, next) {

  var db = req.db;
  var userEmail = req.body.userEmail;
  var userPassword = passwordHash.generate(req.body.userPassword);

  var collection = db.get('account_info');

  collection.insert({
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