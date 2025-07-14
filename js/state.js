// js/state.js
const AppState = {
    quizData: [],
    userAnswers: {},
    markedForReview: new Set(),
    currentQuestionIndex: 0,
    questionsPerPage: 5,
    currentPage: 0,
    quizMode: 'practice', // 'practice' or 'test'
    sessionTimer: null,
    isSubmitted: false,

    // Resets state for a new quiz
    reset() {
        this.quizData = [];
        this.userAnswers = {};
        this.markedForReview.clear();
        this.currentQuestionIndex = 0;
        this.currentPage = 0;
        this.isSubmitted = false;
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        sessionStorage.clear();
    },

    // Load data from sessionStorage if it exists
    loadFromSession() {
        const data = sessionStorage.getItem('quizData');
        if (data) {
            this.quizData = JSON.parse(data);
            this.userAnswers = JSON.parse(sessionStorage.getItem('userAnswers') || '{}');
            this.markedForReview = new Set(JSON.parse(sessionStorage.getItem('markedForReview') || '[]'));
            this.quizMode = sessionStorage.getItem('quizMode') || 'practice';
            this.currentQuestionIndex = parseInt(sessionStorage.getItem('currentQuestionIndex') || '0');
            this.currentPage = Math.floor(this.currentQuestionIndex / this.questionsPerPage);
            return true;
        }
        return false;
    },

    // Save answer
    saveAnswer(questionIndex, answerIndex) {
        this.userAnswers[questionIndex] = answerIndex;
        sessionStorage.setItem('userAnswers', JSON.stringify(this.userAnswers));
    },

    // Toggle mark for review status
    toggleReviewMark(questionIndex) {
        if (this.markedForReview.has(questionIndex)) {
            this.markedForReview.delete(questionIndex);
        } else {
            this.markedForReview.add(questionIndex);
        }
        sessionStorage.setItem('markedForReview', JSON.stringify([...this.markedForReview]));
    }
};