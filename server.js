var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var hbs = require("handlebars");


// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));

// Use express.static to serve the public folder as a static directory
app.use(express.static(process.cwd() + "/public"));
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//Handlebars each_upto helper
hbs.registerHelper('each_upto', function(ary, max, options) {
  if(!ary || ary.length == 0)
      return options.inverse(this);

  var result = [ ];
  for(var i = 0; i < max && i < ary.length; ++i)
      result.push(options.fn(ary[i]));
  return result.join('');
});

var PORT = process.env.PORT || 3000;
mongoose.Promise = Promise;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// Routes

// Route for getting all saved Articles from the db
app.get("/", function(req, res) {
  db.Article
    .find({saved: false})
    .then(function(dbArticle) {
      var hbsObject = {
        articles: dbArticle
      };
      res.render("index", hbsObject);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// GET route for scraping the denver post sports website
app.get("/scrape", function(req, res) {
  var counter = 0;
  axios.get("https://www.denverpost.com/sports/denver-broncos/").then(function(response) {

    var $ = cheerio.load(response.data);
    
  

    $(".section-highlight").each(function(i, element) {

      var result = {};

      result.link = $(element).find(".article-title").attr("href").trim().replace(/(\r\n|\n|\r|\t)/gm, " ");
      result.title = $(element).find(".entry-title").text().trim().replace(/(\r\n|\n|\r|\t)/gm, " ");
      result.summary = $(element).find(".excerpt").text().replace(/(\r\n|\n|\r|\t)/gm, " ");
      result.image = $(element).find("img").attr("data-srcset").split(",")[0].split(" ")[0];
      result.saved = false;
      console.log(result,"Test");
      

      if (result.title && result.link && result.summary) {
        
        db.Article
        .create(result)
        .then(function(dbArticle) {
          res.send("You've scraped the Denver Post");
        })
        .catch(function(err) {
          res.json(err);
        });
      };
    });
  });
});

// Route for grabbing an Article by id, update status to "saved"
app.post("/save/:id", function(req, res) {
  db.Article
    .update({ _id: req.params.id }, { $set: {saved: true}})
    .then(function(dbArticle) {
      res.json("dbArticle");
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing an Article by id, update status to "unsaved"
app.post("/unsave/:id", function(req, res) {
  db.Article
    .update({ _id: req.params.id }, { $set: {saved: false}})
    .then(function(dbArticle) {
      res.json("dbArticle");
    })
    .catch(function(err) {
      res.json(err);
    });
});

//Route to render Articles to handlebars and populate with saved articles
app.get("/saved", function(req, res) {
  db.Article
  .find({ saved: true })
  .then(function(dbArticles) {
    var hbsObject = {
      articles: dbArticles
    };
    res.render("saved", hbsObject);
  })
  .catch(function(err){
    res.json(err);
  });
});


//get route to retrieve all notes for a particlular article
app.get('/getNotes/:id', function (req,res){
  db.Article
    .findOne({ _id: req.params.id })
    .populate('note')
    .then(function(dbArticle){
      res.json(dbArticle);
    })
    .catch(function(err){
      res.json(err);
    });
});

//post route to create a new note in the database
app.post('/createNote/:id', function (req,res){
  db.Note
    .create(req.body)
    .then(function(dbNote){
      return db.Article.findOneAndUpdate( {_id: req.params.id }, { note: dbNote._id }, { new:true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});