// المتغيرات العامة للاختبار
let questions = [];
let studentAnswers = {}; 
let currentQuestionIndex = 0;
let selectedOptionForCurrent = null;
let timeLeft = 30 * 60; // 30 دقيقة بالثواني
let timerInterval = null;
let isQuizStarted = false; // للتأكد من أن المؤقت لا يبدأ إلا مرة واحدة فقط عند بدء الاختبار

// نسبة النجاح (مثلاً 50%)
const PASSING_PERCENTAGE = 50;
// مدة الحظر بالمللي ثانية (ساعة واحدة = 60 * 60 * 1000)
const COOLDOWN_TIME_MS = 60 * 60 * 1000;

// 1. جلب الأسئلة عبر fetch (بدون تشغيل المؤقت)
fetch('json/questions.json')
    .then(res => {
        if (!res.ok) throw new Error('فشل تحميل الملف');
        return res.json();
    })
    .then(data => {
        questions = data;
    })
    .catch(err => {
        const qText = document.getElementById('questionText');
        if (qText) qText.innerText = 'خطأ: تعذر تحميل ملف questions.json';
        console.error(err);
    });

// 2. دالة بدء الاختبار (مع فحص حالة الحظر)
function startQuiz() {
    // أ) التحقق من وجود حظر مسبق بسبب الرسوب
    const blockUntil = localStorage.getItem('quiz_blocked_until');
    if (blockUntil) {
        const now = Date.now();
        const remainingMs = parseInt(blockUntil, 10) - now;

        if (remainingMs > 0) {
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
            alert(`عذراً، لقد رسبت في محاولتك الأخيرة.\nيجب عليك المذاكرة والمحاولة مجدداً بعد ${remainingMinutes} دقيقة.`);
            return; // منع الدخول للاختبار
        } else {
            // انتهت فترة الحظر، مسح السجل
            localStorage.removeItem('quiz_blocked_until');
        }
    }

    if (!questions || questions.length === 0) {
        alert("جاري تحميل الأسئلة، يرجى الانتظار ثوانٍ ثم المحاولة مجدداً...");
        return;
    }

    // جلب عناصر الـ DOM مباشرة
    const loginElem = document.getElementById('loginSecc');
    const viewElem = document.getElementById('viewQu');

    // إخفاء وإظهار الشاشات
    if (loginElem) loginElem.style.display = "none";
    if (viewElem) viewElem.style.display = "block";

    // بدء المؤقت وعرض السؤال الأول عند الضغط
    if (!isQuizStarted) {
        isQuizStarted = true;
        startTimer();
        renderCurrentQuestion();
    }
}

function back() {
    const loginElem = document.getElementById('loginSecc');
    const viewElem = document.getElementById('viewQu');

    if (loginElem) loginElem.style.display = "block";
    if (viewElem) viewElem.style.display = "none";
    
    const resultScreen = document.getElementById('resultScreen');
    if (resultScreen) resultScreen.style.display = "none";
}

// 4. خوارزمية خلط الخيارات
function shuffleArray(arr) {
    let shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 5. عرض السؤال الحالي
function renderCurrentQuestion() {
    selectedOptionForCurrent = null;
    const q = questions[currentQuestionIndex];

    const progressEl = document.getElementById('progressText');
    const questionEl = document.getElementById('questionText');

    if (progressEl) progressEl.innerText = `السؤال ${currentQuestionIndex + 1} من ${questions.length}`;
    if (questionEl) questionEl.innerHTML = q.question;

    const shuffledOptions = shuffleArray(q.options);
    const container = document.getElementById('optionsContainer');
    if (container) {
        container.innerHTML = '';
        shuffledOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = opt;
            btn.onclick = () => {
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedOptionForCurrent = opt;
            };
            container.appendChild(btn);
        });
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.innerText = 'إنهاء الاختبار';
        } else {
            nextBtn.innerText = 'التالي';
        }
    }
}

// 6. الانتقال للسؤال التالي أو إنهاء الاختبار
function submitAndNext() {
    if (!selectedOptionForCurrent) {
        alert('يرجى اختيار إجابة قبل الانتقال للسؤال التالي!');
        return;
    }

    const q = questions[currentQuestionIndex];
    studentAnswers[q.id] = selectedOptionForCurrent;

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderCurrentQuestion();
    } else {
        finishExam();
    }
}

// 7. إدارة المؤقت الزمني (30 دقيقة)
function startTimer() {
    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        const timerText = document.getElementById('timerText');
        if (timerText) timerText.innerText = `${minutes}:${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('انتهى الوقت المخصص للاختبار (30 دقيقة)!');
            finishExam();
        }
        timeLeft--;
    }, 1000);
}

// 8. إنهاء الاختبار وحساب النتيجة وتحديد الحظر عند الرسوب
// 8. إنهاء الاختبار وحساب النتيجة وتحديد الحظر عند الرسوب
function finishExam() {
    clearInterval(timerInterval);

    const quizScreen = document.getElementById('quizScreen');
    const resultScreen = document.getElementById('resultScreen');

    if (quizScreen) quizScreen.style.display = 'none';
    if (resultScreen) resultScreen.style.display = 'block';

    let score = 0;
    const reviewContainer = document.getElementById('reviewContainer');
    if (reviewContainer) {
        reviewContainer.innerHTML = '';

        questions.forEach((q, idx) => {
            const studentAns = studentAnswers[q.id] || 'لم يتم الإجابة';
            const isCorrect = (studentAns === q.answer);

            if (isCorrect) score++;

            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-q">${idx + 1}. ${q.question}</div>
                <div class="review-ans">إجابتك: <span class="${isCorrect ? 'text-correct' : 'text-wrong'}">${studentAns}</span></div>
                ${!isCorrect ? `<div class="review-ans">الإجابة الصحيحة: <span class="text-correct">${q.answer}</span></div>` : ''}
                <div class="explanation-box">💡 <b>الشرح:</b> ${q.explanation}</div>
            `;
            reviewContainer.appendChild(reviewItem);
        });

        // زر العودة الرئيسي في أسفل مراجعة الأسئلة
        const backBtn = document.createElement('button');
        backBtn.className = 'next-btn back';
        backBtn.style.marginTop = '1rem';
        backBtn.innerText = 'رجوع للرئيسية';
        backBtn.onclick = back;
        reviewContainer.appendChild(backBtn);
    }

    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= PASSING_PERCENTAGE;

    // تطبيق آلية الحظر في حال الرسوب
    if (!isPassed) {
        const unblockTime = Date.now() + COOLDOWN_TIME_MS;
        localStorage.setItem('quiz_blocked_until', unblockTime.toString());
    } else {
        localStorage.removeItem('quiz_blocked_until');
    }
    
    if (typeof updateStudentGradeNow === 'function') {
        updateStudentGradeNow(percentage);
    }
    
    const finalScoreEl = document.getElementById('finalScoreText');
    if (finalScoreEl) {
        // إنشاء وتنسيق بطاقة النتيجة (أخضر للناجح / أحمر للراسب)
        finalScoreEl.className = `result-card ${isPassed ? 'passed' : 'failed'}`;
        
        let statusMessage = isPassed 
            ? "🎉 ممتاز! لقد اجتزت الاختبار بنجاح" 
            : "❌ للأسف لم تتجاوز الاختبار (تم تفعيل حظر لمدة ساعة)";

        finalScoreEl.innerHTML = `
            <div class="result-score">${percentage}%</div>
            <div class="result-status">الدرجة: ${score} من ${questions.length}</div>
            <div style="margin-top: 0.5rem; font-size: 0.95rem;">${statusMessage}</div>
        `;
    }
}
