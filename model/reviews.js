const mongoose = require("mongoose")

let reviewSchema = new mongoose.Schema({
    articleId: {
        type: String,
        required: true
    },
    reviewText: {
        type: String,
        required: true
    }
})

let reviews = mongoose.model("reviews", reviewSchema)
module.exports = reviews