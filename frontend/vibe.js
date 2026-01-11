// vibe.js - Final Production Version

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem("kiit_user"));
    if (!user) {
        window.location.href = "index.html"; // Force login
        return;
    }
    renderFeed();
    renderDirectory();
    renderChatList(); // Still mock for now (safe for presentation)
});

// --- TAB SWITCHING ---
window.switchTab = (tabName) => {
    document.querySelectorAll('.vibe-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.vibe-nav').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Highlight sidebar
    const activeLink = document.querySelector(`.vibe-nav[onclick="switchTab('${tabName}')"]`);
    if (activeLink) activeLink.classList.add('active');
};

// --- FEED SYSTEM (View & Delete) ---
async function renderFeed() {
    const container = document.getElementById('feed-stream');
    if (!container) return;
    
    const currentUser = JSON.parse(localStorage.getItem("kiit_user"));

    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (!data.success) throw new Error('Failed to load');

        container.innerHTML = data.posts.map(post => {
            // Show Delete button if: User owns post OR User is Admin
            const showDelete = (currentUser.id === post.user_id) || (currentUser.role === 'admin');
            
            return `
            <div class="feed-card">
                <div class="post-header">
                    <div class="post-user">
                        ${post.is_anonymous 
                            ? '<div class="anon-avatar"><i class="ph-bold ph-mask-happy"></i></div>' 
                            : `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.user_name || 'User')}&background=random">`}
                        <div>
                            <span class="u-name">${post.is_anonymous ? 'Anonymous' : (post.user_name || 'User')}</span>
                        </div>
                    </div>
                    ${showDelete ? 
                        `<button onclick="deletePost('${post.id}')" style="background:none;border:none;color:red;cursor:pointer;">
                            <i class="ph-bold ph-trash"></i>
                        </button>` 
                        : ''}
                </div>
                <div class="post-content">${post.content.replace(/\n/g, '<br>')}</div>
                <div class="post-actions">
                    <div class="action-item"><i class="ph-bold ph-heart"></i> Like</div>
                    <div class="action-item"><i class="ph-bold ph-share-network"></i> Share</div>
                </div>
            </div>
        `}).join('');
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error loading feed.</p>`;
    }
}

// --- DELETE POST FUNCTION ---
window.deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    const token = localStorage.getItem('kiit_token');
    
    try {
        const res = await fetch(`/api/posts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderFeed(); // Refresh feed
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Server error");
    }
};

// --- DIRECTORY SYSTEM (Real Users) ---
async function renderDirectory() {
    const container = document.getElementById('people-grid');
    if (!container) return;

    try {
        const res = await fetch('/api/auth/directory');
        const data = await res.json();
        
        if (data.success) {
            container.innerHTML = data.users.map(s => `
                <div class="person-card">
                    <div class="pc-header">
                        <img src="https://ui-avatars.com/api/?name=${s.name}&background=random" class="person-img">
                        <span class="pc-badge">${s.role === 'admin' ? 'Admin' : 'Student'}</span>
                    </div>
                    <div class="person-name">${s.name}</div>
                    <div class="person-role">${s.branch || 'B.Tech'} • ${s.roll}</div>
                    <button class="connect-btn" onclick="alert('Connection request sent to ${s.name}!')">
                        Connect 🔒
                    </button>
                </div>
            `).join('');
        }
    } catch (err) {
        container.innerHTML = "<p>Loading directory...</p>";
    }
}

// --- CHAT SYSTEM (Mock / Demo Only) ---
function renderChatList() {
    const container = document.getElementById('chat-list');
    if (!container) return;
    // Keeping mock data for presentation safety
    const mockChats = [
        { name: "Team Launchpad", lastMsg: "Meeting at 5?", time: "10m", img: "https://ui-avatars.com/api/?name=Team&background=random" },
        { name: "KIIT Admin", lastMsg: "Welcome to the portal!", time: "1d", img: "https://ui-avatars.com/api/?name=Admin&background=0B3D2E&color=fff" }
    ];
    container.innerHTML = mockChats.map(c => `
        <div class="chat-item" onclick="loadChat('${c.name}')">
            <img src="${c.img}">
            <div class="chat-meta">
                <h4>${c.name}</h4>
                <p>${c.lastMsg}</p>
            </div>
            <span class="chat-time">${c.time}</span>
        </div>
    `).join('');
}

// --- POST CREATION ---
window.openPostModal = () => document.getElementById('post-modal').classList.add('show');
window.closePostModal = () => document.getElementById('post-modal').classList.remove('show');

window.createPost = async () => {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return alert('Please write something');

    const isAnonymous = document.getElementById('post-anon').checked;
    const token = localStorage.getItem('kiit_token');

    try {
        const res = await fetch('/api/posts/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, is_anonymous: isAnonymous })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('post-content').value = '';
            closePostModal();
            renderFeed();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert('Error posting');
    }
};

window.loadChat = (name) => {
    document.getElementById('chat-empty-state').style.display = 'none';
    document.getElementById('active-chat-view').style.display = 'flex';
    document.getElementById('chat-header-name').innerText = name;
    document.getElementById('chat-header-img').src = `https://ui-avatars.com/api/?name=${name}&background=random`;
};