const winston = require("winston");
const auth = require("../middleware/auth");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const path = require('path');

const { Article } = require("../models/article");

// Decoding base-64 image
// Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
function decodeBase64Image(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  var response = {};

  if (matches.length !== 3) {
    return new Error("Invalid input string");
  }

  response.type = matches[1];
  response.data = new Buffer.from(matches[2], "base64");

  return response;
}

router.get("/", async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ date: -1 });

    res.send(articles);
  } catch (error) {
    res.status(500).send("Error: " + error.message);

    winston.error(error.message);
  }
});

router.get('/image', async (req, res) => {
  const url = req.query.path;
  res.sendFile(path.resolve(url));
});

router.post("/", auth, async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    author: Joi.string().min(3),
    uid: Joi.string(),
    body: Joi.string().required(),
    image: Joi.string(),
    date: Joi.date(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    // Regular expression for image type:
    // This regular image extracts the "jpeg" from "image/jpeg"
    var imageTypeRegularExpression = /\/(.*?)$/;

    // Generate random string
    var crypto = require("crypto");
    var seed = crypto.randomBytes(20);
    var uniqueSHA1String = crypto.createHash("sha1").update(seed).digest("hex");

    var base64Data = req.body.image;

    // set path
    var d = new Date();
    var month = d.getMonth();
    var year = d.getFullYear();

    var basePath = "./uploads/img/" + year + "/" + month + "/";

    var imageBuffer = decodeBase64Image(base64Data);
    var userUploadedFeedMessagesLocation = basePath;

    var uniqueRandomImageName = "image-" + uniqueSHA1String;
    // This variable is actually an array which has 5 values,
    // The [1] value is the real image extension
    var imageTypeDetected = imageBuffer.type.match(imageTypeRegularExpression);

    var userUploadedImagePath =
      userUploadedFeedMessagesLocation +
      uniqueRandomImageName +
      "." +
      imageTypeDetected[1];

    // Save decoded binary image to disk
    try {
      var fs = require("fs");

      fs.promises.mkdir(basePath, {recursive: true})
        .then(x => {
          fs.promises.writeFile(
          userUploadedImagePath,
          imageBuffer.data,
          function () {
            console.log(
              "DEBUG - feed:message: Saved to disk image attached by user:",
              userUploadedImagePath
            );
          }
      )});
    } catch (error) {
      console.log("ERROR:", error);
    }
  } catch (error) {
    console.log("ERROR:", error);
  }

  const image = userUploadedImagePath;
  const { name, author, body, date, uid } = req.body;

  let article = new Article({ name, author, body, image, date, uid });

  article = await article.save();
  res.send(article);
});

router.put("/:id", auth, async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    author: Joi.string().min(3),
    uid: Joi.string(),
    body: Joi.string(),
    image: Joi.string(),
    date: Joi.date(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).send("Article not found");
  }

  if (article.uid !== req.user._id)
    return res.status(401).send("Article update failed. Not authorized");

  const { name, author, body, image, date, uid } = req.body;

  const updatedArticle = await Article.findByIdAndUpdate(
    req.params.id,
    { name, author, body, date, image, uid },
    { new: true }
  );

  res.send(updatedArticle);
});

// router.patch("/:id", auth, async (req, res) => {
//   const article = await Article.findById(req.params.id);

//   if (!article) return res.status(404).send("Article not found...");

//   if (article.uid !== req.user._id)
//     return res.status(401).send("Article check/uncheck failed. Not authorized");

//   const updatedArticle = await Article.findByIdAndUpdate(
//     req.params.id,
//     {
//       : !article.isComplete,
//     },
//     {
//       new: true,
//     }
//   );

//   res.send(updatedArticle);
// });

router.delete("/:id", auth, async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    return res.status(404).send("Article not found");
  }

  if (article.uid !== req.user._id) {
    return res.status(401).send("Article deletion failed. Not authorized");
  }

  const deletedArticle = await Article.findByIdAndDelete(req.params.id);

  res.send(deletedArticle);
});

module.exports = router;
