const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 200
  },
  author: String,
  uid: String,
  body: String,
  date: {
    type: Date,
    default: new Date()
  },
});

const Project = mongoose.model("Project", projectSchema);

exports.Project = Project;
