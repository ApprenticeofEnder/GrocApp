const mongoose = require('mongoose');
const md5 = require('md5');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    user_number: {
        type: Number,
        required: true,
        index: {
            unique: true
        }
    },
    user_hash: {
        type: String,
        required: true
    }
});

UserSchema.statics.addUser = function addUser(username, password, cb){
    this.findOne().sort('-user_number').exec((err, result)=>{
        if(err){
            console.log(err);
            return;
        }
        let new_number = 1;
        if(result){
            new_number = result.user_number + 1;
        }
        this.create({
            username: username,
            password: md5(password),
            user_number: new_number,
            user_hash: md5(new_number + '')
        }, cb);
    })
}

UserSchema.statics.checkCreds = function checkCreds(username, password, cb){
    let hashed_pw = md5(password);
    this.findOne({
        username: username,
        password: hashed_pw
    }, (err, result)=>{
        if(err){
            cb(err, null);
            return;
        }
        cb(null, result);
    });
}

module.exports = User = mongoose.model('user', UserSchema);