const express = require('express');
const mongoose = require('mongoose');
var path = require('path');
const md5 = require('md5');
const app = express();

const User = require('./models/User');
const GroceryList = require('./models/GroceryList');
const { randomBytes } = require('crypto');
const cookieParser = require('cookie-parser');


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/static')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
require('./routes.js')(app);

function run(){
    app.listen(3000, ()=>{
        console.log("Server running on port 3000");
    });

    if(process.env.NODE_ENV !== "production"){
        return;
    }

    mongoose
        .connect(
            'mongodb://mongo:27017/grocapp',
            { useNewUrlParser: true }
        )
        .then(() => {
            console.log('MongoDB Connected')
            return User.deleteMany({})
        })
        .then(()=>{
            return GroceryList.deleteMany({})
        })
        .then(()=>{
            User.addUser("admin", process.env.ADMIN_PASSWORD, (err, doc) => {
                if(err){
                    console.log(err);
                    return;
                }
                console.log("Admin user saved.");
                User.addUser("robert", randomBytes(16).toString('hex'), (err, doc) => {
                    if(err){
                        console.log(err);
                        return;
                    }
                    console.log("Test user saved.");
                });
            });
            
            let adminList = new GroceryList({
                title: "Super Secret Grocery List",
                content: process.env.FLAG,
                owner: "admin",
                list_number: 1,
                owner_hash: md5('1'),
                private: true
            })
            adminList.save((err, doc) => {
                if(err){
                    console.log(err);
                    return;
                }
                console.log("Admin list saved.");
            })
            let testList = new GroceryList({
                title: "Weekly Groceries",
                content: "Milk\nEggs\nCookies",
                owner: "robert",
                list_number: 2,
                owner_hash: md5('2'),
                private: false
            })
            testList.save((err, doc) => {
                if(err){
                    console.log(err);
                    return;
                }
                console.log("Test list saved.");
            })
        })
        .catch(err => console.log(err));
}

run();

