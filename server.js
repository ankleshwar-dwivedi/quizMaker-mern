const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- In-Memory Storage ---
// This variable will hold our quiz data after it's uploaded.
// It will persist as long as the serverless function instance is warm.
let quizData = null; 

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));

// --- File Upload Configuration (using Multer) ---
// We'll use memory storage instead of disk storage.
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/json') {
            return cb(new Error('Only .json files are allowed!'), false);
        }
        cb(null, true);
    }
});

// --- API Routes ---

// 1. Route to handle file uploads
app.post('/api/upload', upload.single('quizfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded or file was not a .json');
    }

    try {
        // The file content is in a buffer. Convert it to a string.
        const fileContent = req.file.buffer.toString('utf8');
        // Parse the string into a JSON object and store it in our in-memory variable.
        quizData = JSON.parse(fileContent);
        
        res.status(200).json({ message: 'File processed and quiz is ready!' });

    } catch (error) {
        // If JSON.parse fails, the file is invalid.
        quizData = null; // Reset on error
        res.status(400).json({ error: 'Invalid JSON format in the uploaded file.' });
    }
});

// 2. Route to get the quiz data
app.get('/api/quiz', (req, res) => {
    if (quizData) {
        // If data exists in our variable, send it.
        res.status(200).json(quizData);
    } else {
        // If no data has been uploaded yet.
        res.status(404).json({ error: 'Quiz file not found. Please upload a quiz.json file.' });
    }
});

module.exports = app;