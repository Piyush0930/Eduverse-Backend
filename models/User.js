const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    branch: {
        type: String,
        required: true,
        enum: [
            'Computer Engineering', 'Computer Science & Engineering', 'Computer Science & Business Systems', 'Information Technology',
            'Electronics & Telecommunication', 'Electronics & Communication', 'Electrical Engineering',
            'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
            'Robotics & Automation Engineering'
        ]
    },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
