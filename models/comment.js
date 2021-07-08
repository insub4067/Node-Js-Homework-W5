const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    postId: String,
    userId: String,
    comment: String,
},{timestamps: true});

module.exports = mongoose.model("Comment", CommentSchema);