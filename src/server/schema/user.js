"use strict";

var mongoose = require('mongoose');

// create a schema
var userSchema = new mongoose.Schema({
    first_name: String, 
    last_name: String,   
    phone_number: String, 
    email: String,  
    password_digest: String,  
    salt: String,       
    total_likes: Number, 
});

var User = mongoose.model('User', userSchema);
module.exports =  User;
