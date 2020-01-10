require('dotenv').config()
const braintree = require("braintree");
const express = require('express');
const router = express.Router();

let gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY
})

module.exports = gateway
