const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    gmail: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        required: true
    },
    reviewer: {
        type: Boolean,
        required: true
    },
    googleScholarId: {
        type: String
    },
    orcidId: {
        type: String
    },
    researchGate: {
        type: String
    },
    name: {
        type: String
    },
    confirmNum: {
        type: String
    },
});
let user = mongoose.model('users', userSchema)
module.exports = user