// js/ui.js - (Only the showCurrentPageQuestions function is changed)
// ... (keep all the other functions from the previous version)

const UI = {
    // --- Element Getters ---
    get elements() {
        return {
            body: document.body,
            sidebar: document.getElementById('sidebar'),
            settingsContainer: document.getElementById('settings-container'),
            quizArea: document.getElementById('quiz-area'),
            quizContainer: document.getElementById('quiz-container'),
            paletteContainer: document.getElementById('question-palette'),
            paginationContainer: document.getElementById('pagination-container'),
            submitBtn: document.getElementById('submit-test-btn'),
            timerDisplay: document.getElementById('timer-display'),
            resultsSummary: document.getElementById('results-summary')
        };
    },

    // --- High-Level UI State Changers ---
    showQuizScreen() {
        const { settingsContainer, quizArea, sidebar, body, timerDisplay } = this.elements;
        settingsContainer.classList.add('hidden');
        quizArea.classList.remove('hidden');
        sidebar.classList.remove('hidden');
        timerDisplay.classList.remove('hidden');
        body.classList.add('quiz-active');
    },

    showSettingsScreen() {
        const { settingsContainer, quizArea, sidebar, body, timerDisplay } = this.elements;
        settingsContainer.classList.remove('hidden');
        quizArea.classList.add('hidden');
        sidebar.classList.add('hidden');
        timerDisplay.classList.add('hidden');
        body.classList.remove('quiz-active');
    },

    // --- Component Renderers ---
    renderQuiz() {
        const { quizContainer } = this.elements;
        quizContainer.innerHTML = '';
        AppState.quizData.forEach((q, index) => {
            const questionNode = this.createQuestionElement(q, index);
            quizContainer.appendChild(questionNode);
        });
        this.updatePagination();
        this.showCurrentPageQuestions();
        this.updatePalette();
    },

    createQuestionElement(q, index) {
        const template = document.getElementById('question-template');
        const questionBlock = template.content.cloneNode(true).firstElementChild;
        questionBlock.dataset.questionIndex = index;

        questionBlock.querySelector('.subject-tag').textContent = q.subject;
        questionBlock.querySelector('.question-statement').textContent = `Q${index + 1}: ${q.question}`;

        if (q.code && q.code.trim() !== '') {
            this.renderCodeSnippet(questionBlock, q.code);
        }

        this.renderOptions(questionBlock, q.options, index);
        
        const markBtn = questionBlock.querySelector('.mark-review-btn');
        markBtn.classList.toggle('marked', AppState.markedForReview.has(index));
        markBtn.addEventListener('click', () => {
            AppState.toggleReviewMark(index);
            this.updatePalette();
            markBtn.classList.toggle('marked', AppState.markedForReview.has(index));
        });

        return questionBlock;
    },
    
    renderCodeSnippet(questionBlock, code) {
        const codeContainer = document.createElement('pre');
        codeContainer.className = 'code-snippet-container';
        const codeElement = document.createElement('code');
        codeElement.textContent = code;
        codeContainer.appendChild(codeElement);
        questionBlock.querySelector('.question-header').after(codeContainer);
    },

    renderOptions(questionBlock, options, qIndex) {
        const optionsContainer = questionBlock.querySelector('.options-container');
        options.forEach((optText, optIndex) => {
            const option = document.createElement('div');
            option.className = 'option';
            option.textContent = optText;
            option.dataset.index = optIndex;
            optionsContainer.appendChild(option);
        });
    },

    updatePalette() {
        const { paletteContainer } = this.elements;
        paletteContainer.innerHTML = '';
        if (!AppState.quizData || AppState.quizData.length === 0) return;

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
                const newPage = Math.floor(i / AppState.questionsPerPage);
                if (AppState.currentPage !== newPage) {
                    AppState.currentPage = newPage;
                    this.updatePagination();
                }
                this.showCurrentPageQuestions();
            });
            paletteContainer.appendChild(btn);
        }
    },

    updatePagination() {
        const { paginationContainer } = this.elements;
        const totalPages = Math.ceil(AppState.quizData.length / AppState.questionsPerPage);

        if (totalPages <= 1) {
            paginationContainer.classList.add('hidden');
            return;
        }

        paginationContainer.classList.remove('hidden');
        paginationContainer.innerHTML = `
            <button id="prev-btn" class="pagination-btn">Previous</button>
            <span>Page ${AppState.currentPage + 1} of ${totalPages}</span>
            <button id="next-btn" class="pagination-btn">Next</button>
        `;
        document.getElementById('prev-btn').disabled = AppState.currentPage === 0;
        document.getElementById('next-btn').disabled = AppState.currentPage >= totalPages - 1;

        document.getElementById('prev-btn').addEventListener('click', Main.prevPage);
        document.getElementById('next-btn').addEventListener('click', Main.nextPage);
    },

    // *** FIX IS HERE ***
    showCurrentPageQuestions() {
        const start = AppState.currentPage * AppState.questionsPerPage;
        const end = start + AppState.questionsPerPage;
        document.querySelectorAll('.question-block').forEach((block, index) => {
            // This logic is now simpler and more correct for pagination
            block.classList.toggle('active', index >= start && index < end);
        });
        this.updatePalette();
    },

    showFeedback(questionIndex, selectedAnswerIndex) {
        const questionBlock = document.querySelector(`.question-block[data-question-index='${questionIndex}']`);
        if (!questionBlock) return;
        
        const optionsContainer = questionBlock.querySelector('.options-container');
        const reasonsContainer = questionBlock.querySelector('.reasons-container');
        
        const question = AppState.quizData[questionIndex];
        const correctAnswerIndex = question.correctAnswer;
        
        reasonsContainer.innerHTML = '';
        question.reasons.forEach((reasonText, reasonIndex) => {
            const reason = document.createElement('p');
            reason.textContent = reasonText;
            reason.className = (reasonIndex === correctAnswerIndex) ? 'correct-reason' : 'incorrect-reason';
            reasonsContainer.appendChild(reason);
        });

        if(selectedAnswerIndex !== undefined) {
             const selectedOption = optionsContainer.querySelector(`[data-index='${selectedAnswerIndex}']`);
             if (selectedAnswerIndex === correctAnswerIndex) {
                if(selectedOption) selectedOption.classList.add('correct');
            } else {
                if(selectedOption) selectedOption.classList.add('incorrect');
            }
        }
       
        const correctOption = optionsContainer.querySelector(`[data-index='${correctAnswerIndex}']`);
        if (correctOption) correctOption.classList.add('correct');
        
        optionsContainer.classList.add('disabled');
        reasonsContainer.style.display = 'block';
    }
};