const mongoose = require('mongoose');

// define the blueprint of a user
const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true}
});

// link it to the database
const User = mongoose.model('User', userSchema);

// expose it to the rest of the app
module.exports = User;