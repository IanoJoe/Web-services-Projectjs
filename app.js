var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport  = require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./models/user'); // get the mongoose model
var jwt         = require('jwt-simple');
var csp = require('helmet-csp');
var http=require('http');

var port        = process.env.PORT || 8000;
//create an express app
var app = express();



// Block the header from containing information
// about the server
app.disable('x-powered-by');


var helmet = require('helmet')
app.use(helmet())
app.use(helmet.noCache())

app.use(helmet.frameguard())

app.use(csp({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com'],
    //sandbox: ['allow-forms', 'allow-scripts'],
    reportUri: '/report-violation',
  }
}))

app.post('/report-violation', function (req, res) {
  if (req.body) {
    console.log('CSP Violation: ', req.body)
  } else {
    console.log('CSP Violation: No data received!')
  }

  res.status(204).end()
})

app.use(function (req, res, next) {
  console.log('time', Date.now())
  next()
})






// This is an example of middleware It receives a request
// object, response object and the next function
// As we look for the correct information to serve it executes
// and then next() says to continue down the pipeline
 app.use(function(req, res, next){
  console.log('Looking for URL : ' + req.url);
  next();
});
 
// You can also report and throw errors
app.get('/junk', function(req, res, next){
  console.log('Tried to access /junk');
  throw new Error('/junk does\'t exist');
});
 
// Catches the error and logs it and then continues
// down the pipeline
app.use(function(err, req, res, next){
  console.log('Error : ' + err.message);
  next();
});
 
// If we want /about/member we'd have to define it
// before this route
app.get('/about', function(req, res){
  // Point at the about.handlebars view
  // Allow for the test specified in tests-about.js
  res.render('about');
});

// get our request parameters
var urlencodedParser = bodyParser.urlencoded({extended:false});
app.use(bodyParser.json());
// Use the passport package in our application
app.use(passport.initialize());
 
// log to console
app.use(morgan('dev'));
 
// Try (GET http://localhost:8000)
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});
 


// connect to database
mongoose.connect(config.database);
 
// pass passport for configuration
require('./config/passport')(passport);
 
// bundle our routes
var apiRoutes = express.Router();
 
// create a new user account (POST http://localhost:8000/api/signup)
apiRoutes.post('/signup',urlencodedParser, function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

// route to authenticate a user (POST http://localhost:8000/api/authenticate)
apiRoutes.post('/authenticate',urlencodedParser, function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;
 
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

 
// connect the api routes under /api/*
app.use('/api', apiRoutes);

var routes = require('./routes/index');
var users = require('./routes/users');


//create routing object
var member = require('./api/members/index');

//create routing object
//var member = require('./api/members/display');


var housekeeping = require('./housekeeping.js');
app.use(require('cookie-parser')(housekeeping.cookieSecret));



// Demonstrate how to set a cookie
app.get('/', function(req, res){
 
  // Set the key and value as well as expiration
  res.cookie('username', 'IanLordan', {expire : new Date() + 9999}).send('username has the value of : IanLordan');
});
 
// Show stored cookies in the console
app.get('/listcookies', function(req, res){
  console.log("Cookies : ", req.cookies);
  res.send('Look in console for cookies');
});
 
// Delete a cookie
app.get('/deletecookie', function(req, res){
  res.clearCookie('username');
  res.send('username Cookie Deleted');
});

// Storing session information can be done in a few ways.
// For development we can work with a memory store
// Stores the session id in a cookie and the session data
// on the server
// npm install --save express-session
 
var session = require('express-session');
 
// parseurl provides info on the url of a request object
// npm install --save parseurl
var parseurl = require('parseurl');
 
app.use(session({
  // Only save back to the session store if a change was made
  resave: false,
 
  // Doesn't store data if a session is new and hasn't been
  // modified
  saveUninitialized: true,
 
  // The secret string used to sign the session id cookie
  secret: housekeeping.cookieSecret,
}));

// This is another example of middleware.
app.use(function(req, res, next){
  var views = req.session.views;

  // If no views initialize an empty array
  if(!views){
    views = req.session.views = {};
  }

  // Get the current path
  var pathname = parseurl(req).pathname;

  // Increment the value in the array using the path as the key
  views[pathname] = (views[pathname] || 0) + 1;

  next();

});

// When this page is accessed get the correct value from
// the views array
app.get('/viewcount', function(req, res, next){
  res.send('You viewed this page ' + req.session.views['/viewcount'] + ' times ');
});

// Reading and writing to the file system
// Import the File System module : npm install --save fs
var fs = require("fs");

app.get('/readfile', function(req, res, next){

  // Read the file provided and either return the contents
  // in data or an err
  fs.readFile('./src/index.txt', function (err, data) {
   if (err) {
       return console.error(err);
   }
   res.send("The File : " + data.toString());
  });

});

// This writes and then reads from a file
app.get('/writefile', function(req, res, next){

  // If the file doesn't exist it is created and then you add
  // the text provided in the 2nd parameter
  fs.writeFile('./src/index.txt',
    'Member information', function (err) {
   if (err) {
       return console.error(err);
    }
  });

    // Read the file like before
   fs.readFile('./src/index.txt', function (err, data) {
   if (err) {
       return console.error(err);
   }

   res.send("The File : " + data.toString());
  });

});

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/', routes);
app.use('/users', users);

//configure the express app to parse JSON-formatted body
app.use(bodyParser.json());

//add route for the root
app.get('/',function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.end("We're up and running!!!");
});

//Add routes for members api
app.get('/api/members',member.index);
app.post('/api/members',member.create);
app.put('/api/members/:id',member.update);
app.delete('/api/members/:id',member.delete);

// Listen on port 8000, IP defaults to 127.0.0.1
app.listen(8000)
// Put a friendly message on the terminal
console.log("Ahoy Ahoy Server running at http://127.0.0.1:8000/"); 




