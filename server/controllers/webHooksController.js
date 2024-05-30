// const { Webhook } = require("svix");
// require('dotenv').config();
// const express = require('express');
// const app = express();
// app.use(express.json());

// const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
// const DB_NAME = process.env.DB_NAME;
// const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME;

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
//         return response.status(400).json({
//             success: false,
//             message: "Error occurred -- no Svix headers",
//         });
//     }

//     const wh = new Webhook(WEBHOOK_SECRET);

//     let evt;

//     try {
//         evt = wh.verify(payload, {
//             "svix-id": svix_id,
//             "svix-timestamp": svix_timestamp,
//             "svix-signature": svix_signature,
//         });
//     } catch (err) {
//         console.log("Webhook failed to verify. Error:", err.message);
//         return response.status(400).json({
//             success: false,
//             message: err.message,
//         });
//     }

//     return evt;
// }

// function getUserDataFromEvent(evt) {
//     return {
//         clerkUserId: evt.data.id,
//         firstName: evt.data.first_name,
//         lastName: evt.data.last_name,
//         email: evt.data.email_addresses[0].email_address,
//         image: evt.data.profile_image_url,
//     };
// }

// async function handleUserCreated(evt) {
//     const mongodb = context.services.get("mongodb-atlas");
//     const usersCollection = mongodb.db(DB_NAME).collection(USERS_COLLECTION_NAME);

//     const newUser = getUserDataFromEvent(evt);

//     try {
//         const user = await usersCollection.insertOne(newUser);
//         console.log(`Successfully inserted user with _id: ${user.insertedId}`);
//     } catch (err) {
//         console.error(`Failed to insert user: ${err}`);
//     }
// }

// async function handleUserUpdated(evt) {
//     const mongodb = context.services.get("mongodb-atlas");
//     const usersCollection = mongodb.db(DB_NAME).collection(USERS_COLLECTION_NAME);

//     const updatedUser = getUserDataFromEvent(evt);

//     try {
//         await usersCollection.updateOne(
//             { clerkUserId: evt.data.id },
//             { $set: updatedUser }
//         );
//         console.log("Successfully updated user!");
//     } catch (err) {
//         console.error(`Failed to update user: ${err}`);
//     }
// }

// const syncClerkData = async (request, response) => {
//     try {
//         const evt = await extractAndVerifyHeaders(request, response);
//         if (!evt) {
//             return; // Error response already sent in extractAndVerifyHeaders
//         }

//         console.log("Event Type:", evt.type);

//         switch (evt.type) {
//             case "user.created":
//                 await handleUserCreated(evt);
//                 response.status(201).json({
//                     success: true,
//                     message: "User created event handled",
//                 });
//                 break;
//             case "user.updated":
//                 await handleUserUpdated(evt);
//                 response.status(200).json({
//                     success: true,
//                     message: "User updated event handled",
//                 });
//                 break;
//             default:
//                 console.log(`Unhandled event type: ${evt.type}`);
//                 response.status(400).json({
//                     success: false,
//                     message: `Unhandled event type: ${evt.type}`,
//                 });
//         }
//     } catch (error) {
//         console.error('Error handling webhook:', error);
//         response.status(500).json({
//             success: false,
//             message: 'Internal Server Error',
//         });
//     }
// };

// module.exports = { syncClerkData };

const { Webhook } = require("svix");
require('dotenv').config();
const express = require('express');
const User = require("../models/userSchema");
const app = express();
app.use(express.json());
// const Doctor

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DB_NAME = process.env.DB_NAME;
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME;

async function extractAndVerifyHeaders(request, response) {
    const headers = request.headers;
    const payload = request.body;

    let svix_id, svix_timestamp, svix_signature;
    console.log("webhooh secret :", WEBHOOK_SECRET);

    try {
        svix_id = headers["svix-id"];
        svix_timestamp = headers["svix-timestamp"];
        svix_signature = headers["svix-signature"];

        if (!svix_id || !svix_timestamp || !svix_signature) {
            throw new Error('Missing Svix headers');
        }
    } catch (err) {
        console.error('Error extracting Svix headers:', err.message);
        return response.status(400).json({
            success: false,
            message: "Error occurred -- no Svix headers",
        });
    }

    console.log('Received Headers:', {
        svix_id,
        svix_timestamp,
        svix_signature
    });

    console.log('Received Payload:', payload);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    try {
        evt = wh.verify(JSON.stringify(payload), {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Webhook failed to verify. Error:", err.message);
        return response.status(400).json({
            success: false,
            message: err.message,
        });
    }

    return evt;
}

function getUserDataFromEvent(evt) {
    return {
        clerkUserId: evt.data.id,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
        email: evt.data.email_addresses[0].email_address,
        image: evt.data.profile_image_url,
        username: evt.username
    };
}

async function handleUserCreated(evt) {
    // const mongodb = context.services.get("mongodb-atlas");
    // const usersCollection = mongodb.db(DB_NAME).collection(USERS_COLLECTION_NAME);
    // connect();

    const newUser = getUserDataFromEvent(evt);

    try {
        const user = await User.create(newUser);
        console.log(`Successfully inserted user with _id: ${user.insertedId}`);
    } catch (err) {
        console.error(`Failed to insert user: ${err}`);
    }
}

async function handleUserUpdated(evt) {
    const mongodb = context.services.get("mongodb-atlas");
    const usersCollection = mongodb.db(DB_NAME).collection(USERS_COLLECTION_NAME);

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
        const evt = await extractAndVerifyHeaders(request, response);
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

module.exports = { syncClerkData };