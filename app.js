var port = process.env.PORT || 8080,
    bodyParser = require('body-parser'),
    express = require('express'),
    expressSanitizer = require('express-sanitizer'),
    mongoose = require('mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    methodOverride = require('method-override'),
    flash = require('connect-flash'),
    app = express(),
    passport = require('passport')
    passportLocalMongoose = require('passport-local-mongoose'),
    dburl = process.env.DATABASEURL;


    app.use(require('express-session')({
    secret: "i dont know",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
//? ============== Local var===========
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connect(dburl, { useNewUrlParser: true, useUnifiedTopology: true });
app.set('view engine', 'ejs');
app.use(expressSanitizer());


// Schemas for the app
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    author:String,
    created: { type: Date, default: Date.now }
});

var userSchema = new mongoose.Schema({ 
    username:{type:String},
    password:{type:String}
});
userSchema.plugin(passportLocalMongoose);


var User = mongoose.model('User', userSchema);
var Blog = mongoose.model('Blog', blogSchema);


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//RESTful routes
//Home page / index page route
app.get('/', isLoggedin,  function (req, res) {
    Blog.find({}, function (err, data) {
        if (err) {
            console.log('Some error occured');
        }
        else {

            res.render('home', { data: data });
        }
    })

});
//New form to add new post route
app.get('/blogs/new', isLoggedin, function (req, res) {
    res.render('newblog');
});

//Create post route
app.post('/blogs', isLoggedin, function (req, res) {
    
    req.body.blog.body = req.sanitize(req.body.blog.body);
    let blog = {
        title: req.body.blog.title,
        image: req.body.blog.image,
        body: req.body.blog.body,
        author:req.user.username
    }
    
    Blog.create(blog, function (err, blog) {
        if (err) {
            console.log('Some error occured', err);
        }
        else {
            res.redirect('/');
        }
    });
});

//Show route
app.get('/blogs/:id', isLoggedin, function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            console.log('Some error occured', err);
        }
        else {
            res.render('show', { blog: foundBlog });
        }
    });
});

//Edit Route
app.get('/blogs/:id/edit', isLoggedin, function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            res.redirect('/blogs');
        }
        else {
            res.render('edit', { blog: foundBlog });
        }
    });
});

//Update route
app.put('/blogs/:id', isLoggedin, function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, success) {
        if (err) {
            res.redirect('/blogs');
        }
        else {
            res.redirect('/blogs/' + req.params.id);
        }

    });
});

//Delete route
app.delete('/blogs/:id', isLoggedin, function (req, res) {
    Blog.findByIdAndDelete(req.params.id, function (err) {
        if (err) {
            res.redirect('/blogs');
        }
        else {
            res.redirect('/blogs');
        }
    });
});

//User singup
app.get('/signup', function(req, res){
    res.render('signup');
});

app.post('/signup', function(req, res){
    let username = req.body.username;
    User.register({username:username}, req.body.password, function(err, user){
        if(err){
            req.flash("error", "User exists");
            res.redirect('/signup');
            console.log(err);
        }
        else{
             passport.authenticate('local')(req, res, function() {
                    res.redirect('/');
                });
            }
    });
});

//Login route
app.get('/login', isLoggedin, function(req, res){
    res.redirect('/');
});

app.post('/login',  passport.authenticate('local',
{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash:true,
    successFlash:true
}),
 function (req, res) {
  
});

//Logout

app.get('/logout', isLoggedin, function (req, res) {
    req.logOut();
    req.flash("success", "Successfully Logged Out.");
    res.redirect('/');
});

function isLoggedin(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else{
        req.flash('error', 'You must logged in');
        res.render('login');
    }
}
app.listen(port, function () {
    console.log('Server started at port 3000');
});
