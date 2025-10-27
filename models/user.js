const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

/*const userSchema = new Schema({
    email:{
        type: String,
        required: true
    }
});
userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', userSchema);*/
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// Configure passport-local-mongoose options
userSchema.plugin(passportLocalMongoose, {
    usernameUnique: true,
    findByUsername: function(model, queryParameters) {
        // Add case insensitive search
        queryParameters.username = new RegExp('^' + queryParameters.username + '$', 'i');
        return model.findOne(queryParameters);
    }
});

module.exports = mongoose.model('User', userSchema);
