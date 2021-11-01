const md5 = require('md5');
const { randomBytes } = require('crypto');

function createUser(username, password, user_number){
    return {
        username: username,
        password: md5(password),
        user_number: user_number,
        user_hash: md5(user_number + '')
    }
}

function createList(title, content, user_hash, list_number){
    return {
        title: title,
        content: content,
        owner_hash: user_hash,
        private: false,
        list_number: list_number
    }
}

function checkUser(username, password){
    let hashed_pw = md5(password);
    let found_users = data.users.filter((user)=>{
        return user.password === hashed_pw && user.username === username;
    });
    if(!found_users.length){
        return null;
    }
    return found_users[0];
}

const data = {
    users: [],
    grocerylists: []
}

data.users.push(createUser("admin", process.env.ADMIN_PASSWORD || "password123", 1));
data.users.push(createUser("robert", randomBytes(16).toString('hex'), 2));
data.grocerylists.push({
    title: "Super Secret Grocery List",
    content: process.env.FLAG || "FLAG{}",
    owner: "admin",
    owner_hash: md5('1'),
    private: true,
    list_number: 1
});

data.grocerylists.push({
    title: "Weekly Groceries", 
    content: "Milk\nEggs\nCookies",
    owner: "robert",
    owner_hash: md5('2'),
    private: false,
    list_number: 2
});


module.exports = {
    data,
    createUser,
    checkUser,
    createList
}