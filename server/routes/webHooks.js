const express = require('express');
const router = express.Router();

const { syncClerkData } = require('../controllers/webHooksController.js');

router.route("/createUpdateUser").post(syncClerkData);

module.exports = router;