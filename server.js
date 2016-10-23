// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var mongoose   = require('mongoose');
var passport   = require('passport');
var config     = require('./config/database');
var jwt        = require('jwt-simple');

var Movie    = require('./app/models/movie');
var Category = require('./app/models/category');
var User     = require('./app/models/user');

var port = process.env.PORT || 8080;        // set our port

mongoose.connect(config.database);
require('./config/passport')(passport);

// require('./config/passport')(passport);

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

// Use the passport package in our application
app.use(passport.initialize());

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)

router.use(function(req, res, next) {
    console.log('Something is happening');
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here
// USER ROUTES
router.post('/signup', function (req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({status: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password
    });
  }

  newUser.save(function(err) {
    if (err) {
      return res.json({status: false, msg: 'Username already exists.'});
    }
    res.json({status: true, msg: 'Successful created new user.'});
  })
});

router.post('/authenticate', function (req, res) {
  User.findOne({
    name: req.body.name
  }, function (err, user) {
    if (err) throw err;

    if (!user) {
      res.send({status: false, msg: 'Authentication failed. User not found'});
    } else {
      // check if password matches
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
           // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          res.send({status: true, token: 'JWT ' + token});
          console.log({status: true, token: 'JWT ' + token});
        } else {
          res.send({status: false, msg: 'Authentication failed. Wrong password'});
        }
      });
    }
  });
});

router.get('/memberinfo', passport.authenticate('jwt', {session: false}), function (req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function (err, user) {
      if(err) throw err;

      if (!user) {
        return res.status(403).send({status: false, msg: 'Authentication failed. User not found'});
      } else {
        res.json({status: true, msg: 'Welcome in the member area ' + user.name + '!'});
      }
    });
  } else {
    return res.status(403).send({status: false, msg: 'No token provided.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

// MOVIE ROUTES
router.route('/movies')
  .post(function(req, res) {
    var movie = new Movie();
    movie.title = req.body.title;
    movie.description = req.body.description;
    movie.director = req.body.director;
    movie.categories = req.body.categories;

    movie.save(function(err) {
        if (err) {
          res.send({status: false, error: err});
        }

        res.json({status: true, message: 'Movie saved'});
    });
  })
  .get(function(req, res) {
    Movie.find(function(err, movies) {
      if (err) {
        res.send({status: false, error: err});
      }

      res.json({status: true, data: movies});
    });
  });

  router.route('/movies/:movie_id')
    .get(function(req, res) {
      Movie.findById(req.params.movie_id, function(err, movie) {
        if (err) {
          res.send({status: false, error: err});
        }

        res.json({status: true, data: movie});
      })
    })
    .put(function(req, res) {
      Movie.findById(req.params.movie_id, function(err, movie) {
        if (err) {
          res.send({status: false, error: err});
        }

        movie.title = req.body.title;
        movie.description = req.body.description;
        movie.director = req.body.director;
        movie.categories = req.body.categories;

        movie.save(function(err) {
          if (err) {
            res.send({status: false, error: err});
          }

          res.json({status: true, message: 'Movie saved'});
        });
      });
    })
    .delete(function(req, res) {
      Movie.remove({
        _id: req.params.movie_id
      }, function(err, movie) {
        if (err) {
          res.send({status: false, error: err});
        }

        res.json({status: true, message: 'Movie deleted'});
      });
    });

    // CATEGORY ROUTES
    router.route('/categories')
      .post(function(req, res) {
        var category = new Category();
        category.name = req.body.name;

        category.save(function(err) {
            if (err) {
              res.send({status: false, error: err});
            }

            res.json({status: true, message: 'Category saved'});
        });
      })
      .get(function(req, res) {
        Category.find(function(err, categories) {
          if (err) {
            res.send({status: false, error: err});
          }

          res.json({status: true, data: categories});
        });
      });


      router.route('/category/:category_id')
        .get(function(req, res) {
          var categoryData;
          Category.findById(req.params.category_id, function(err, category) {
            if (err) {
              res.send({status: false, error: err});
            }

            categoryData = category;
          })

          Movie.find({categories: req.params.category_id}, function(err, movies) {
            if (err) {
              res.send({status: false, error: err});
            }

            res.json({status: true, category: categoryData, movies: movies});
          })
        });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);
