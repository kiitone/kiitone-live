// --- FIREBASE CONFIGURATION ---
// ⚠️ PASTE YOUR REAL CONFIG HERE FROM FIREBASE CONSOLE ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyBQyjja4AKt4J4Po8xqGoZPEhxGf84YeKw",
  authDomain: "kiitone-official.firebaseapp.com",
  projectId: "kiitone-official",
  storageBucket: "kiitone-official.firebasestorage.app",
  messagingSenderId: "872350222437",
  appId: "1:872350222437:web:c70f6b8cc23e5739ca1e8c"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Auth State on Load
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in -> Fetch details from DB
            fetchUserDetails(user.email);
        } else {
            // User is signed out
            localStorage.removeItem("kiit_user");
            updateUI(null);
        }
    });

    loadStudentCourses();
    
    // 2. Auth Form Logic
    const authForm = document.getElementById('auth-form');
    let isRegistering = false;

    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("inp-email").value;
            const password = document.getElementById("inp-password").value;

            // --- REGISTER FLOW (Firebase) ---
            if (isRegistering) {
                const name = document.getElementById("inp-name").value;
                const roll = document.getElementById("inp-roll-reg").value;
                const section = document.getElementById("inp-sec").value;

                if(!name || !roll || !email || !password) return alert("Fill all fields");

                try {
                    // Create User in Firebase
                    await auth.createUserWithEmailAndPassword(email, password);
                    
                    // Save User Data to Backend
                    const res = await fetch("/api/auth/register", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, roll, section, email, branch: "CSE" })
                    });
                    
                    const data = await res.json();
                    if(data.success) {
                        alert("Account Created! ✅");
                        document.getElementById('login-modal').classList.remove('show');
                    } else {
                        alert("Database Error: " + data.error);
                    }
                } catch (error) {
                    alert("Registration Failed: " + error.message);
                }
            } 
            // --- LOGIN FLOW (Firebase) ---
            else {
                try {
                    await auth.signInWithEmailAndPassword(email, password);
                    document.getElementById('login-modal').classList.remove('show');
                } catch (error) {
                    alert("Login Failed: " + error.message);
                }
            }
        });
    }

    // Tab Switcher
    window.switchAuthTab = (mode) => {
        // Forgot Password Logic
        if(mode === 'forgot') {
            const email = prompt("Enter your email for reset link:");
            if(email) {
                auth.sendPasswordResetEmail(email)
                    .then(() => alert("Password reset email sent! Check your inbox."))
                    .catch((error) => alert(error.message));
            }
            return;
        }
        
        isRegistering = (mode === 'register');
        document.getElementById('tab-login').classList.toggle('active', !isRegistering);
        document.getElementById('tab-register').classList.toggle('active', isRegistering);
        
        document.getElementById('register-fields').style.display = isRegistering ? 'block' : 'none';
        document.getElementById('btn-submit').innerText = isRegistering ? 'Create Account' : 'Login';
        document.getElementById('modal-title').innerText = isRegistering ? 'Student Register' : 'Student Login';
        
        // Hide OTP field (not needed for Firebase)
        const otpField = document.getElementById('otp-field');
        if(otpField) otpField.style.display = 'none';
    };

    // Close modals
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
        }
    };
});

// --- HELPER: Fetch Data from Postgres after Firebase Login ---
async function fetchUserDetails(email) {
    try {
        const res = await fetch("/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if(data.success) {
            localStorage.setItem("kiit_user", JSON.stringify(data.user));
            updateUI(data.user);
        }
    } catch(err) { console.error(err); }
}

// --- UI UPDATER ---
function updateUI(user) {
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

// Global Functions
window.handleProfileClick = function() {
    const user = localStorage.getItem("kiit_user");
    if (user) document.getElementById('super-profile-modal').classList.add('show');
    else document.getElementById('login-modal').classList.add('show');
};

window.handleLogout = function(e) {
    if(e) e.stopPropagation();
    auth.signOut().then(() => {
        window.location.reload();
    });
};

window.closeSuperProfile = function() { document.getElementById('super-profile-modal').classList.remove('show'); };
window.attemptDM = function(name) {
    const user = localStorage.getItem("kiit_user");
    if(!user) document.getElementById('login-modal').classList.add('show');
    else alert("Connection request sent to " + name);
};
window.toggleRightSidebar = function() {
    const sidebar = document.getElementById('right-sidebar');
    if(sidebar) sidebar.classList.toggle('open');
};
window.toggleLeftSidebar = function() {
    const sidebar = document.getElementById('left-sidebar');
    if(sidebar) sidebar.classList.toggle('open');
};

// Auto-close sidebar on mobile
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                document.getElementById('left-sidebar').classList.remove('open');
            }
        });
    });
});

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