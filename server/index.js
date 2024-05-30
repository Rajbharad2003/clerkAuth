// //import express from 'express';
// const express = require('express');
// const connectDB = require('./config/db');
// const cors = require('cors');   
// const app = express();
// require('dotenv').config();

// // Connect Database
// connectDB();

// const corsOptions = {
//     origin: '*', // Replace with your Angular app's URL http://localhost:4200
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//     optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));

// app.use('/webHooks', require('./routes/webHooks'));

const express = require('express');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { Webhook } = require("svix");
const bodyParser = require('body-parser')

const app = express();
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME;

// Create a MongoDB client and connect to the database
const client = new MongoClient(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
    if (!client.isConnected()) {
        await client.connect();
    }
    return client.db(DB_NAME).collection(USERS_COLLECTION_NAME);
}

// async function extractAndVerifyHeaders(request, response) {
//     const headers = request.headers;
//     const payload = request.body;

//     let svix_id, svix_timestamp, svix_signature;

//     try {
//         svix_id = headers["svix-id"];
//         svix_timestamp = headers["svix-timestamp"];
//         svix_signature = headers["svix-signature"];

//         if (!svix_id || !svix_timestamp || !svix_signature) {
//             throw new Error('Missing Svix headers');
//         }
//     } catch (err) {
//         console.error('Error extracting Svix headers:', err.message);
//         return response.status(400).json({
//             success: false,
//             message: "Error occurred -- no Svix headers",
//         });
//     }

//     console.log('Received Headers:', {
//         svix_id,
//         svix_timestamp,
//         svix_signature
//     });

//     console.log('Received Payload:', payload);

//     const wh = new Webhook(WEBHOOK_SECRET);

//     let evt;

//     try {
//         evt = wh.verify(JSON.stringify(payload), {
//             "svix-id": svix_id,
//             "svix-timestamp": svix_timestamp,
//             "svix-signature": svix_signature,
//         });
//     } catch (err) {
//         console.error("Webhook failed to verify. Error:", err.message);
//         return response.status(400).json({
//             success: false,
//             message: err.message,
//         });
//     }

//     return evt;
// }

function getUserDataFromEvent(evt) {
    return {
        clerkUserId: evt.data.id,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        email: evt.data.email_addresses[0].email_address,
        image: evt.data.profile_image_url,
    };
}

async function handleUserCreated(evt) {
    const usersCollection = await connectDB();

    const newUser = getUserDataFromEvent(evt);

    try {
        const user = await usersCollection.insertOne(newUser);
        console.log(`Successfully inserted user with _id: ${user.insertedId}`);
    } catch (err) {
        console.error(`Failed to insert user: ${err}`);
    }
}

async function handleUserUpdated(evt) {
    const usersCollection = await connectDB();

    const updatedUser = getUserDataFromEvent(evt);

    try {
        await usersCollection.updateOne(
            { clerkUserId: evt.data.id },
            { $set: updatedUser }
        );
        console.log("Successfully updated user!");
    } catch (err) {
        console.error(`Failed to update user: ${err}`);
    }
}

const syncClerkData = async (request, response) => {
    try {
        // Log the incoming request
        console.log('Incoming Request:', {
            headers: request.headers,
            body: request.body
        });

        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
        if (!WEBHOOK_SECRET) {
            throw new Error("You need a WEBHOOK_SECRET in your .env");
        }

        // Get the headers and body
        const headers = req.headers;
        const payload = req.body;

        // Get the Svix headers for verification
        const svix_id = headers["svix-id"];
        const svix_timestamp = headers["svix-timestamp"];
        const svix_signature = headers["svix-signature"];

        // If there are no Svix headers, error out
        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response("Error occured -- no svix headers", {
                status: 400,
            });
        }

        // Create a new Svix instance with your secret.
        const wh = new Webhook(WEBHOOK_SECRET);

        let evt;

        // Attempt to verify the incoming webhook
        // If successful, the payload will be available from 'evt'
        // If the verification fails, error out and  return error code
        try {
            evt = wh.verify(payload, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            });
        } catch (err) {
            console.log("Error verifying webhook:", err.message);
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }
        if (!evt) {
            return; // Error response already sent in extractAndVerifyHeaders
        }

        console.log("Event Type:", evt.type);

        switch (evt.type) {
            case "user.created":
                await handleUserCreated(evt);
                response.status(201).json({
                    success: true,
                    message: "User created event handled",
                });
                break;
            case "user.updated":
                await handleUserUpdated(evt);
                response.status(200).json({
                    success: true,
                    message: "User updated event handled",
                });
                break;
            default:
                console.log(`Unhandled event type: ${evt.type}`);
                response.status(400).json({
                    success: false,
                    message: `Unhandled event type: ${evt.type}`,
                });
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        response.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

app.get('/', (req, res) => res.send('Hello world!'));

app.post('/webHook/creteUpdateUser', bodyParser.raw({ type: "application/json" }), syncClerkData);

const PORT = process.env.PORT || 3000;

app.listen(process.env.PORT, () => {
    console.log(`I am listen on ${process.env.PORT}`)
})