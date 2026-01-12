document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('kiit_token');
    
    // Debug: Check if token exists
    if (!token) {
        console.error("No token found in localStorage");
        alert('Access Denied: No token found. Please login again.');
        window.location.href = 'index.html';
        return;
    }

    // Load initial data
    await window.loadData();
});

// --- FORCE GLOBAL FUNCTIONS ---

window.loadData = async function() {
    const token = localStorage.getItem('kiit_token');
    
    try {
        // 1. Fetch Users
        const resUsers = await fetch('/api/admin/users', { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        });
        
        if (resUsers.status === 401 || resUsers.status === 403) {
            throw new Error("Unauthorized: " + resUsers.statusText);
        }

        const dataUsers = await resUsers.json();
        if (dataUsers.success) {
            window.renderUsers(dataUsers.users);
            const totalEl = document.getElementById('total-users');
            if(totalEl) totalEl.innerText = dataUsers.users.length;
        }

        // 2. Fetch Courses
        const resCourses = await fetch('/api/admin/courses', { 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        });
        const dataCourses = await resCourses.json();
        if (dataCourses.success) {
            window.renderCourses(dataCourses.courses);
            const courseEl = document.getElementById('total-courses');
            if(courseEl) courseEl.innerText = dataCourses.courses.length;
        }
    } catch (err) {
        console.error("Error loading data:", err);
        // If it fails, don't just alert 'Access Denied', check why
        if (err.message.includes("Unauthorized")) {
            alert("Session expired. Please login again.");
            window.location.href = 'index.html';
        }
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
    await fetch(`/api/admin/user/${id}/delete`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
    });
    window.loadData(); 
};

// --- COURSE FUNCTIONS (FIXED) ---
window.launchCourse = async function() {
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
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ title,