//import express from 'express';
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');   
const app = express();
require('dotenv').config();

// Connect Database
connectDB();

const corsOptions = {
    origin: '*', // Replace with your Angular app's URL http://localhost:4200
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use('/webHooks', require('./routes/webHooks'));

app.get('/', (req, res) => res.send('Hello world!'));

app.listen(process.env.PORT, () => {
    console.log(`I am listen on ${process.env.PORT}`)
})