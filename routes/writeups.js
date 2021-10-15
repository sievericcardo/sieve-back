const winston = require("winston");
const auth = require("../middleware/auth");
const Joi = require("joi");
const express = require("express");
const router = express.Router();

const { Writeup } = require("../models/writeup");

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

router.post("/", auth, async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(200).required(),
    author: Joi.string().min(3),
    platform: Joi.string(),
    uid: Joi.string(),
    body: Joi.string(),
    date: Joi.date(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const { name, author, platform, body, date, uid } = req.body;

  let writeup = new Writeup({ name, author, platform, body, date, uid });

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
