const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// --- Middleware ---
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- File Upload Configuration (using Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create the 'uploads' directory if it doesn't exist
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Always name the uploaded file 'quiz.json'
        cb(null, 'quiz.json');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only .json files
        if (path.extname(file.originalname) !== '.json') {
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
    res.status(200).json({ message: 'File uploaded successfully!', path: req.file.path });
});

// 2. Route to get the quiz data
app.get('/api/quiz', (req, res) => {
    const quizPath = path.join(__dirname, 'uploads', 'quiz.json');
    
    fs.readFile(quizPath, 'utf8', (err, data) => {
        if (err) {
            // If the file doesn't exist, return an empty array or an error message
            return res.status(404).json({ error: 'Quiz file not found. Please upload a quiz.json file.' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.status(200).json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: 'Error parsing JSON file.' });
        }
    });
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
