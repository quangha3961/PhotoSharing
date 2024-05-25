"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var schemaInfo = new Schema({
    version: Number,
    load_date_time: {type: Date, default: Date.now},
});

var SchemaInfo = mongoose.model('SchemaInfo', schemaInfo);

module.exports = SchemaInfo;
