// server.js - CORRECT VERSION FOR VERCEL

const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();

// --- In-Memory Storage ---
// This variable will hold the quiz data after it's uploaded.
let quizData = null; 

// --- Middleware ---
// IMPORTANT: This line is necessary for Vercel to find your HTML/CSS.
// It tells Express where to look for static files.
app.use(express.static(path.join(__dirname, 'public')));

// --- File Upload Configuration (using Multer for memory storage) ---
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // We check the mimetype for better reliability
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
        return res.status(400).json({ error: 'No file uploaded or file was not a .json' });
    }

    try {
        // The file content is in a buffer. Convert it to a string.
        const fileContent = req.file.buffer.toString('utf8');
        // Parse the string into a JSON object and store it in our in-memory variable.
        quizData = JSON.parse(fileContent);
        
        res.status(200).json({ message: 'File processed and quiz is ready!' });

    } catch (error) {
        // If JSON.parse fails, the uploaded file is invalid.
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

// Vercel handles the server listening part, so we export the app.
// The app.listen() part is not needed for Vercel.
module.exports = app;