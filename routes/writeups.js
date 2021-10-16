const winston = require("winston");
const auth = require("../middleware/auth");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { Writeup } = require("../models/writeup");

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
    const writeups = await Writeup.find().sort({ date: -1 });

    res.send(writeups);
  } catch (error) {
    res.status(500).send("Error: " + error.message);

    winston.error(error.message);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const writeup = await Writeup.findById(req.params.id);

    res.send(writeup);
  } catch (error) {
    res.status(500).send("Error: " + error.message);

    winston.error(error.message);
  }
})

router.get('/image', async (req, res) => {
  const url = req.query.path;
  res.sendFile(path.resolve(url));
});

router.post("/", auth, async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    author: Joi.string().min(3),
    platform: Joi.string(),
    uid: Joi.string(),
    body: Joi.string(),
    description: Joi.string(),
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
  const { name, author, platform, body, description, date, uid } = req.body;

  let writeup = new Writeup({ name, author, platform, body, description, image, date, uid });

  writeup = await writeup.save();
  res.send(writeup);
});

router.put("/:id", auth, async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    author: Joi.string().min(3),
    plaftorm: Joi.string(),
    uid: Joi.string(),
    body: Joi.string(),
    description: Joi.string(),
    date: Joi.date(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const writeup = await Writeup.findById(req.params.id);

  if (!writeup) {
    return res.status(404).send("Writeup not found");
  }

  if (writeup.uid !== req.user._id)
    return res.status(401).send("Writeup update failed. Not authorized");

  const { name, author, body, date, uid } = req.body;

  const updatedWriteup = await Writeup.findByIdAndUpdate(
    req.params.id,
    { name, author, body, date, uid },
    { new: true }
  );

  res.send(updatedWriteup);
});

// router.patch("/:id", auth, async (req, res) => {
//   const writeup = await Writeup.findById(req.params.id);

//   if (!writeup) return res.status(404).send("Writeup not found...");

//   if (writeup.uid !== req.user._id)
//     return res.status(401).send("Writeup check/uncheck failed. Not authorized");

//   const updatedWriteup = await Writeup.findByIdAndUpdate(
//     req.params.id,
//     {
//       isComplete: !writeup.isComplete,
//     },
//     {
//       new: true,
//     }
//   );

//   res.send(updatedWriteup);
// });

router.delete("/:id", auth, async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);

  if (!writeup) {
    return res.status(404).send("Writeup not found");
  }

  if (writeup.uid !== req.user._id) {
    return res.status(401).send("Writeup deletion failed. Not authorized");
  }

  const deletedWriteup = await Writeup.findByIdAndDelete(req.params.id);

  res.send(deletedWriteup);
});

module.exports = router;
