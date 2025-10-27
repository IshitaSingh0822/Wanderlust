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
        unique: true,
        lowercase: true,  // Automatically converts to lowercase
        trim: true        // Removes whitespace
    }
});

// Configure passport-local-mongoose with better options
userSchema.plugin(passportLocalMongoose, {
    usernameField: 'username',
    // This makes username case-insensitive
    usernameQueryFields: ['username'],
    selectFields: undefined,
    usernameLowerCase: false,  // Keep original case but search case-insensitive
    limitAttempts: false,
    maxAttempts: Infinity,
    findByUsername: function(model, queryParameters) {
        // Case-insensitive username search
        for (let key in queryParameters) {
            if (key === 'username') {
                queryParameters[key] = new RegExp('^' + queryParameters[key] + '$', 'i');
            }
        }
        return model.findOne(queryParameters);
    }
});

module.exports = mongoose.model('User', userSchema);
