const helmet = require('helmet');
const express = require('express');

const app  = express();
app.use(helmet()); // for setting so many default headers.

app.use("/", (req, res) => {
  res.sendStatus(200);
});

module.exports = app;