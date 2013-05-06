
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , olinapps = require('olinapps')
  , mongojs = require('mongojs')
  , MongoStore = require('connect-mongo')(express);

var app = express(), db;

app.configure(function () {
  db = mongojs(process.env.MONGOLAB_URI || 'runoff', ['runoff']);
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('secret', process.env.SESSION_SECRET || 'terrible, terrible secret')
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(app.get('secret')));
  app.use(express.session({
    secret: app.get('secret'),
    store: new MongoStore({
      url: process.env.MONGOLAB_URI || 'mongodb://localhost/runoff'
    })
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', 'localhost:3000');
  app.use(express.errorHandler());
});

app.configure('production', function () {
  app.set('host', 'classof2014runoff.herokuapp.com/');
});

/**
 * Authentication
 */

app.post('/login', olinapps.login);
app.all('/logout', olinapps.logout);
app.all('/*', olinapps.middleware);
app.all('/*', olinapps.loginRequired);

app.all('/*', function (req, res, next) {
  if (olinapps.user(req).domain != 'students.olin.edu') {
    return res.send('<h1>Students only.  </h1> <p>Sorry, this application is closed to non-students. Please apply for next candidates\' weekend!</p>');
  }
  next();
})

/**
 * Routes
 */

Array.prototype.randomize = function () {
  this.sort(function (a, b) { return Math.random() - 0.5; })
  return this;
};

function getSubmissions() {
    return [{
       'name' : 'Abe Kim','urls': [{'addr': 'Abe%20Kim/Class%20Of%20Swag%20%28Class%20of%202014%29.png','voting': 'Abe-Kim-1'}]
    }, {
        'name' : 'Adela Wee', 'urls' : [{'addr': 'Adela%20Wee/logo%20v1.jpg','voting': 'Adela-Wee-1'}]
    }, {
        'name' :'Helen Wang', 'urls' : [{'addr':'Helen%20Wang/ClassLogo1.jpg','voting':'Helen-Wang-1'}]
    },  {
       'name' :'Lisa Park', 'urls' : [{'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_2.JPG','voting':'Lisa-Park-2'}]
    }, {
        'name' :'Noam Rubin', 'urls' : [{'addr':'Noam%20Rubin/halffun.PNG','voting': 'Noam-Rubin-2'}]
    }].randomize();
}


app.get('/', function (req, res) {
  db.runoff.findOne({
    student: olinapps.user(req).id,
    year: 2013
  }, function (err, vote) {
    console.log(err, vote);
    res.render('index', {
      title: '2014 T-Shirt Contest',
      answers: vote ? vote.answers : {},
      user: olinapps.user(req),
      saved: 'success' in req.query,
      submissions: getSubmissions()
    });
  });
});

app.post('/', function (req, res) {
  console.log("the body is");
  console.log(req.body);
  selectMapping = {'XS':'0','S':'1','M':'2','L':'3','XL':'4'};
  req.body['sizeIndex'] = selectMapping[req.body['size']];
  db.runoff.update({
    student: olinapps.user(req).id,
    year: 2013
  }, {
    $set: {
      date: Date.now(),
      answers: req.body
    }
  }, {
    upsert: true
  }, function (err, u) {
    console.log('>>>', err, u);
    db.runoff.find(function () { console.log(arguments); });
    res.redirect('/?success');
  });
})

app.get('/SECRETRESULTLINKRAW', function (req, res) {
  db.runoff.find(function (err, runoff) {
    res.json(runoff);
  });
});

app.get('/SECRETRESULTLINK', function (req, res) {
  var poshash = {};
  db.runoff.find(function (err, runoff) {
    runoff.forEach(function (vote) {
      Object.keys(vote.answers).forEach(function (pos) {
        poshash[pos] || (poshash[pos] = {});
        (Array.isArray(vote.answers[pos]) ? vote.answers[pos] : [vote.answers[pos]]).forEach(function (name) {
          poshash[pos][name] || (poshash[pos][name] = 0);
          poshash[pos][name]++;
        })
      })
    });
    res.json(poshash);
  });
});

/**
 * Launch
 */

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on http://" + app.get('host'));
});
