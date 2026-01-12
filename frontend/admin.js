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

window.launchCourse = async function() {
    const title = document.querySelector('input').value;
    const category = document.querySelector('select').value;
    if(!title) return;

    const token = localStorage.getItem('kiit_token');
    await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category })
    });
    alert("Course Launched!");
    loadData();
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