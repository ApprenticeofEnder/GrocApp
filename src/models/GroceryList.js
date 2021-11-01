const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroceryListSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  owner: {
    type: String 
  },
  owner_hash: {
    type: String,
    required: true
  },
  private: {
    type: Boolean,
    required: true
  },
  list_number: {
    type: Number,
    required: true
  }
});

GroceryListSchema.statics.filterPrivate = function filterPrivate(req, cb){
  query = {
    $or: [
      { owner_hash: req.cookies.user },
      { private: false }
    ]
  }
  GroceryList.find(query).exec((err, result)=>{
    if (err){
      cb(err, null);
      return;
    }
    cb(null, result);
  })
}

GroceryListSchema.statics.addList = function addList(req, owner_name, cb){
  this.findOne().sort('-list_number').exec((err, result)=>{
    if(err){
      console.log(err);
      return;
    }
    let new_number = 1;
    if(result){
      new_number = result.list_number + 1;
    }
    console.log(result.list_number);
    console.log(new_number);
    this.create({
      title: req.body.title,
      content: req.body.content,
      owner: owner_name,
      owner_hash: req.cookies.user,
      private: false,
      list_number: new_number
    }, cb);
  });
}

module.exports = GroceryList = mongoose.model('grocerylist', GroceryListSchema);