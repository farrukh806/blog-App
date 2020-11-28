var bodyParser = require('body-parser'),
    express = require('express'),
    expressSanitizer = require('express-sanitizer'),
    mongoose = require('mongoose'),
    methodOverride = require('method-override'),
    app = express();

//MongoDb config

mongoose.connect('mongodb://localhost/blog_app', { useNewUrlParser: true, useUnifiedTopology: true });
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(expressSanitizer());

var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: { type: Date, default: Date.now }
});

var Blog = mongoose.model('Blog', blogSchema);

//RESTful routes
//Home page / index page route
app.get('/blogs', function (req, res) {
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
app.get('/blogs/new', function (req, res) {
    res.render('newblog');
});

//Create post route
app.post('/blogs', function (req, res) {
    
    req.body.blog.body = req.sanitize(req.body.blog.body);
    
    Blog.create(req.body.blog, function (err, blog) {
        if (err) {
            console.log('Some error occured', err);
        }
        else {
            res.redirect('/blogs');
        }
    });
});

//Show route
app.get('/blogs/:id', function (req, res) {
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
app.get('/blogs/:id/edit', function (req, res) {
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
app.put('/blogs/:id', function (req, res) {
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

app.delete('/blogs/:id', function (req, res) {
    Blog.findByIdAndDelete(req.params.id, function (err) {
        if (err) {
            res.redirect('/blogs');
        }
        else {
            res.redirect('/blogs');
        }
    });
});
app.listen(3000, function () {
    console.log('Server started at port 3000');
});