// js/ui.js
const UI = {
    // DOM element references
    settingsContainer: document.getElementById('settings-container'),
    quizContainer: document.getElementById('quiz-container'),
    paletteContainer: document.getElementById('question-palette'),
    paginationContainer: document.getElementById('pagination-container'),
    submitBtn: document.getElementById('submit-test-btn'),
    timerDisplay: document.getElementById('timer-display'),
    resultsSummary: document.getElementById('results-summary'),

    // Renders the entire quiz display
    renderQuiz() {
        this.quizContainer.innerHTML = ''; // Clear existing
        AppState.quizData.forEach((q, index) => {
            const questionNode = this.createQuestionElement(q, index);
            this.quizContainer.appendChild(questionNode);
        });
        this.updatePalette();
        this.updatePagination();
        this.showCurrentPageQuestions();
    },

    // Creates a single question element from the template
    createQuestionElement(q, index) {
        const template = document.getElementById('question-template');
        const questionBlock = template.content.cloneNode(true).firstElementChild;
        questionBlock.dataset.questionIndex = index;

        questionBlock.querySelector('.subject-tag').textContent = q.subject;
        questionBlock.querySelector('.question-statement').textContent = `Q${index + 1}: ${q.question}`;

        // Handle code snippet
        const codeContainer = questionBlock.querySelector('.code-snippet-container');
        if (q.isCodeSnippet) {
            codeContainer.querySelector('code').textContent = q.code;
            codeContainer.classList.add('visible');
        }

        // Create options
        const optionsContainer = questionBlock.querySelector('.options-container');
        q.options.forEach((optText, optIndex) => {
            const option = document.createElement('div');
            option.className = 'option';
            option.textContent = optText;
            option.dataset.index = optIndex;
            optionsContainer.appendChild(option);
        });
        
        // Add mark for review button event
        const markBtn = questionBlock.querySelector('.mark-review-btn');
        markBtn.addEventListener('click', () => {
            AppState.toggleReviewMark(index);
            this.updatePalette();
        });

        return questionBlock;
    },

    // Updates the question palette sidebar
    updatePalette() {
        this.paletteContainer.innerHTML = '';
        for (let i = 0; i < AppState.quizData.length; i++) {
            const btn = document.createElement('button');
            btn.className = 'palette-btn';
            btn.textContent = i + 1;
            btn.dataset.index = i;
            
            if (AppState.userAnswers[i] !== undefined) btn.classList.add('answered');
            if (AppState.markedForReview.has(i)) btn.classList.add('review');
            if (i === AppState.currentQuestionIndex) btn.classList.add('current');
            
            btn.addEventListener('click', () => {
                AppState.currentQuestionIndex = i;
                this.updatePagination();
                this.showCurrentPageQuestions();
                this.updatePalette();
            });
            this.paletteContainer.appendChild(btn);
        }
    },

    // Updates pagination controls
    updatePagination() {
        this.paginationContainer.style.display = 'flex';
        this.paginationContainer.innerHTML = `
            <button id="prev-btn" class="pagination-btn">Previous</button>
            <span>Page ${AppState.currentPage + 1} of ${Math.ceil(AppState.quizData.length / AppState.questionsPerPage)}</span>
            <button id="next-btn" class="pagination-btn">Next</button>
        `;
        document.getElementById('prev-btn').disabled = AppState.currentPage === 0;
        document.getElementById('next-btn').disabled = AppState.currentPage >= Math.ceil(AppState.quizData.length / AppState.questionsPerPage) - 1;

        // Add event listeners here as the buttons are recreated
        document.getElementById('prev-btn').addEventListener('click', Main.prevPage);
        document.getElementById('next-btn').addEventListener('click', Main.nextPage);
    },

    // Shows questions for the current page and hides others
    showCurrentPageQuestions() {
        const start = AppState.currentPage * AppState.questionsPerPage;
        const end = start + AppState.questionsPerPage;
        document.querySelectorAll('.question-block').forEach((block, index) => {
            block.classList.toggle('active', index >= start && index < end);
        });
        this.updatePalette();
    },
    
    // Shows feedback after an answer
    showFeedback(selectedOption) {
        const questionBlock = selectedOption.closest('.question-block');
        const optionsContainer = questionBlock.querySelector('.options-container');
        const reasonsContainer = document.createElement('div');
        reasonsContainer.className = 'reasons-container';
        
        const questionIndex = parseInt(questionBlock.dataset.questionIndex, 10);
        const question = AppState.quizData[questionIndex];
        const selectedAnswerIndex = parseInt(selectedOption.dataset.index, 10);
        const correctAnswerIndex = question.correctAnswer;

        // Add reasons to the container
        question.reasons.forEach((reasonText, reasonIndex) => {
            const reason = document.createElement('p');
            reason.textContent = reasonText;
            reason.className = (reasonIndex === correctAnswerIndex) ? 'correct-reason' : 'incorrect-reason';
            reasonsContainer.appendChild(reason);
        });
        questionBlock.appendChild(reasonsContainer);

        // Style options
        if (selectedAnswerIndex === correctAnswerIndex) {
            selectedOption.classList.add('correct');
        } else {
            selectedOption.classList.add('incorrect');
            const correctOption = optionsContainer.querySelector(`[data-index='${correctAnswerIndex}']`);
            correctOption.classList.add('correct');
        }
        optionsContainer.classList.add('disabled');
        reasonsContainer.style.display = 'block';
    }
};