document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadStudentCourses();
    
    const authForm = document.getElementById('auth-form');
    
    // State Variables
    let mode = 'login'; // 'login', 'register', 'forgot', 'verify_reg', 'verify_reset'
    let generatedOTP = null; 
    let tempUserData = null; 

    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("inp-email").value;

            // --- A. REGISTER FLOW ---
            if (mode === 'register') {
                const name = document.getElementById("inp-name").value;
                const roll = document.getElementById("inp-roll-reg").value;
                const section = document.getElementById("inp-sec").value;
                const password = document.getElementById("inp-password").value;

                if (!name || !roll || !email || !password) return alert("Fill all fields");

                generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
                tempUserData = { name, roll, section, branch: "CSE", email, password };

                sendEmail(email, generatedOTP, () => {
                    mode = 'verify_reg';
                    updateUIState();
                    alert(`✨ OTP Sent to ${email}`);
                });
                return;
            }

            // --- B. FORGOT PASSWORD FLOW ---
            if (mode === 'forgot') {
                const newPass = document.getElementById("inp-new-pass").value;
                if (!email || !newPass) return alert("Enter Email and New Password");

                generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
                tempUserData = { email, newPass };

                sendEmail(email, generatedOTP, () => {
                    mode = 'verify_reset';
                    updateUIState();
                    alert(`✨ OTP Sent to ${email}`);
                });
                return;
            }

            // --- C. VERIFY OTP (For Register OR Reset) ---
            if (mode === 'verify_reg' || mode === 'verify_reset') {
                const userOtp = document.getElementById("inp-otp").value;
                if (userOtp === generatedOTP) {
                    
                    if (mode === 'verify_reg') {
                        // Complete Registration
                        try {
                            const res = await fetch("/api/auth/register", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(tempUserData)
                            });
                            const data = await res.json();
                            if (data.success) finishLogin(data);
                            else alert("Error: " + data.error);
                        } catch(err) { alert("Server Error"); }
                    
                    } else if (mode === 'verify_reset') {
                        // Complete Password Reset
                        try {
                            const res = await fetch("/api/auth/reset-password", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(tempUserData)
                            });
                            const data = await res.json();
                            if (data.success) {
                                alert("✅ Password Updated! Please Login.");
                                window.location.reload();
                            } else {
                                alert("Error: " + data.error);
                            }
                        } catch(err) { alert("Server Error"); }
                    }
                } else {
                    alert("❌ Incorrect OTP");
                }
                return;
            }

            // --- D. LOGIN FLOW (Default) ---
            const password = document.getElementById("inp-password").value;
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) finishLogin(data);
                else alert(data.error);
            } catch (err) { alert("Server error"); }
        });
    }

    // Helper: Switch Modes
    window.switchAuthTab = (newMode) => {
        mode = newMode;
        updateUIState();
    };

    function updateUIState() {
        // Elements
        const tabs = document.getElementById('auth-tabs');
        const regFields = document.getElementById('register-fields');
        const passGroup = document.getElementById('pass-group');
        const forgotFields = document.getElementById('forgot-fields');
        const otpField = document.getElementById('otp-field');
        const btn = document.getElementById('btn-submit');
        const backLink = document.getElementById('back-login-link');
        const title = document.getElementById('modal-title');

        // Reset Visibilities
        regFields.style.display = 'none';
        passGroup.style.display = 'block';
        forgotFields.style.display = 'none';
        otpField.style.display = 'none';
        tabs.style.display = 'flex';
        backLink.style.display = 'none';

        // Tab Highlights
        document.getElementById('tab-login').classList.toggle('active', mode === 'login');
        document.getElementById('tab-register').classList.toggle('active', mode === 'register');

        // Logic
        if (mode === 'login') {
            title.innerText = "Student Login";
            btn.innerText = "Login";
        } 
        else if (mode === 'register') {
            title.innerText = "Student Register";
            regFields.style.display = 'block';
            btn.innerText = "Get OTP";
        }
        else if (mode === 'forgot') {
            title.innerText = "Reset Password";
            tabs.style.display = 'none'; // Hide tabs
            passGroup.style.display = 'none'; // Hide old pass
            forgotFields.style.display = 'block'; // Show new pass input
            backLink.style.display = 'block';
            btn.innerText = "Get OTP";
        }
        else if (mode === 'verify_reg' || mode === 'verify_reset') {
            title.innerText = "Verify OTP";
            tabs.style.display = 'none';
            regFields.style.display = 'none';
            passGroup.style.display = 'none';
            forgotFields.style.display = 'none';
            otpField.style.display = 'block';
            btn.innerText = mode === 'verify_reg' ? "Verify & Register" : "Verify & Update";
        }
    }

    function sendEmail(email, otp, callback) {
        const params = { to_email: email, otp: otp };
        // REPLACE WITH YOUR REAL IDS
        emailjs.send("service_neje326", "template_0pw8tol", params)
            .then(() => callback())
            .catch((err) => alert("Email Failed: " + JSON.stringify(err)));
    }

    function finishLogin(data) {
        localStorage.setItem("kiit_user", JSON.stringify(data.user));
        localStorage.setItem("kiit_token", data.token);
        document.getElementById('login-modal').classList.remove('show');
        checkAuth();
    }
    
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('show');
            // Reset to login if closed
            mode = 'login';
            updateUIState();
        }
    };
});

// --- UI UPDATER (Keep existing checkAuth, etc.) ---
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

// Global Functions
window.handleProfileClick = function() {
    const user = localStorage.getItem("kiit_user");
    if (user) document.getElementById('super-profile-modal').classList.add('show');
    else document.getElementById('login-modal').classList.add('show');
};

window.handleLogout = function(e) {
    if(e) e.stopPropagation();
    localStorage.clear();
    window.location.reload();
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

// --- LEFT SIDEBAR TOGGLE ---
window.toggleLeftSidebar = function() {
    const sidebar = document.getElementById('left-sidebar');
    if(sidebar) {
        sidebar.classList.toggle('open');
    }
};

// Auto-close sidebar when a link is clicked (Mobile UX)
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            // If on mobile, close sidebar after click
            if (window.innerWidth <= 1024) {
                document.getElementById('left-sidebar').classList.remove('open');
            }
        });
    });
});