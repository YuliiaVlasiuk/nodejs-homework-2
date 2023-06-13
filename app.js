const express = require("express");
const logger = require("morgan");
const cors = require("cors");
// const nodemailer=require("nodemailer");

require("dotenv").config();

// const {UKR_NET_EMAIL,UKR_NET_PASSWORD}=process.env;

// const nodemailerConfig={
//   host:"smtp.ukr.net",
//   port:465,
//   auth:{
//     user:UKR_NET_EMAIL,
//     pass:UKR_NET_PASSWORD,
//   }
// }

// const transport=nodemailer.createTransport(nodemailerConfig);


const usersRouter = require("./routes/api/users");
const contactsRouter = require("./routes/api/contacts");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/contacts", contactsRouter);
app.use("/api/users", usersRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;
  res.status(status).json({ message });
});

module.exports = app;
