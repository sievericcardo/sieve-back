const winston = require("winston");
const auth = require("../middleware/auth");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const path = require('path');

const { Media } = require("../models/media");

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
    const medias = await Media.find().sort({ date: -1 });

    res.send(medias);
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
    altText: Joi.string().min(3).max(200).required(),
    author: Joi.string().min(3),
    uid: Joi.string(),
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
    var month = d.getMonth() + 1;
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
  const { altText, author, date, uid } = req.body;

  let media = new Media({ altText, author, image, date, uid });

  media = await media.save();
  res.send(media);
});
router.put("/:id", auth, async (req, res) => {
  const schema = Joi.object({
    altText: Joi.string().min(3).required(),
    author: Joi.string().min(3),
    uid: Joi.string(),
    image: Joi.string(),
    date: Joi.date(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const media = await Media.findById(req.params.id);

  if (!media) {
    return res.status(404).send("Media not found");
  }

  if (media.uid !== req.user._id)
    return res.status(401).send("Media update failed. Not authorized");

  const { altText, author, image, date, uid } = req.body;

  const updatedMedia = await Media.findByIdAndUpdate(
    req.params.id,
    { altText, author, date, image, uid },
    { new: true }
  );

  res.send(updatedMedia);
});

router.delete("/:id", auth, async (req, res) => {
  const media = await Media.findById(req.params.id);

  if (!media) {
    return res.status(404).send("Media not found");
  }

  if (media.uid !== req.user._id) {
    return res.status(401).send("Media deletion failed. Not authorized");
  }

  const deletedMedia = await Media.findByIdAndDelete(req.params.id);

  res.send(deletedMedia);
});

module.exports = router;
