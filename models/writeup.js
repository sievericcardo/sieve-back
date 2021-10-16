const mongoose = require("mongoose");

const writeupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200
  },
  platform: String,
  author: String,
  uid: String,
  body: String,
  description: String,
  image: String,
  date: {
    type: Date,
    default: new Date()
  },
});

const Writeup = mongoose.model("Writeup", writeupSchema);

exports.Writeup = Writeup;