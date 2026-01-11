document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModalBtn = document.getElementById('close-modal');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const guestView = document.querySelector('.guest-view');
    const userView = document.querySelector('.user-view');
    const welcomeMsg = document.getElementById('welcome-msg');
    const dateEl = document.getElementById('current-date');
    const profileModal = document.getElementById('super-profile-modal');

    // Set Date
    if (dateEl) dateEl.innerText = new Date().toDateString();
    // Admin-only page protection
document.querySelectorAll(".protected-admin").forEach(link => {
    link.addEventListener("click", (e) => {
        const user = JSON.parse(localStorage.getItem("kiit_user"));
        if (!user || user.role !== "admin") {
            e.preventDefault();
            alert("Access denied. Admins only.");
        }
    });
});


    // Check Login State
    let currentUser = null;

async function checkAuth() {
    const token = localStorage.getItem("kiit_token");
    if (!token) return;

    try {
        const res = await fetch("/api/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem("kiit_user", JSON.stringify(data.user));
            updateUI(currentUser);
        }
    } catch {
        console.log("Auth check failed");
    }
}

checkAuth();


    // ================= LOGIN LOGIC (REAL BACKEND) =================
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("inp-name").value;
            const roll = document.getElementById("inp-roll").value;
            const section = document.getElementById("inp-sec").value;
            const branch = determineBranch(section);
            const email = document.getElementById("inp-email").value;
            const errorText = document.getElementById("email-error");

            const domainRegex = /^[a-zA-Z0-9._%+-]+@kiit\.ac\.in$/;
            if (!domainRegex.test(email)) {
                errorText.style.display = "block";
                errorText.textContent = "Access Denied: Please use official @kiit.ac.in email.";
                return;
            }

            const password = roll; // TEMP PASSWORD

            try {
                // 1️⃣ Try LOGIN
                let res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                let data = await res.json();

                // 2️⃣ If user NOT FOUND → REGISTER
                if (res.status === 400 || !data.success) {
                    res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name,
                            roll,
                            section,
                            branch,
                            email,
                            password
                        })
                    });

                    data = await res.json();
                }

                // 3️⃣ Save Token + User
                localStorage.setItem("kiit_user", JSON.stringify(data.user));
                if (data.token) localStorage.setItem("kiit_token", data.token);

                currentUser = data.user;
                updateUI(currentUser);
                closeModal();
            } catch (err) {
                errorText.style.display = "block";
                errorText.textContent = "Server unreachable. Please try again.";
            }
        });
    }

    // ================= LOGOUT =================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            localStorage.removeItem('kiit_user');
            localStorage.removeItem('kiit_token');
            currentUser = null;
            updateUI(null);
            window.location.reload();
        });
    }

    // ================= MOBILE SIDEBAR =================
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // ================= PAGE PROTECTION =================
    document.querySelectorAll(".protected-link").forEach(link => {
        link.addEventListener("click", (e) => {
            const user = localStorage.getItem("kiit_user");
            if (!user) {
                e.preventDefault();
                modal.classList.add("show");
            }
        });
    });

    // ================= UI HELPERS =================
    function openModal() { modal.classList.add('show'); }
    function closeModal() { modal.classList.remove('show'); }
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    function updateUI(user) {
        if (user) {
            guestView.classList.add('hidden');
            userView.classList.remove('hidden');

            document.getElementById('display-name').textContent = user.name;
            document.getElementById('display-roll').textContent = user.roll;
            document.getElementById('display-branch').textContent = user.branch;
            document.getElementById('display-role').textContent = user.role || "student";


            document.getElementById('modal-name').textContent = user.name;
            document.getElementById('modal-avatar').src =
                `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff&size=128`;

            if (welcomeMsg)
                welcomeMsg.innerHTML = `Welcome, <span style="opacity:0.9">${user.name.split(' ')[0]}</span> 👋`;

            document.getElementById('user-avatar').src =
                `https://ui-avatars.com/api/?name=${user.name}&background=1FC166&color=fff`;
        } else {
            guestView.classList.remove('hidden');
            userView.classList.add('hidden');
            if (welcomeMsg) welcomeMsg.innerHTML = `Hello, KIITian 👋`;
        }
    }

    function determineBranch(sec) {
        if (!sec) return "B.Tech";
        if (sec.toUpperCase().includes('CS')) return 'CSE';
        if (sec.toUpperCase().includes('IT')) return 'IT';
        if (sec.toUpperCase().includes('EC')) return 'ECE';
        return 'B.Tech';
    }

  // ================= PROFILE MODAL & GUEST CLICK FIX =================
    const profileSection = document.getElementById('profile-section');
    const profileModal = document.getElementById('super-profile-modal');
    
    if (profileSection) {
        profileSection.addEventListener('click', (e) => {
            e.preventDefault(); // Stop text selection behavior
            e.stopPropagation(); // Stop bubbling
            
            // Check if user is logged in
            const user = localStorage.getItem("kiit_user");
            
            if (user) {
                // User is logged in -> Open Super Profile
                if(profileModal) profileModal.classList.add('show');
            } else {
                // User is Guest -> Open Login Modal
                if(modal) modal.classList.add("show");
            }
        });
    }

    window.closeSuperProfile = () => {
        if(profileModal) profileModal.classList.remove('show');
    };
    // ================= DEMO DM =================
    window.attemptDM = (targetName) => {
        if (!currentUser) { modal.classList.add("show"); return; }

        const shareCommonGround = Math.random() > 0.5;

        if (shareCommonGround) {
            alert(`Success! You and ${targetName} share common ground. Chat unlocked. ✅`);
        } else {
            const req = confirm(`🔒 No common ground.\nSend unlock request?`);
            if (req) alert("Request Sent!");
        }
    };
});

// --- FORCE PROFILE CLICK FUNCTION ---
window.handleProfileClick = function() {
    const user = localStorage.getItem("kiit_user");
    const loginModal = document.getElementById('login-modal');
    const profileModal = document.getElementById('super-profile-modal');

    if (user) {
        // If user is logged in, show Profile Card
        if(profileModal) profileModal.classList.add('show');
    } else {
        // If guest, show Login
        if(loginModal) loginModal.classList.add('show');
    }
};