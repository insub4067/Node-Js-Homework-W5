const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    title: String,
    contents: String,
    userId: String,
}, {timestamps: true});


module.exports = mongoose.model("Post", PostSchema);