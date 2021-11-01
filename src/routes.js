const User = require('./models/User');
const GroceryList = require('./models/GroceryList');
const { data, createUser, checkUser, createList } = require('./data');

function devFilterPrivate(req, glists){
    return glists.filter((glist)=>{
        let is_private = glist.private
        let is_admin = req.cookies.user === data.users[0].user_hash;
        let is_owner = req.cookies.user === glist.owner_hash;
        return is_admin || is_owner || !is_private;
    });
}

function headerSet(req, options){
    let authed_users = data.users.filter((user)=>{
        return user.user_hash === req.cookies.user;
    });
    if(authed_users.length){
        options.authenticated = true;
        options.username = authed_users[0].username
    }
}

module.exports = function(app){
    app.get('/', (req, res)=>{
        if(process.env.NODE_ENV !== 'production'){
            options = {
                grocerylists: devFilterPrivate(req, data.grocerylists),
            }
            headerSet(req, options);
            console.log(options.grocerylists);
            res.render('home', options);
        }
        else{
            User.findOne({user_hash: req.cookies.user}, (err, user)=>{
                if (err){
                    res.status(500).send(err);
                    console.log(err);
                    return;
                }
                GroceryList.filterPrivate(req, (err, result)=>{
                    if (err){
                        res.status(500).send(err);
                        return;
                    }
                    options = {
                        grocerylists: result
                    }
                    if(user){
                        options.authenticated = true;
                        options.username = user.username
                    }
                    res.render('home', options);
                })
            })
        }
    });
    
    app.get('/login', (req, res)=>{
        res.render('login');
    });
    
    app.post('/login', (req, res)=>{
        console.log(req.body);
        if(process.env.NODE_ENV !== 'production'){
            let user = checkUser(req.body.username, req.body.password);
            if(user){
                res.cookie('user', user.user_hash);
                req.method = "GET"
                res.redirect('/');
            }
            else{
                let options = {
                    errors: ["Invalid Credentials."]
                }
                res.render('login', options);
            }
        }
        else{
            User.checkCreds(req.body.username, req.body.password, (err, user)=>{
                if(err){
                    let options = {
                        errors: ["Unexpected error occurred."]
                    }
                    res.status(500).render('login', options);
                    return;
                }
                if(user){
                    res.cookie('user', user.user_hash);
                    req.method = "GET"
                    res.redirect('/');
                }
                else{
                    let options = {
                        errors: ["Invalid Credentials."]
                    }
                    res.render('login', options);
                }
            });
        }
    });
    
    app.get('/logout', (req, res)=>{
        res.clearCookie("user");
        res.redirect('/');
    });
    
    app.post('/signup', (req, res)=>{
        if(process.env.NODE_ENV !== 'production'){
            let existing_user = data.users.map((user)=>user.username).includes(req.body.username);
            if(existing_user){
                let options = {
                    errors: ["A user with that username already exists."]
                }
                res.render('login', options);
                return;
            }
            let new_number = Math.max.apply(Math, data.users.map((user)=>user.user_number)) + 1;
            let user = createUser(req.body.username, req.body.password, new_number)
            res.cookie('user', user.user_hash);
            data.users.push(user);
            req.method = "GET"
            res.redirect("/");
        }
        else{
            User.findOne({ username: req.body.username }).exec((err, user)=>{
                if(err){
                    let options = {
                        errors: ["Unexpected error occurred."]
                    }
                    console.log(err);
                    res.status(500).render('login', options);
                    return;
                }
                else if (user){
                    let options = {
                        errors: ["A user with that username already exists."]
                    }
                    res.render('login', options);
                    return;
                }
                else{
                    User.addUser(req.body.username, req.body.password, (err, new_user)=>{
                        if(err){
                            let options = {
                                errors: ["Unexpected error occurred."]
                            }
                            console.log(err);
                            res.status(500).render('login', options);
                            return;
                        }
                        res.cookie('user', new_user.user_hash);
                        req.method = "GET"
                        res.redirect("/");
                    });
                }
            });
        }
    });
    
    app.get('/lists', (req, res)=>{
        if(process.env.NODE_ENV !== 'production'){
            res.json(devFilterPrivate(req, data.grocerylists));
        }
        else{
            GroceryList.filterPrivate(req, (err, result)=>{
                if (err){
                    res.status(500).json({error: err});
                    return;
                }
                options = {
                    grocerylists: result
                }
                res.json(result);
            })
        }
    });

    app.get('/lists/create', (req, res)=>{
        if(process.env.NODE_ENV !== 'production'){
            options = {}
            headerSet(req, options);
            if(req.query.err){
                options.error = err;
            }
            res.render('list_create', options);
        }
        else{
            User.findOne({user_hash: req.cookies.user}, (err, user)=>{
                if (err){
                    res.status(500).send(err);
                    console.log(err);
                    return;
                }
                options = {}
                if(user){
                    options.authenticated = true;
                    options.username = user.username
                }
                if(req.query.err){
                    options.error = err;
                }
                res.render('list_create', options);
            });
        }
    });

    app.get('/lists/:id', (req, res)=>{
        if(process.env.NODE_ENV !== 'production'){
            let result = devFilterPrivate(req, data.grocerylists);
            if (!(result.length)){
                res.status(403).send("Access denied.");
                return;
            }
            result = result.filter((glist)=>{
                return glist.list_number == req.params.id
            });
            if (!(result.length)){
                res.status(404).send("Could not find that grocery list.");
                return;
            }
            options = {
                grocerylist: result[0]
            }
            headerSet(req, options);
            res.render('list', options);
        }
        else{
            User.findOne({user_hash: req.cookies.user}, (err, user)=>{
                if (err){
                    res.status(500).send(err);
                    console.log(err);
                    return;
                }
                GroceryList.filterPrivate(req, (err, result)=>{
                    if (err){
                        res.status(500).send(err);
                        console.log(err);
                        return;
                    }
                    if (!(result.length)){
                        res.status(403).send("Access denied.");
                        return;
                    }
                    result = result.filter((glist)=>{
                        return glist.list_number == req.params.id
                    });
                    if (!(result.length)){
                        res.status(404).send("Could not find that grocery list.");
                        return;
                    }
                    options = {
                        grocerylist: result[0]
                    }
                    if(user){
                        options.authenticated = true;
                        options.username = user.username
                    }
                    res.render('list', options);
                })
            });
        }
    });
    
    app.post('/lists', (req, res)=>{
        req.method = "GET";
        if(process.env.NODE_ENV !== 'production'){
            if(!req.cookies.user){
                res.redirect('/lists/create?err=' + encodeURIComponent("User not authenticated."));
                return;
            }
            let new_number = Math.max.apply(Math, data.grocerylists.map((list)=>list.list_number)) + 1;
            data.grocerylists.push(createList(req.body.title, req.body.content, req.cookies.user, new_number));
            res.redirect('/');
        }
        else{
            User.findOne({user_hash: req.cookies.user}, (err, user)=>{
                if (err){
                    res.status(500).send(err);
                    console.log(err);
                    return;
                }
                if(!user){
                    res.redirect('/lists/create?err=' + encodeURIComponent("User not authenticated."));
                    return;
                }
                GroceryList.addList(req, user.username, (err, result)=>{
                    if (err){
                        res.status(500).send(err);
                        console.log(err);
                        return;
                    }
                    res.redirect('/');
                });
            })
        }
    });
    
    app.delete('/lists/:id', (req, res)=>{
        if (req.params.id == 1){
            res.status(403).json({status: "Don't delete the flag!"});
            return;
        }
        if(process.env.NODE_ENV !== 'production'){
            let deleted = false;
            let unauthorized = false;
            data.grocerylists = data.grocerylists.filter((list)=>{
                if(list.owner_hash !== req.cookies.user){
                    unauthorized = true;
                    return true;
                }
                if(list.list_number == req.params.id){
                    deleted = true;
                }
                return list.list_number != req.params.id;
            });
            if(deleted){
                res.json({status: 'Deletion successful'});
            }
            else if(unauthorized){
                res.status(403).json({status: 'You do not have authorization to delete that list.'});
            }
            else{
                res.status(404).json({status: 'List not found.'});
            }
        }
        else{
            GroceryList.findOne({
                list_number: parseInt(req.params.id)
            }, (err, result)=>{
                if(err){
                    res.status(500).json({status: err});
                }
                else if (result){
                    if(result.owner_hash !== req.cookies.user){
                        res.status(403).json({status: 'You do not have authorization to delete that list.'});
                        return;
                    }
                    GroceryList.findOneAndDelete({
                        owner_hash: req.cookies.user,
                        list_number: parseInt(req.params.id)
                    }, (err, result)=>{
                        if(err){
                            console.log(err);
                            res.status(500).json({status: err});
                            return;
                        }
                        console.log(result);
                        res.json({status: 'Deletion successful'});
                    });
                }
                else{
                    res.status(404).json({status: 'List not found.'});
                }
            })
        }
    });
}