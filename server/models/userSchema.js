const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    clerkUserId : {
        type : String,
        required : true,
        unique : true 
    },
    email : {
        type : String,
        required : true,
        unique : true 
    },
    username : {
        type : String,
        unique : true 
    },
    firstName : {
        type : String,
    },
    lastName : {
        type : Number,
    },
    image: {
        type: String,
        required : true
    }
},
{
    timestamps : true,
}
);

module.exports = mongoose.model("User",UserSchema);