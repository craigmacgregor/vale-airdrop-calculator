// File: ./models/somemodel.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var BlockSchema = new Schema({
    address: String,
    blockIndex: Number,
    blockHash: String,
    updated: { type: Date, default: Date.now },
});


//Export function to create "SomeModel" model class
module.exports = mongoose.model('Block', BlockSchema );
