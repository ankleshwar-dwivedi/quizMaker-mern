// js/main.js
const Main = {
    init() {
        document.getElementById('start-quiz-btn').addEventListener('click', this.handleQuizStart);
        document.getElementById('submit-test-btn').addEventListener('click', this.handleSubmitTest);
        
        // Check if there's a session to restore
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
                AppState.reset(); // Clear any old state
                AppState.quizData = JSON.parse(fileContent);
                AppState.quizMode = document.querySelector('input[name="quiz_mode"]:checked').value;
                
                sessionStorage.setItem('quizData', fileContent);
                sessionStorage.setItem('quizMode', AppState.quizMode);
                
                Main.startSessionFromState();
            } catch (error) {
                alert(`Error: Invalid JSON file. ${error.message}`);
            }
        };
        reader.readAsText(file);
    },

    startSessionFromState() {
        UI.settingsContainer.style.display = 'none';
        UI.renderQuiz();
        
        const durationInput = document.getElementById('quiz-duration-input');
        const duration = parseInt(sessionStorage.getItem('quizDuration') || durationInput.value, 10);
        this.startSessionTimer(duration);

        if (AppState.quizMode === 'test') {
            UI.submitBtn.style.display = 'block';
        }
    },

    startSessionTimer(durationMinutes) {
        if (AppState.sessionTimer) clearInterval(AppState.sessionTimer);
        
        const sessionDuration = (sessionStorage.getItem('quizSessionStart'))
            ? parseInt(sessionStorage.getItem('quizDuration'), 10)
            : durationMinutes * 60 * 1000;
            
        const startTime = parseInt(sessionStorage.getItem('quizSessionStart') || Date.now(), 10);

        if (!sessionStorage.getItem('quizSessionStart')) {
             sessionStorage.setItem('quizSessionStart', startTime);
             sessionStorage.setItem('quizDuration', sessionDuration);
        }

        UI.timerDisplay.style.display = 'block';

        AppState.sessionTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= sessionDuration) {
                this.endSession('Time is up!');
            } else {
                const timeLeft = sessionDuration - elapsed;
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
                UI.timerDisplay.textContent = `Time Left: ${minutes}:${seconds}`;
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

    handleOptionClick(event) {
        const selectedOption = event.target;
        const questionBlock = selectedOption.closest('.question-block');
        if (!questionBlock || selectedOption.closest('.options-container').classList.contains('disabled')) return;

        const questionIndex = parseInt(questionBlock.dataset.questionIndex, 10);
        const selectedAnswerIndex = parseInt(selectedOption.dataset.index, 10);

        AppState.saveAnswer(questionIndex, selectedAnswerIndex);
        UI.updatePalette();
        
        if (AppState.quizMode === 'practice') {
            UI.showFeedback(selectedOption);
        } else { // Test mode
            questionBlock.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            selectedOption.classList.add('selected');
        }
    },
    
    handleSubmitTest() {
        if (AppState.isSubmitted) return;
        AppState.isSubmitted = true;
        
        clearInterval(AppState.sessionTimer);
        UI.timerDisplay.style.color = '#e67e22';
        UI.submitBtn.style.display = 'none';

        let score = 0;
        AppState.quizData.forEach((question, index) => {
            if (AppState.userAnswers[index] === question.correctAnswer) {
                score++;
            }
        });
        
        UI.resultsSummary.textContent = `Test Complete! Your Score: ${score} / ${AppState.quizData.length}`;
        // Go through and show feedback for all questions
        document.querySelectorAll('.question-block').forEach((block, index) => {
            const selectedAnswer = AppState.userAnswers[index];
            const selectedOption = block.querySelector(`.option[data-index='${selectedAnswer}']`);
            if(selectedOption) UI.showFeedback(selectedOption);
        });
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

document.addEventListener('DOMContentLoaded', () => {
    Main.init();
    // Add a single event listener on the container for delegation
    document.getElementById('quiz-container').addEventListener('click', (event) => {
        if (event.target.classList.contains('option')) {
            Main.handleOptionClick(event);
        }
    });
});