// دالة لجلب البيانات الحقيقية من السيرفر وعرض القائمة وتحديث المتفوق
async function renderStudentsList() {
    const listContainer = document.getElementById('studentsList');
    const topStudentElement = document.getElementById('TopStudent');
    const topGradeElement = document.getElementById('TopGrade');

    if (listContainer) {
        listContainer.innerHTML = '<div style="text-align:center; padding: 15px;">جاري تحميل قائمة الطلاب...</div>';
    }

    try {
        // 1. جلب الطلاب الحقيقيين من السيرفر
        const rawUsers = await getUsersFromBin();

        // 2. فلترة العناصر الوهمية (isPlaceholder) إن وجدت
        const realStudents = Array.isArray(rawUsers) 
            ? rawUsers.filter(u => u && !u.isPlaceholder) 
            : [];

        if (listContainer) listContainer.innerHTML = '';

        // 3. التحقق من القائمة بعد الفلترة
        if (realStudents.length === 0) {
            if (listContainer) {
                listContainer.innerHTML = '<div style="text-align:center; padding: 15px;">لا يوجد طلاب مسجلون حالياً.</div>';
            }
            if (topStudentElement) topStudentElement.innerText = "لا يوجد طلاب";
            if (topGradeElement) topGradeElement.innerText = "0%";
            return;
        }

        // 4. فرز الطلاب تنازلياً حسب الدرجة (grade)
        const sortedStudents = [...realStudents].sort((a, b) => (b.grade || 0) - (a.grade || 0));

        // ==========================================
        // تحديث اسم ودرجة الطالب المتفوق (المركز الأول)
        // ==========================================
        const topStudent = sortedStudents[0];
        if (topStudent) {
            const topName = topStudent.fullName || "طالب بدون اسم";
            const topGrade = topStudent.grade !== undefined ? topStudent.grade : 0;

            if (topStudentElement) {
                topStudentElement.innerText = topName;
            }
            if (topGradeElement) {
                topGradeElement.innerText = topGrade + "%";
            }
        }

        // ==========================================
        // عرض باقي القائمة داخل النافذة (Modal)
        // ==========================================
        if (listContainer) {
            sortedStudents.forEach((student, index) => {
                const rank = index + 1;
                let rankClass = '';
                let rankIcon = rank;

                // تحديد أيقونة المركز للأوائل
                if (rank === 1) { rankClass = 'rank-1'; rankIcon = '🥇'; }
                else if (rank === 2) { rankClass = 'rank-2'; rankIcon = '🥈'; }
                else if (rank === 3) { rankClass = 'rank-3'; rankIcon = '🥉'; }

                const studentName = student.fullName || "طالب بدون اسم";
                const studentScore = student.grade !== undefined ? student.grade : 0;

                const item = document.createElement('div');
                item.className = `student-item ${rankClass}`;
                item.innerHTML = `
                    <div class="student-info">
                        <div class="rank-badge">${rankIcon}</div>
                        <div class="student-name-text">${studentName}</div>
                    </div>
                    <div class="student-score">${studentScore}%</div>
                `;
                listContainer.appendChild(item);
            });
        }

    } catch (error) {
        console.error("خطأ أثناء جلب وترتيب قائمة الطلاب:", error);
        if (listContainer) {
            listContainer.innerHTML = '<div style="text-align:center; padding: 15px; color: red;">فشل في تحميل القائمة!</div>';
        }
    }
}

// فتح النافذة وعرض البيانات الحقيقية
async function openMoreModal() {
    const modal = document.getElementById('studentsModal');
    if (modal) modal.style.display = 'flex';
    await renderStudentsList();
}

function closeMoreModal() {
    const modal = document.getElementById('studentsModal');
    if (modal) modal.style.display = 'none';
}

function closeModalOnOverlay(event) {
    if (event.target.id === 'studentsModal') {
        closeMoreModal();
    }
}

// تحديث اسم ودرجة المتفوق فور تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    renderStudentsList();
});


// دالة لطي وتوسيع البطاقة بالسهم (الانزلاق للأعلى والأسفل)
function toggleCardCollapse() {
    const userCard = document.getElementById('userCard');
    if (userCard) {
        userCard.classList.toggle('collapsed');
    }
}

// دالة لإخفاء/إظهار البطاقة بالكامل إذا تضايق منها المستخدم
function toggleFullHide() {
    const container = document.getElementById('userCardContainer');
    const restoreBtn = document.getElementById('restoreCardBtn');

    if (container.classList.contains('fully-hidden')) {
        container.classList.remove('fully-hidden');
        if (restoreBtn) restoreBtn.style.display = 'none';
    } else {
        container.classList.add('fully-hidden');
        if (restoreBtn) restoreBtn.style.display = 'flex';
    }
}
