document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadStudentCourses();
    
    // Login Form Logic
    const loginForm = document.getElementById('login-form');
    let isVerifying = false; // Track if we are in OTP mode

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Get Values
            const name = document.getElementById("inp-name").value;
            const roll = document.getElementById("inp-roll").value;
            const section = document.getElementById("inp-sec").value;
            const email = document.getElementById("inp-email").value;
            const password = roll; // Roll is password
            
            // --- MODE 1: VERIFY OTP ---
            if (isVerifying) {
                const otp = document.getElementById("inp-otp").value;
                try {
                    const res = await fetch("/api/auth/verify", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, otp })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        alert("✅ Verified! Logging in...");
                        finishLogin(data);
                    } else {
                        alert("❌ " + data.error);
                    }
                } catch (err) { alert("Server error"); }
                return;
            }

            // --- MODE 2: LOGIN / REGISTER ---
            try {
                // 1. Try Login
                let res = await fetch("/api/auth/login", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                let data = await res.json();

                if (data.success) {
                    // Login Success
                    finishLogin(data);
                } else if (data.error && data.error.includes("not verified")) {
                    // User exists but not verified -> Send OTP again (Register flow)
                    startOtpFlow(name, roll, section, email, password);
                } else {
                    // Login Failed (User doesn't exist) -> Try Register
                    startOtpFlow(name, roll, section, email, password);
                }
            } catch (err) { alert("Server error"); }
        });
    }

    async function startOtpFlow(name, roll, section, email, password) {
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, roll, section, branch: "CSE", email, password })
            });
            const data = await res.json();

            if (data.success) {
                // UI Switch to OTP Mode
                isVerifying = true;
                document.getElementById('reg-fields').style.display = 'none';
                document.getElementById('otp-field').style.display = 'block';
                document.getElementById('login-title').innerText = "Verify Email";
                document.getElementById('login-desc').innerText = `OTP sent to ${email}`;
                document.getElementById('btn-submit').innerText = "Verify & Login";
                alert("✨ OTP Sent! Check your email.");
            } else {
                alert(data.error);
            }
        } catch(e) { alert("Could not send OTP"); }
    }

    function finishLogin(data) {
        localStorage.setItem("kiit_user", JSON.stringify(data.user));
        localStorage.setItem("kiit_token", data.token);
        document.getElementById('login-modal').classList.remove('show');
        
        // Reset Form
        isVerifying = false;
        document.getElementById('reg-fields').style.display = 'block';
        document.getElementById('otp-field').style.display = 'none';
        document.getElementById('btn-submit').innerText = "Access Dashboard";
        
        checkAuth(); // Update UI
    }
    
    // Close modals
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
        }
    };
});

// --- UI UPDATER ---
function checkAuth() {
    const user = JSON.parse(localStorage.getItem("kiit_user"));
    const guestView = document.querySelector('.guest-view');
    const userView = document.querySelector('.user-view');
    const adminLink = document.querySelector('.admin-link');
    const mobileExtras = document.getElementById('mobile-extras-btn');

    if (user) {
        guestView.classList.add('hidden');
        userView.classList.remove('hidden');
        document.getElementById('display-name').innerText = user.name;
        document.getElementById('display-roll').innerText = user.roll;
        
        const roleEl = document.getElementById('display-role');
        if(roleEl) roleEl.innerText = user.role || "student";
        
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff`;
        const modalAvatar = document.getElementById('modal-avatar');
        if(modalAvatar) modalAvatar.src = `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff`;
        const modalName = document.getElementById('modal-name');
        if(modalName) modalName.innerText = user.name;

        if(adminLink) adminLink.style.display = (user.role === 'admin') ? 'flex' : 'none';
        if(mobileExtras) mobileExtras.style.display = 'flex';

    } else {
        guestView.classList.remove('hidden');
        userView.classList.add('hidden');
        if(adminLink) adminLink.style.display = 'none';
        if(mobileExtras) mobileExtras.style.display = 'none';
    }
}

// --- GLOBAL FUNCTIONS ---
window.handleProfileClick = function() {
    const user = localStorage.getItem("kiit_user");
    if (user) {
        document.getElementById('super-profile-modal').classList.add('show');
    } else {
        document.getElementById('login-modal').classList.add('show');
    }
};

window.handleLogout = function(e) {
    if(e) e.stopPropagation();
    localStorage.clear();
    window.location.reload();
};

window.closeSuperProfile = function() {
    document.getElementById('super-profile-modal').classList.remove('show');
};

window.attemptDM = function(name) {
    const user = localStorage.getItem("kiit_user");
    if(!user) {
        document.getElementById('login-modal').classList.add('show');
    } else {
        alert("Connection request sent to " + name);
    }
};

window.toggleRightSidebar = function() {
    const sidebar = document.getElementById('right-sidebar');
    if(sidebar) sidebar.classList.toggle('open');
};

// --- LOAD COURSES ---
async function loadStudentCourses() {
    const container = document.getElementById('student-course-list');
    if (!container) return;

    try {
        const res = await fetch('/api/auth/courses');
        const data = await res.json();

        if (data.success && data.courses.length > 0) {
            container.innerHTML = data.courses.map(c => `
                <div class="class-item" style="border-left: 4px solid #1FC166; margin-bottom:8px; cursor:pointer;" 
                     onclick="window.location.href='course-details.html?id=${c.id}'">
                    <div class="time" style="color:#1FC166; font-size:1.5rem;"><i class="ph-bold ph-arrow-circle-right"></i></div>
                    <div class="info"><strong>${c.title}</strong><span>${c.category}</span></div>
                    <button style="margin-left:auto; background:white; border:1px solid #1FC166; color:#1FC166; padding:6px 12px; border-radius:6px;">Explore</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div style="padding:10px; color:#666;">No active courses. Check back later!</div>';
        }
    } catch (err) { console.error(err); }
}

// --- DEMO FEATURE SIMULATION ---
const features = {
    'Resume Builder': () => alert("🔍 AI Analyzing Resume..."),
    'Room Checker': () => alert("📍 Empty Rooms Found:\n- C-Block 304\n- Library Room 2"),
    'Placements': () => alert("💼 3 New Companies Visiting:\n- Microsoft (45 LPA)\n- Deloitte (8 LPA)"),
    'Mess Menu': () => alert("🍔 Mess Menu (Today):\nLunch: Chicken/Paneer\nDinner: Fried Rice"),
    'Transport': () => alert("Bus 4B Arriving in 5 mins 🚌")
};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.protected-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const text = link.innerText.trim();
            if(features[text]) { e.preventDefault(); features[text](); }
        });
    });
});