var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  
  title: {
    type: String,
    required: true
  },
  
  link: {
    type: String,
    required: true
  },

  summary: {
    type: String,
    required: true
  },

  image: {
    type: String,
    required: true
  },

  saved: {
		type: Boolean
	},

  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

//Creates model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;