const mongoose = require("mongoose")

let messageSchema = new mongoose.Schema({
    reviewerId: {
        type: String,
        required: true
    },
    articleId: {
        type: String,
        required: true
    }
})

let messages = mongoose.model("messages", messageSchema)
module.exports = messages