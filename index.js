const winston = require("winston");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const articles = require("./routes/articles");
const projects = require("./routes/projects");
const signUp = require("./routes/signUp");
const signIn = require("./routes/signIn");

winston.exceptions.handle(
  new winston.transports.Console({ colorize: true, prettyprint: true }),
  new winston.transports.File({ filename: "uncaughtExceptions.log" })
);

process.on("unhandledRejection", (error) => {
  throw error;
});

winston.add(new winston.transports.File({ filename: "logfile.log" }));

require("dotenv").config();

const app = express();

// Add limit for parse
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.json());
app.use(cors());

app.use("/api/articles", articles);
app.use("/api/projects", projects);
app.use("/api/signup", signUp);
app.use("/api/signin", signIn);

app.get("/", (req, res) => {
  res.send("Welcome to the blog api");
});

const uri = process.env.CONNECTION;
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB connection established."))
  .catch((error) => console.error("MongoDB connection failed:", error.message));
