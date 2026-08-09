const binId = '6a778ff0da38895dfecaf65c';
const masterKey = '$2a$10$L5TKJEEwXfdNsbiWvZdKS.UKujYYg90P4681U0FaMgdh5e9K3mhRq';

// ==========================================
// 1. ميزات الـ localStorage والتحكم في الجلسة
// ==========================================

// حفظ المستخدم الحالي في localStorage
function saveUserSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// جلب البيانات المحفوظة محلياً
function getUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
}

// دالة عرض التنبيه الموحدة
function showWelcomeAlert(user) {
    const currentGrade = user.grade !== undefined ? user.grade : 10;
    alert(`أهلاً بك يا ${user.fullName} 👋\nدرجتك الحالية هي: ${currentGrade}\nتم تسجيل الدخول بنجاح!`);
    
    const loginD = document.getElementById("loginD");
    const loginSecc = document.getElementById("loginSecc");
    if (loginD) loginD.style.display = "none";
    if (loginSecc) loginSecc.style.display = "block";
}

// دالة تسجيل الخروج (مسح البيانات من المتصفح)
function logout() {
    localStorage.removeItem('currentUser');
    alert("تم تسجيل الخروج بنجاح.");
    switchAuthTab('login');
}

// ==========================================
// 2. الفحص عند فتح أو تحديث الصفحة تلقائياً
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    const activeUser = getUserSession();

    // إذا كان هناك حساب محفوظ سابقاً في localStorage
    if (activeUser) {
        try {
            // نجلب البيانات من السيرفر لتحديث الدرجة لو تغيرت
            const users = await getUsersFromBin();
            const matchedUser = users.find(u => u.studentId === activeUser.studentId);

            if (matchedUser) {
                // نحدث البيانات المحفوظة محلياً بالبيانات الجديدة
                saveUserSession(matchedUser);
                // نظهر التنبيه مباشرة
                showWelcomeAlert(matchedUser);
            } else {
                // إذا حُذف الطالب من السيرفر، نمسح بياناته المحلية
                localStorage.removeItem('currentUser');
            }
        } catch (err) {
            // في حال عدم وجود إنترنت، نظهر التنبيه بالبيانات المحفوظة سابقاً
            showWelcomeAlert(activeUser);
        }
    }
});

// ==========================================
// 3. التنقل بين التبويبات
// ==========================================
function switchAuthTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const buttons = document.querySelectorAll('.tab-btn');

    if (!loginForm || !signupForm) return;

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        if (buttons.length > 0) buttons[0].classList.add('active');
        if (buttons.length > 1) buttons[1].classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        if (buttons.length > 1) buttons[1].classList.add('active');
        if (buttons.length > 0) buttons[0].classList.remove('active');
    }
}

// ==========================================
// 4. التعامل مع الـ API (JSONBin - PUT/GET/Search)
// ==========================================

// جلب قائمة الحسابات من السيرفر (GET)
async function getUsersFromBin() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': masterKey }
        });
        const data = await response.json();
        
        return Array.isArray(data.record) ? data.record : [];
    } catch (error) {
        console.error("تفاصيل الخطأ أثناء جلب البيانات:", error);
        return [];
    }
}

// حفظ أو تحديث كامل المصفوفة في السيرفر (PUT)
async function saveUsersToBin(usersArray) {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': masterKey
        },
        body: JSON.stringify(usersArray)
    });
    return await response.json();
}

/**
 * دالة التعديل: (جلب -> بحث -> تعديل grade -> حفظ عبر PUT)
 * @param {string} studentId - رقم الطالب المراد التعديل له
 * @param {number} newGrade - الدرجة الجديدة (الافتراضية 10)
 */
async function updateStudentGrade(studentId, newGrade) {
    try {
        // 1. جلب القائمة الحالية من السيرفر
        const users = await getUsersFromBin();

        // 2. البحث عن الطالب عبر رقم الطالب studentId
        const userIndex = users.findIndex(u => u.studentId === studentId);

        if (userIndex !== -1) {
            // 3. تعديل قيمة الدرجة للطالب المحدد
            users[userIndex].grade = newGrade;

            // 4. إرسال المصفوفة المحدثة عبر PUT
            await saveUsersToBin(users);

            // إذا كان هو المستخدم المسجل حالياً، نحدث الجلسة المحلية أيضاً
            const activeUser = getUserSession();
            if (activeUser && activeUser.studentId === studentId) {
                activeUser.grade = newGrade;
                saveUserSession(activeUser);
            }

            console.log(`تم تعديل درجة الطالب ${studentId} إلى ${newGrade} بنجاح.`);
            return true;
        } else {
            console.warn(`لم يتم العثور على طالب برقم: ${studentId}`);
            return false;
        }
    } catch (err) {
        console.error("حدث خطأ أثناء تعديل الدرجة:", err);
        return false;
    }
}

// ==========================================
// 5. نموذج إنشاء حساب جديد (Signup)
// ==========================================
document.getElementById('signup-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const fullName = document.getElementById('signup-fullname').value.trim();
    const studentId = document.getElementById('signup-student-id').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const submitBtn = this.querySelector('.btn-submit');

    if (!fullName || !studentId || !password) {
        alert("يرجى إكمال جميع الحقول!");
        return;
    }

    submitBtn.textContent = "جاري إنشاء الحساب...";
    submitBtn.disabled = true;

    try {
        const users = await getUsersFromBin();

        const isExist = users.some(user => user.studentId === studentId);

        if (isExist) {
            alert("عذراً، رقم التعريف هذا مسجل مسبقاً!");
            return;
        }

        // إنشاء المستخدم بـ درجة مبدئية 10
        const newUser = {
            id: Date.now(),
            fullName: fullName,
            studentId: studentId,
            password: password,
            grade: 0, // الرقم المبدئي 10
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // حفظ المصفوفة كاملة عبر PUT
        await saveUsersToBin(users);

        alert("تم إنشاء الحساب بنجاح! الدرجة المبدئية: 0. يمكنك الآن تسجيل الدخول.");
        this.reset();
        switchAuthTab('login');

    } catch (err) {
        console.error("خطأ أثناء إنشاء الحساب:", err);
        alert("حدث خطأ أثناء الاتصال بالسيرفر.");
    } finally {
        submitBtn.textContent = "إنشاء حساب جديد";
        submitBtn.disabled = false;
    }
});

// ==========================================
// 6. نموذج تسجيل الدخول (Login)
// ==========================================
document.getElementById('login-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const studentId = document.getElementById('login-student-id').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const submitBtn = this.querySelector('.btn-submit');

    submitBtn.textContent = "جاري التحقق...";
    submitBtn.disabled = true;

    try {
        const users = await getUsersFromBin();

        const matchedUser = users.find(user => 
            user.studentId === studentId && user.password === password
        );

        if (matchedUser) {
            // 1. حفظ البيانات في الـ localStorage
            saveUserSession(matchedUser);

            // 2. إظهار التنبيه فوراً
            showWelcomeAlert(matchedUser);

        } else {
            alert("رقم التعريف أو كلمة المرور غير صحيحة!");
        }

    } catch (err) {
        console.error("خطأ أثناء تسجيل الدخول:", err);
        alert("حدث خطأ أثناء الاتصال بالسيرفر.");
    } finally {
        submitBtn.textContent = "دخول";
        submitBtn.disabled = false;
    }
});

function updateStudentGradeNow(grade){
    let r = getUserSession()
    updateStudentGrade(r.studentId,grade)
}