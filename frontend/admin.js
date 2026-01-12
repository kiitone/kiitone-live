document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('kiit_token');
    if (!token) {
        alert('Access Denied');
        window.location.href = 'index.html';
        return;
    }
    loadData();
});

// --- FORCE GLOBAL FUNCTIONS ---

window.loadData = async function() {
    const token = localStorage.getItem('kiit_token');
    
    try {
        // 1. Fetch Users
        const resUsers = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        const dataUsers = await resUsers.json();
        if (dataUsers.success) {
            window.renderUsers(dataUsers.users);
            document.getElementById('total-users').innerText = dataUsers.users.length;
        }

        // 2. Fetch Courses
        const resCourses = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
        const dataCourses = await resCourses.json();
        if (dataCourses.success) {
            window.renderCourses(dataCourses.courses);
            document.getElementById('total-courses').innerText = dataCourses.courses.length;
        }
    } catch (err) {
        console.error("Error loading data", err);
    }
};

window.renderUsers = function(users) {
    const list = document.getElementById('user-list');
    if(!list) return;
    list.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button></td>
        </tr>
    `).join('');
};

window.deleteUser = async function(id) {
    if(!confirm("Delete user?")) return;
    const token = localStorage.getItem('kiit_token');
    await fetch(`/api/admin/user/${id}/delete`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    window.loadData(); 
};

// --- COURSE FUNCTIONS (FIXED) ---
window.launchCourse = async function() {
    console.log("Launch button clicked!"); // Debug log
    const titleInput = document.getElementById('course-title');
    const catInput = document.getElementById('course-category');
    
    const title = titleInput.value;
    const category = catInput.value;

    if(!title) {
        alert("Please enter a course title");
        return;
    }

    const token = localStorage.getItem('kiit_token');
    
    try {
        const res = await fetch('/api/admin/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title, category })
        });
        
        const data = await res.json();
        if(data.success) {
            alert("Course Launched! 🚀");
            titleInput.value = "";
            window.loadData(); // Refresh list
        } else {
            alert("Failed: " + data.error);
        }
    } catch(err) {
        alert("Server error connecting to database.");
    }
};

window.renderCourses = function(courses) {
    const list = document.getElementById('course-list');
    if(!list) return;
    list.innerHTML = courses.map(c => `
        <tr>
            <td><strong>${c.title}</strong></td>
            <td>${c.category}</td>
            <td>${c.students_enrolled || 0} Students</td>
            <td><button class="action-btn delete-btn" onclick="deleteCourse('${c.id}')">Remove</button></td>
        </tr>
    `).join('');
};

window.deleteCourse = async function(id) {
    if(!confirm("Remove this course?")) return;
    const token = localStorage.getItem('kiit_token');
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    window.loadData();
};