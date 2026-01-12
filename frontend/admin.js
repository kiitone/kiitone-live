document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('kiit_token');
    if (!token) {
        alert('Access Denied');
        window.location.href = 'index.html';
        return;
    }
    loadData();
});

async function loadData() {
    const token = localStorage.getItem('kiit_token');
    
    // 1. Fetch Users
    const resUsers = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    const dataUsers = await resUsers.json();
    if (dataUsers.success) {
        renderUsers(dataUsers.users);
        document.getElementById('total-users').innerText = dataUsers.users.length;
    }

    // 2. Fetch Courses
    const resCourses = await fetch('/api/admin/courses', { headers: { Authorization: `Bearer ${token}` } });
    const dataCourses = await resCourses.json();
    if (dataCourses.success) {
        renderCourses(dataCourses.courses);
        document.getElementById('total-courses').innerText = dataCourses.courses.length;
    }
}

// --- USER FUNCTIONS ---
function renderUsers(users) {
    document.getElementById('user-list').innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button></td>
        </tr>
    `).join('');
}

async function deleteUser(id) {
    if(!confirm("Delete user?")) return;
    const token = localStorage.getItem('kiit_token');
    await fetch(`/api/admin/user/${id}/delete`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadData(); // Refresh
}

// --- COURSE FUNCTIONS ---
async function launchCourse() {
    const title = document.getElementById('course-title').value;
    const category = document.getElementById('course-category').value;
    if(!title) return alert("Enter a title");

    const token = localStorage.getItem('kiit_token');
    const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category })
    });
    
    const data = await res.json();
    if(data.success) {
        alert("Course Launched! 🚀");
        document.getElementById('course-title').value = "";
        loadData(); // Refresh list
    }
}

function renderCourses(courses) {
    document.getElementById('course-list').innerHTML = courses.map(c => `
        <tr>
            <td>${c.title}</td>
            <td>${c.category}</td>
            <td>${c.students_enrolled || 0}</td>
            <td><button class="action-btn delete-btn" onclick="deleteCourse('${c.id}')">Remove</button></td>
        </tr>
    `).join('');
}

async function deleteCourse(id) {
    if(!confirm("Remove this course?")) return;
    const token = localStorage.getItem('kiit_token');
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadData();
}