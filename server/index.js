//import express from 'express';
const express = require('express');
const connectDB = require('./config/db');
const app = express();
require('dotenv').config();

// Connect Database
connectDB();

app.use('/webHooks', require('./routes/webHooks'));

app.get('/', (req, res) => res.send('Hello world!'));

app.listen(process.env.PORT, () => {
    console.log(`I am listen on ${process.env.PORT}`)
})