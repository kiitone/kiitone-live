document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('kiit_token');
    if (!token) {
        alert('Please Login as Admin');
        window.location.href = 'index.html';
        return;
    }
    loadData();
});

async function loadData() {
    const token = localStorage.getItem('kiit_token');
    try {
        const resCourses = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
        const data = await resCourses.json();
        if(data.success) {
            renderCourses(data.courses);
            document.getElementById('total-courses').innerText = data.courses.length;
        }
        
        const resUsers = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        const dataU = await resUsers.json();
        if(dataU.success) {
            renderUsers(dataU.users);
            document.getElementById('total-users').innerText = dataU.users.length;
        }
    } catch(e) { console.log(e); }
}

// --- COURSE FUNCTIONS (UPGRADED) ---
window.launchCourse = async function() {
    const title = document.getElementById('course-title').value;
    const category = document.getElementById('course-category').value;
    const price = document.getElementById('course-price').value;
    const discount_code = document.getElementById('course-coupon').value;
    const description = document.getElementById('course-desc').value;

    if(!title || !price) {
        alert("Please enter Title and Price");
        return;
    }

    const token = localStorage.getItem('kiit_token');
    
    try {
        const res = await fetch('/api/admin/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title, category, price, discount_code, description })
        });
        
        const data = await res.json();
        if(data.success) {
            alert("Course Launched! 🚀");
            // Clear inputs
            document.getElementById('course-title').value = "";
            document.getElementById('course-price').value = "";
            document.getElementById('course-desc').value = "";
            loadData(); 
        } else {
            alert("Failed: " + data.error);
        }
    } catch(err) {
        alert("Server error connecting to database.");
    }
};

function renderCourses(list) {
    const el = document.getElementById('course-list');
    if(!el) return;
    el.innerHTML = list.map(c => `<tr><td>${c.title}</td><td>${c.category}</td><td>${c.students_enrolled||0}</td><td>Active</td></tr>`).join('');
}

function renderUsers(list) {
    const el = document.getElementById('user-list');
    if(!el) return;
    el.innerHTML = list.map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td><td><button>Edit</button></td></tr>`).join('');
}

// --- SUPER ADMIN SIMULATION ---
window.adminAction = function(action) {
    switch(action) {
        case 'broadcast':
            const msg = prompt("Enter message to send to ALL 2,400 students:");
            if(msg) alert(`✅ Broadcast Sent!\n\nEmail: 2400 delivered\nPush Notification: 1800 delivered`);
            break;
        case 'ban':
            const user = prompt("Enter Roll No to suspend:");
            if(user) alert(`🚫 User ${user} has been suspended for 7 days.`);
            break;
        case 'analytics':
            alert("📊 Analytics Report:\n\n- DAU: 1,200\n- Retention: 85%\n- Server Load: 12%\n\nDownloading PDF Report...");
            break;
        case 'content':
            alert("✅ AI Auto-Moderation:\n\n- 3 Toxic comments blocked.\n- 1 Spam post removed.");
            break;
        case 'backup':
            alert("💾 Database Backup Started...\n\nSnapshot saved to Secure Cloud Storage.");
            break;
    }
};