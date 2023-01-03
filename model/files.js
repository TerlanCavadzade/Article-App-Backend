const mongoose = require('mongoose');
const filesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    keywords: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Pending'
    },
    senderId: {
        type: String,
        required: true
    },
});
let files = mongoose.model('files', filesSchema)
module.exports = files