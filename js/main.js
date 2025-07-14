// js/main.js
const Main = {
    init() {
        document.getElementById('start-quiz-btn').addEventListener('click', this.handleQuizStart);
        document.getElementById('submit-test-btn').addEventListener('click', this.handleSubmitTest);
        
        // Centralized event listener for options
        UI.elements.quizContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('option')) {
                const questionBlock = event.target.closest('.question-block');
                const qIndex = parseInt(questionBlock.dataset.questionIndex, 10);
                const oIndex = parseInt(event.target.dataset.index, 10);
                this.handleOptionClick(qIndex, oIndex);
            }
        });

        if (AppState.loadFromSession()) {
            this.startSessionFromState();
        }
    },

    handleQuizStart() {
        const fileInput = document.getElementById('quiz-file-input');
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a quiz file first!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target.result;
                AppState.reset();
                const parsedData = JSON.parse(fileContent);
                // FIX: Ensure the parsed data is an array
                if (!Array.isArray(parsedData)) {
                    throw new Error("JSON file must contain an array of questions.");
                }
                AppState.quizData = parsedData;
                AppState.quizMode = document.querySelector('input[name="quiz_mode"]:checked').value;
                
                sessionStorage.setItem('quizData', fileContent);
                sessionStorage.setItem('quizMode', AppState.quizMode);
                
                Main.startSessionFromState();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        };
        reader.readAsText(file);
    },

    startSessionFromState() {
        UI.showQuizScreen();
        UI.renderQuiz();
        
        const durationInput = document.getElementById('quiz-duration-input');
        const duration = parseInt(sessionStorage.getItem('quizDuration') || durationInput.value, 10);
        this.startSessionTimer(duration);

        if (AppState.quizMode === 'test') {
            UI.elements.submitBtn.style.display = 'block';
        }
    },

    startSessionTimer(durationMinutes) {
        // ... (This function remains the same as before)
        if (AppState.sessionTimer) clearInterval(AppState.sessionTimer);
        const sessionDuration = sessionStorage.getItem('quizSessionStart') ? parseInt(sessionStorage.getItem('quizDuration'), 10) : durationMinutes * 60 * 1000;
        const startTime = parseInt(sessionStorage.getItem('quizSessionStart') || Date.now(), 10);
        if (!sessionStorage.getItem('quizSessionStart')) {
             sessionStorage.setItem('quizSessionStart', startTime);
             sessionStorage.setItem('quizDuration', sessionDuration);
        }
        UI.elements.timerDisplay.style.display = 'block';
        AppState.sessionTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= sessionDuration) {
                this.endSession('Time is up! Your test has been submitted.');
            } else {
                const timeLeft = sessionDuration - elapsed;
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
                UI.elements.timerDisplay.textContent = `Time Left: ${minutes}:${seconds}`;
            }
        }, 1000);
    },

    endSession(message) {
        clearInterval(AppState.sessionTimer);
        if (AppState.quizMode === 'test' && !AppState.isSubmitted) {
            this.handleSubmitTest();
        }
        alert(message);
    },

    handleOptionClick(questionIndex, selectedAnswerIndex) {
        if (AppState.isSubmitted) return;

        AppState.saveAnswer(questionIndex, selectedAnswerIndex);
        UI.updatePalette();
        
        if (AppState.quizMode === 'practice') {
            UI.showFeedback(questionIndex, selectedAnswerIndex);
        } else { // Test mode
            const questionBlock = document.querySelector(`.question-block[data-question-index='${questionIndex}']`);
            questionBlock.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            const selectedOption = questionBlock.querySelector(`.option[data-index='${selectedAnswerIndex}']`);
            if(selectedOption) selectedOption.classList.add('selected');
        }
    },
    
    handleSubmitTest() {
        if (AppState.isSubmitted) return;
        AppState.isSubmitted = true;
        
        clearInterval(AppState.sessionTimer);
        UI.elements.timerDisplay.style.color = '#e67e22';
        UI.elements.submitBtn.style.display = 'none';
        UI.elements.paginationContainer.classList.add('hidden');

        let score = 0;
        AppState.quizData.forEach((question, index) => {
            if (AppState.userAnswers[index] === question.correctAnswer) score++;
            UI.showFeedback(index, AppState.userAnswers[index]);
        });
        
        UI.elements.resultsSummary.textContent = `Test Complete! Your Score: ${score} / ${AppState.quizData.length}`;
        document.querySelectorAll('.question-block').forEach(block => block.classList.add('active'));
    },

    nextPage() {
        const maxPage = Math.ceil(AppState.quizData.length / AppState.questionsPerPage) - 1;
        if (AppState.currentPage < maxPage) {
            AppState.currentPage++;
            UI.showCurrentPageQuestions();
            UI.updatePagination();
        }
    },

    prevPage() {
        if (AppState.currentPage > 0) {
            AppState.currentPage--;
            UI.showCurrentPageQuestions();
            UI.updatePagination();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Main.init());