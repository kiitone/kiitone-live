document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Login Form Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("inp-name").value;
            const roll = document.getElementById("inp-roll").value;
            const section = document.getElementById("inp-sec").value;
            const email = document.getElementById("inp-email").value;
            const password = roll; // Roll (or 'admin123') is password

            try {
                // 1. Try Login
                let res = await fetch("/api/auth/login", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                let data = await res.json();

                // 2. If fail, Try Register (Student flow)
                if (!data.success) {
                    res = await fetch("/api/auth/register", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, roll, section, branch: "CSE", email, password })
                    });
                    data = await res.json();
                }

                if (data.success) {
                    localStorage.setItem("kiit_user", JSON.stringify(data.user));
                    localStorage.setItem("kiit_token", data.token);
                    document.getElementById('login-modal').classList.remove('show');
                    checkAuth(); // Update UI
                } else {
                    alert(data.error || "Login Failed");
                }
            } catch (err) { alert("Server error"); }
        });
    }
    
    // Close modals on clicking outside (Glassmorphism effect)
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
        }
    };
});

// --- MAIN UI UPDATER ---
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("kiit_user"));
    const guestView = document.querySelector('.guest-view');
    const userView = document.querySelector('.user-view');
    const adminLink = document.querySelector('.admin-link');

    if (user) {
        // User Logged In
        guestView.classList.add('hidden');
        userView.classList.remove('hidden');
        document.getElementById('display-name').innerText = user.name;
        document.getElementById('display-roll').innerText = user.roll;
        document.getElementById('display-role').innerText = user.role;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff`;
        
        // Profile Modal Data
        const modalAvatar = document.getElementById('modal-avatar');
        if(modalAvatar) modalAvatar.src = `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff`;
        const modalName = document.getElementById('modal-name');
        if(modalName) modalName.innerText = user.name;

        // Admin Link Visibility
        if(adminLink) {
            // Show only if role is admin
            adminLink.style.display = (user.role === 'admin') ? 'flex' : 'none';
        }
    } else {
        // User is Guest
        guestView.classList.remove('hidden');
        userView.classList.add('hidden');
        if(adminLink) adminLink.style.display = 'none';
    }
}

// --- GLOBAL FUNCTIONS (Attached to HTML onclicks) ---

// 1. Profile / Guest Click Handler
window.handleProfileClick = function() {
    const user = localStorage.getItem("kiit_user");
    if (user) {
        document.getElementById('super-profile-modal').classList.add('show');
    } else {
        document.getElementById('login-modal').classList.add('show');
    }
};

// 2. Logout Handler
window.handleLogout = function(e) {
    if(e) e.stopPropagation();
    localStorage.clear();
    window.location.reload();
};

// 3. Close Profile Modal
window.closeSuperProfile = function() {
    document.getElementById('super-profile-modal').classList.remove('show');
};

// 4. Demo DM Button
window.attemptDM = function(name) {
    const user = localStorage.getItem("kiit_user");
    if(!user) {
        document.getElementById('login-modal').classList.add('show');
    } else {
        alert("Connection request sent to " + name);
    }
};