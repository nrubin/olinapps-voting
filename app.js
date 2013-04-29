
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
  db = mongojs(process.env.MONGOLAB_URI || 'tshirt', ['votes']);
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
      url: process.env.MONGOLAB_URI || 'mongodb://localhost/tshirt'
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
  app.set('host', 'voting.olinapps.com');
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
    return res.send('<h1>Students only.</h1> <p>Sorry, this application is closed to non-students. Please apply for next candidates\' weekend!</p>');
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
        'name' : 'Brett Rowley', 'urls' : [{'addr' : 'Brett%20Rowley/modern_o.png','voting' : "Brett-Rowley-1"}, {'addr':'Brett%20Rowley/msft.png','voting' : 'Brett-Rowley-2'}, {'addr':'Brett%20Rowley/text_fill.png','voting': 'Brett-Rowley-3'}]
    }, {
        'name' :'Colby Sato', 'urls' : [{ 'addr' :'Colby%20Sato/Full.PNG', 'voting' : 'Colby-Sato-1'}]
    }, {
        'name' :'Gracie Sanford', 'urls' : [{'addr':'Gracie/olin2014.png','voting' : "Gracie-Sanford-1"}]
    }, {
        'name' :'Helen Wang', 'urls' : [{'addr':'Helen%20Wang/ClassLogo1.jpg','voting':'Helen-Wang-1'}, {'addr':'Helen%20Wang/ClassLogo2.1.jpg','voting':'Helen-Wang-2'}, {'addr':'Helen%20Wang/ClassLogo2.jpg','voting':'Helen-Wang-3'}]
    }, {
        'name' :'Irene Hwang', 'urls' : [{'addr':'Irene%20Hwang/2014_logo_black.png','voting':'Irene-Hwang-1'},{'addr': 'Irene%20Hwang/2014_logo_white.png','voting':'Irene-Hwang-2'}]
    }, {
        'name' :'John Paton', 'urls' : [{'addr':'John%20Paton/Olin2014Shirt.jpg','voting':'John-Paton-1'},
         {'addr':'John%20Paton/Olin2014Shirt2.jpg','voting':'John-Paton-2'}
        , {'addr':'John%20Paton/Olin2014Shirt2-white.jpg','voting':'John-Paton-3'},
         {'addr':'John%20Paton/Olin2014Shirt3.jpg','voting':'John-Paton-4'}, {'addr':'John%20Paton/Olin2014ShirtMicrosoft.jpg','voting':'John-Paton-5'}]
    }, {
        'name' :'Lisa Park', 'urls' : [{'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_1.JPG','voting':'Lisa-Park-1'}, 
        {'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_2.JPG','voting':'Lisa-Park-2'},
         {'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_3.JPG','voting':'Lisa-Park-3'}, 
         {'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_4.JPG','voting':'Lisa-Park-4'}, 
         {'addr':'Lisa%20Park%20-%20Just%20sketches/Phoenix_5.JPG','voting':'Lisa-Park-5'}]
    }, {
        'name' :'Noam Rubin', 'urls' : [{'addr':'Noam%20Rubin/carlbailey.PNG','voting': 'Noam-Rubin-1'}, {'addr':'Noam%20Rubin/halffun.PNG','voting': 'Noam-Rubin-2'}]
    }];;
}


app.get('/', function (req, res) {
  db.votes.findOne({
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
  console.log(req.body)
  db.votes.update({
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
    db.votes.find(function () { console.log(arguments); });
    res.redirect('/?success');
  });
})

app.get('/SECRETRESULTLINKRAW', function (req, res) {
  db.votes.find(function (err, votes) {
    res.json(votes);
  });
});

app.get('/SECRETRESULTLINK', function (req, res) {
  var poshash = {};
  db.votes.find(function (err, votes) {
    votes.forEach(function (vote) {
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
