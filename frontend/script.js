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

// ==========================================
// 🚀 REAL FEATURE: LOAD COURSES
// ==========================================
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
                    
                    <!-- Clean Icon instead of Price -->
                    <div class="time" style="color:#1FC166; font-size:1.5rem;"><i class="ph-fill ph-arrow-circle-right"></i></div>
                    
                    <div class="info">
                        <strong>${c.title}</strong>
                        <span>${c.category}</span>
                    </div>
                    
                    <!-- Simple Button -->
                    <button style="margin-left:auto; background:white; border:1px solid #1FC166; color:#1FC166; padding:6px 12px; border-radius:6px;">
                        Explore
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div style="padding:10px; color:#666;">No active courses. Check back later!</div>';
        }
    } catch (err) { console.error(err); }
}
document.addEventListener('DOMContentLoaded', loadStudentCourses);

// ==========================================
// 🎭 DEMO FEATURE: SIMULATION ENGINE (Student)
// ==========================================
// This makes all those sidebar links "Clickable and Working" visually

// 1. Voting Logic
window.votePoll = function(btn) {
    btn.style.background = '#1FC166';
    btn.style.color = 'white';
    btn.innerText = 'Voted ✓';
    setTimeout(() => alert("Thanks for voting! Live stats updated."), 500);
};

// 2. Feature Router (Handles Sidebar Clicks)
const features = {
    'Resume Builder': () => {
        const file = prompt("Upload Resume (Simulated): Enter file name");
        if(file) {
            alert(`🔍 AI Analyzing ${file}...`);
            setTimeout(() => alert(`✅ Analysis Complete!\n\nScore: 85/100\n\nSuggestions:\n- Add more metrics to 'Projects'\n- Fix formatting in 'Education'`), 2000);
        }
    },
    'Room Checker': () => alert("📍 Empty Rooms Found:\n- C-Block 304 (AC)\n- Library Reading Room 2\n- KP-6 Common Room"),
    'Timetable': () => alert("📅 AI Timetable Generator:\n\nOptimized Schedule created without clashes.\nDownloaded as PDF."),
    'Placements': () => alert("💼 Placement Hub:\n\n- HighRadius (12 LPA) - Eligible\n- Deloitte (8 LPA) - Applied\n- Microsoft (45 LPA) - Opens in 2 days"),
    'Mess Menu': () => alert("🍔 Mess Menu (Today):\n\nBreakfast: Idli Sambar\nLunch: Chicken Curry / Paneer\nDinner: Fried Rice"),
    'Transport': () => alert("Bus 4B is arriving at Campus Gate in 5 mins. 🚌")
};

// Attach Listeners to Sidebar Links
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.protected-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const text = link.innerText.trim();
            if(features[text]) {
                e.preventDefault();
                features[text]();
            }
        });
    });
});

window.openFeature = (name) => {
    alert(`Opening ${name} module... (Full UI coming in Phase 2)`);
};

// --- TOGGLE RIGHT SIDEBAR (Mobile Fix) ---
window.toggleRightSidebar = function() {
    const sidebar = document.getElementById('right-sidebar');
    sidebar.classList.toggle('open');
};

// --- COURSE DETAILS LOGIC ---
window.openCourse = function(title, price, desc, code) {
    document.getElementById('cd-title').innerText = title;
    document.getElementById('cd-price').innerText = "₹" + price;
    document.getElementById('cd-desc').innerText = desc && desc !== 'undefined' ? desc : "No description available.";
    document.getElementById('cd-coupon').dataset.correctCode = code; // Store code
    document.getElementById('course-modal').classList.add('show');
};

window.closeCourseModal = function() {
    document.getElementById('course-modal').classList.remove('show');
};

window.applyCoupon = function() {
    const input = document.getElementById('cd-coupon').value;
    const correct = document.getElementById('cd-coupon').dataset.correctCode;
    const msg = document.getElementById('coupon-msg');
    
    if(input === correct && correct !== "null" && correct !== "undefined") {
        msg.style.display = 'block';
        msg.style.color = 'green';
        msg.innerText = "✅ Coupon Applied! 20% Off.";
    } else {
        msg.style.display = 'block';
        msg.style.color = 'red';
        msg.innerText = "❌ Invalid Coupon";
    }
};