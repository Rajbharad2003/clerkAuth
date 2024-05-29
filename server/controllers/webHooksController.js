const { Webhook } = require("svix");
require('dotenv').config();

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const DB_NAME = process.env.DB_NAME;
const USERS_COLLECTION_NAME = process.env.USERS_COLLECTION_NAME

async function extractAndVerifyHeaders(request, response) {
  const headers = request.headers;
  const payload = request.body.text();

  let svix_id, svix_timestamp, svix_signature;

  try {
    svix_id = headers["Svix-Id"][0];
    svix_timestamp = headers["Svix-Timestamp"][0];
    svix_signature = headers["Svix-Signature"][0];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      throw new Error();
    }
  } catch (err) {
    response.setStatusCode(400);
    return response.setBody(
      JSON.stringify({
        success: false,
        message: "Error occured -- no svix headers",
      })
    );
  }

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.log("Webhook failed to verify. Error:", err.message);

    response.setStatusCode(400);
    return response.setBody(
      JSON.stringify({
        success: false,
        message: err.message,
      })
    );
  }

  return evt;
}

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
  const mongodb = context.services.get("mongodb-atlas");
  const usersCollection = mongodb.db(DB_NAME).collection(USERS_COLLECTION_NAME);

  const newUser = getUserDataFromEvent(evt);

  try {
    const user = await usersCollection.insertOne(newUser);
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
    const evt = await extractAndVerifyHeaders(request, response);

    switch (evt.type) {
      case "user.created":
        await handleUserCreated(evt);
        response.setStatusCode(201);
        break;
      case "user.updated":
        await handleUserUpdated(evt);
        response.setStatusCode(200);
        break;
      default:
        console.log(`Unhandled event type: ${evt.type}`);
        response.setStatusCode(400);
    }
  
    return response.setBody(
      JSON.stringify({
        success: true,
        message: "Webhook received",
      })
    );
};

// async function syncClerkData(request, response) {
//   const evt = await extractAndVerifyHeaders(request, response);

//   switch (evt.type) {
//     case "user.created":
//       await handleUserCreated(evt);
//       response.setStatusCode(201);
//       break;
//     case "user.updated":
//       await handleUserUpdated(evt);
//       response.setStatusCode(200);
//       break;
//     default:
//       console.log(`Unhandled event type: ${evt.type}`);
//       response.setStatusCode(400);
//   }

//   return response.setBody(
//     JSON.stringify({
//       success: true,
//       message: "Webhook received",
//     })
//   );
// }; 

module.exports = { syncClerkData };