
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
  db = mongojs(process.env.MONGOLAB_URI || 'core2017', ['core2017']);
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
      url: process.env.MONGOLAB_URI || 'mongodb://localhost/core2017'
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
  app.set('host', 'coreelections2017.herokuapp.com/');
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

function getcandidates() {
    return [{
       'name' : 'C1','urls': [{'addr': 'Abe%20Kim/Class%20Of%20Swag%20%28Class%20of%202014%29.png','voting': 'C1'}]
    }, {
        'name' : 'C2', 'urls' : [{'addr': 'Adela%20Wee/logo%20v1.jpg','voting': 'C2'}]
    }, {
        'name' :'C3', 'urls' : [{'addr':'Helen%20Wang/ClassLogo1.jpg','voting':'C3'}]
    },  {
       'name' :'C4', 'urls' : [{'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_2.JPG','voting':'C4'}]
    }, {
        'name' :'C5', 'urls' : [{'addr':'Noam%20Rubin/halffun.PNG','voting': 'C5'}]
    }].randomize();
}


app.get('/', function (req, res) {
  db.core2017.findOne({
    student: olinapps.user(req).id,
    year: 2013
  }, function (err, vote) {
    console.log(err, vote);
    res.render('index', {
      title: 'Class of 2017 CORe Elections',
      answers: vote ? vote.answers : {},
      user: olinapps.user(req),
      saved: 'success' in req.query,
      candidates: getcandidates()
    });
  });
});

app.post('/', function (req, res) {
  console.log("the body is");
  console.log(req.body);
  // selectMapping = {'XS':'0','S':'1','M':'2','L':'3','XL':'4'};
  // req.body['sizeIndex'] = selectMapping[req.body['size']];
  db.core2017.update({
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
    db.core2017.find(function () { console.log(arguments); });
    res.redirect('/?success');
  });
})

app.get('/SECRETRESULTLINKRAW', function (req, res) {
  db.core2017.find(function (err, core2017) {
    res.json(core2017);
  });
});

app.get('/SECRETRESULTLINK', function (req, res) {
  var poshash = {};
  db.core2017.find(function (err, core2017) {
    core2017.forEach(function (vote) {
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
