const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200
  },
  author: String,
  uid: String,
  body: String,
  image: String,
  date: {
    type: Date,
    default: new Date()
  },
});

const Article = mongoose.model("Article", articleSchema);

exports.Article = Article;
