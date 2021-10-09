const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  altText: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200
  },
  author: String,
  uid: String,
  image: String,
  date: {
    type: Date,
    default: new Date()
  },
});

const Media = mongoose.model("Media", mediaSchema);

exports.Media = Media;