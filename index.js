//jshint esversion:6
require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { log } = require("console");
const _ = require("lodash");

const app = express();
const PORT = process.env.PORT || 27017;
mongoose.set("strictQuery", false);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<---- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {



Item.find({}).then(async (foundItems) => {
  if (foundItems.length === 0) {
  Item.insertMany(defaultItems, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully added to DB");
      };
    });
    res.redirect("/");
  } else {
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  }
}).catch(err => console.log(err));
});


app.get("/:customListName", async (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).exec(function (error, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID).then(function (err) {
      if (!err) {
        console.log("Succesfully deleted item!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemID } } },
      { new: true }
    ).then(function (err) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


app.get("/:");

app.get("/about", function (req, res) {
  res.render("about");
});

app.all('*', (req,res) => {
  res.json({"every thing":"is awesome"})
});

//Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  });
});