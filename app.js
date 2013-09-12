
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
  db = mongojs(process.env.MONGOLAB_URI || 'olin2013', ['olin2013']);
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
      url: process.env.MONGOLAB_URI || 'mongodb://localhost/olin2013'
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
  app.set('host', 'holin-elections.herokuapp.com/');
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

function gethbcandidates() {
    return [{
       'name' :'Kelly', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/kelly.PNG','voting':'kelly-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/kelly.txt'}
    },
    {
        'name' : 'Pinar', 'urls' : {'addr': 'https://dl.dropboxusercontent.com/u/11830885/pinar.PNG','voting': 'pinar-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/pinar.txt'}
    }, {
        'name' :'Cecelia', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/cecelia.PNG','voting':'cecelia-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/cecelia.txt'}
    }, {
        'name' :'Cynthia (Yun-Hsin)', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/yunhsin.PNG','voting': 'cynthia-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/cynthia.txt'}
    },
    {
        'name' :'Greg', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/gregelston.PNG','voting': 'greg-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/greg.txt'}
    },
    {
        'name' :'Luke', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/Luke.PNG','voting': 'luke-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/luke.txt'}
    },
    {
        'name' :'Charlie', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/Charlie.PNG','voting': 'charlie-hb','answers':'https://dl.dropboxusercontent.com/u/11830885/hb-txt/charlie.txt'}
    }];
}

function getservcandidates() {
    return [{
        'name' : 'Pinar', 'urls' : {'addr': 'https://dl.dropboxusercontent.com/u/11830885/pinar.PNG','voting': 'pinar-serv'}
    }, {
        'name' :'Philip', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/Filip.PNG','voting':'filip-serv'}
    }, 
    {
        'name' :'Jay', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/jay.PNG','voting': 'jay-serv'}
    }, 
    {
        'name' :'Jennifer', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/jennifer.PNG','voting': 'jennifer-serv'}
    },
    {
       'name' :'Madeleine', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/madeleine.PNG','voting':'madeleine-serv'}
    },
    {
        'name' :'Juanita', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/juanita.PNG','voting': 'juanita-serv'}
    },
    {
        'name' :'Halley', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/halley.PNG','voting': 'halley-serv'}
    },
    {
        'name' :'Shrinidhi', 'urls' : {'addr':'https://dl.dropboxusercontent.com/u/11830885/shrinidi.PNG','voting': 'shrinidhi-serv'}
    }];
}


app.get('/', function (req, res) {
  db.olin2013.findOne({
    student: olinapps.user(req).id,
    year: 2013
  }, function (err, vote) {
    console.log(err, vote);
    res.render('index', {
      title: 'Class of 2017 CORe Elections',
      answers: vote ? vote.answers : {},
      user: olinapps.user(req),
      saved: 'success' in req.query,
      hbcandidates: gethbcandidates(),
      servcandidates: getservcandidates()
    });
  });
});

app.post('/', function (req, res) {
  console.log("the body is");
  console.log(req.body);
  // selectMapping = {'XS':'0','S':'1','M':'2','L':'3','XL':'4'};
  // req.body['sizeIndex'] = selectMapping[req.body['size']];
  db.olin2013.update({
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
    db.olin2013.find(function () { console.log(arguments); });
    res.redirect('/?success');
  });
})

app.get('/SECRETRESULTLINKRAW', function (req, res) {
  db.olin2013.find(function (err, olin2013) {
    res.json(olin2013);
  });
});

app.get('/SECRETRESULTLINK', function (req, res) {
  var poshash = {};
  db.olin2013.find(function (err, olin2013) {
    olin2013.forEach(function (vote) {
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
