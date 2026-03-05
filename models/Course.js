const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    branch: { type: String, required: true },
    description: { type: String },
    instructor: { type: String },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    thumbnail: { type: String },
    videos: [{ title: String, url: String }]
});

module.exports = mongoose.model('Course', courseSchema);
