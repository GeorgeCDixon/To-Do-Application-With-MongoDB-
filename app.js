
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true});

//creating Mongoose Schema
const itemsSchema = {
  name:String
};

//Creating Mongoose model
const Item = mongoose.model("item",itemsSchema);

const item1= new Item({
  name:"Welcome to your To-Do List"
});

const item2= new Item({
  name:"Hit the + button to add a new item..."
});

const item3= new Item({
  name:"<-- Hit this to delete an item..."
});

const defaultItems= [item1, item2, item3];

const listSchema = {
  name: String,
  items:[itemsSchema]
};

const List =mongoose.model("list", listSchema);




app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully updated");
        }
      });
      req.redirect("/");
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName =req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName ==="Today"){
    item.save();
  res.redirect("/");
  } else{
    List.findOne ({name: listName}, function(err, foundList){
      if(!err){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    }else{
      console.log("Error on adding to list");
    }
    });
  }

  
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkBox;

  const listName = req.body.listName;

  if(listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Deletion Successfull!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName}, {$pull: {items:{_id:checkedItemId}}}, function(err, foundList){
      if(err){
        console.log("Error in deleteion");
      }else{
        res.redirect("/"+listName);
      }
    });
  } 
});



app.get("/:customListName", function(req,res){
  const customeListName= lodash.capitalize(req.params.customListName);
 List.findOne({ name: customeListName }, function(err, foundList){
  if(!err){
    if (!foundList){
      //create new list
      const list= new List({
        name: customeListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customeListName);
    }else{
      //show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }else{

    console.log("Error found")
  }
 });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
