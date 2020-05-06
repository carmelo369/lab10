/* App Configuration */
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var mysql = require('mysql');
var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
var session = require('express-session');
var bcrypt = require('bcrypt');
var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'top secret code!',
    resave: true,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');


/* Configure MySQL DBMS */
const connection = mysql.createConnection({
    host: 'u3r5w4ayhxzdrw87.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 't8z5sbhdoh3y9kz3',
    password: 'f6arp9i0jt061rku',
    database: 'lzia392z4exg1t8j'
});
connection.connect();

/* Middleware */
function isAuthenticated(req, res, next){
    if(!req.session.authenticated) res.redirect('/login');
    else next();
}

function checkUsername(username){
    let stmt = 'SELECT * FROM users WHERE username=?';
    return new Promise(function(resolve, reject){
       connection.query(stmt, [username], function(error, results){
           if(error) throw error;
           resolve(results);
       }); 
    });
}

function checkPassword(password, hash){
    return new Promise(function(resolve, reject){
       bcrypt.compare(password, hash, function(error, result){
          if(error) throw error;
          resolve(result);
       }); 
    });
}

/* Login Routes */
app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', async function(req, res){
    let isUserExist   = await checkUsername(req.body.username);
    let hashedPasswd  = isUserExist.length > 0 ? isUserExist[0].password : '';
    let passwordMatch = await checkPassword(req.body.password, hashedPasswd);
    if(passwordMatch){
        req.session.authenticated = true;
        req.session.user = isUserExist[0].username;
        res.redirect('/welcome');
    }
    else{
        res.render('login', {error: true});
    }
});

/* Logout Route */
app.get('/logout', function(req, res){
   req.session.destroy();
   res.redirect('/');
});

/* Register Routes */
app.get('/register', function(req, res){
    res.render('register');
});

app.post('/register', function(req, res){
    let salt = 10;
    bcrypt.hash(req.body.password, salt, function(error, hash){
        if(error) throw error;
        let stmt = 'INSERT INTO users (username, password) VALUES (?, ?)';
        let data = [req.body.username, hash];
        connection.query(stmt, data, function(error, result){
           if(error) throw error;
           res.redirect('/login');
        });
    });
});


/* Home Route */
app.get('/', function(req, res){
    var stmt = 'SELECT * FROM l9_author;';
    console.log(stmt);
    var authors = null;
    connection.query(stmt, function(error, results){
        if(error) throw error;
        if(results.length) authors = results;
        res.render('home', {authors: authors});
    });
});


/*
 *  Author Routes
 */

/* Create a new author - Get author information */
app.get('/author/new', function(req, res){
    res.render('author_new');
});

/* Create a new author - Add author into DBMS */
app.post('/author/new', function(req, res){
   //console.log(req.body);
   connection.query('SELECT COUNT(*) FROM l9_author;', function(error, result){
       if(error) throw error;
       if(result.length){
            var authorId = result[0]['COUNT(*)'] + 1;
            var stmt = 'INSERT INTO l9_author ' +
                      '(authorId, firstName, lastName, dob, dod, sex, profession, country, biography) '+
                      'VALUES ' +
                      '(' + 
                       authorId + ',"' +
                       req.body.firstname + '","' +
                       req.body.lastname + '","' +
                       req.body.dob + '","' +
                       req.body.dod + '","' +
                       req.body.sex + '","' +
                       req.body.profession + '","' +
                       req.body.country + '","' +
                       req.body.biography + '"' +
                       ');';
            console.log(stmt);
            connection.query(stmt, function(error, result){
                if(error) throw error;
                res.redirect('/');
            })
       }
   });
});

/* Show an author record */
app.get('/author/:aid', function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    console.log(stmt);
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toString().split(' ').slice(0,4).join(' ');
           author.dod = author.dod.toString().split(' ').slice(0,4).join(' ');
           res.render('author', {author: author});
       }
    });
});

/* Edit an author record - Display an author information */
app.get('/author/:aid/edit', function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toISOString().split('T')[0];
           author.dod = author.dod.toISOString().split('T')[0];
           res.render('author_edit', {author: author});
       }
    });
});

/* Edit an author record - Update an author in DBMS */
app.post('/author/:aid', function(req, res){
    console.log(req.body);
    var stmt = 'UPDATE l9_author SET ' +
                'firstName = "'+ req.body.firstname + '",' +
                'lastName = "'+ req.body.lastname + '",' +
                'dob = "'+ req.body.dob + '",' +
                'dod = "'+ req.body.dod + '",' +
                'sex = "'+ req.body.sex + '",' +
                'profession = "'+ req.body.profession + '",' +
                'portrait = "'+ req.body.portrait + '",' +
                'country = "'+ req.body.country + '",' +
                'biography = "'+ req.body.biography + '"' +
                'WHERE authorId = ' + req.params.aid + ";"
    console.log(stmt);
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author/' + req.params.aid);
    });
});

/* Delete an author record */
app.get('/author/:aid/delete', function(req, res){
    var stmt = 'DELETE from l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/');
    });
});

/* Delete an author page */
app.get('/author/:aid/authordel', function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        if(result.length){
            res.render('author_delete', {author : result[0]});
        }
        
    });
});

/*
 *  Quote Routes
 */
/* Create a new quote - Get quote information */
app.get('/author/:aid/quotes/new', function(req, res){
    res.render('quote_new', {authorId: req.params.aid});
});

/* Create a new quote - Add quote into DBMS */
app.post('/author/:aid/quotes', function(req, res){
    //console.log(req.body);
    connection.query('SELECT COUNT(*) FROM l9_quotes;', function(error, result){
       if(error) throw error;
       if(result.length){
            var quoteId = result[0]['COUNT(*)'] + 1;
            var stmt = 'INSERT INTO l9_quotes ' +
                      '(quoteId, quote, authorId, category, likes) '+
                      'VALUES ' +
                      '(' + 
                       quoteId + ',"' +
                       req.body.quote + '",' +
                       req.params.aid + ',"' +
                       req.body.category + '",' +
                       req.body.likes +
                       ');';
            console.log(stmt);
            connection.query(stmt, function(error, result){
                if(error) throw error;
                res.redirect('/author/'+ req.params.aid +'/quotes');
            })
       }
    });
});

/* Show a quote record */
app.get('/author/:aid/quotes', function(req, res){
    var stmt = 'select firstName, lastName, quote, quoteId '+
               'from l9_author, l9_quotes '+
               'where l9_author.authorId=l9_quotes.authorId '+
               'and l9_author.authorId='+ req.params.aid + ';';
    console.log(stmt);
    var name = null;
    var quotes = null;
    connection.query(stmt, function(error, results){
        if(error) throw error;
        if(results.length){
            name = results[0].firstName + ' ' + results[0].lastName;
            quotes = results;
        }
        res.render('quotes', {name: name, authorId: req.params.aid, quotes: quotes});
    });
});

/* Edit a quote record - Display a quote information */
app.get('/author/:aid/quotes/:qid/edit', function(req, res){
    var stmt = 'SELECT * FROM l9_quotes WHERE quoteId=' + req.params.qid + ';';
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           res.render('quote_edit', {quote: results[0]});
       }
    });
});

/* Edit a quote record - Update a quote in DBMS */
app.post('/author/:aid/quotes/:qid', function(req, res){
    //console.log(req.body);
    var stmt = 'UPDATE l9_quotes SET ' +
                'quote = "'+ req.body.quote + '",' +
                'likes = '+ req.body.likes + ',' +
                'category = "'+ req.body.category + '" ' +
                'WHERE quoteId = ' + req.params.qid + ";"
    console.log(stmt);
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author/' + req.params.aid + '/quotes');
    });
});

/* Delete a quote record */
app.get('/author/:aid/quotes/:qid/delete', function(req, res){
    var stmt = 'DELETE from l9_quotes WHERE quoteId='+ req.params.qid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/author/' + req.params.aid + '/quotes/');
    });
});

/* Error Route*/
app.get('*', function(req, res){
   res.render('error'); 
});

app.listen(process.env.PORT || 3000, function(){
    console.log('Server has been started');
})