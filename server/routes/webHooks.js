const express = require('express');
const router = express.Router();
import bodyParser from "body-parser";
const { syncClerkData } = require('../controllers/webHooksController.js');

router.route("/createUpdateUser").post(bodyParser.raw({ type: "application/json" }),syncClerkData);

module.exports = router;