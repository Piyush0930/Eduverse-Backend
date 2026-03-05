const express = require('express');
const Course = require('../models/Course');
const router = express.Router();

// Mock initial courses
const INITIAL_COURSES = [
    { title: 'Data Structures', branch: 'Computer Engineering', instructor: 'Dr. Smith', level: 'Intermediate' },
    { title: 'Algorithms', branch: 'Computer Engineering', instructor: 'Dr. Smith', level: 'Advanced' },
    { title: 'Operating Systems', branch: 'Computer Engineering', instructor: 'Prof. Miller', level: 'Intermediate' },
    { title: 'Network Analysis', branch: 'Electronics & Telecommunication', instructor: 'Dr. Gupta', level: 'Intermediate' },
    { title: 'Thermodynamics', branch: 'Mechanical Engineering', instructor: 'Prof. Joshi', level: 'Beginner' },
    { title: 'Structural Analysis', branch: 'Civil Engineering', instructor: 'Dr. Patil', level: 'Intermediate' }
];

// Seed courses (for demo)
router.get('/seed', async (req, res) => {
    await Course.deleteMany({});
    await Course.insertMany(INITIAL_COURSES);
    res.send('Courses seeded');
});

// Get recommended courses for branch
router.get('/recommend/:branch', async (req, res) => {
    try {
        const courses = await Course.find({ branch: req.params.branch });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
