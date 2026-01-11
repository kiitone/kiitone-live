document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM ELEMENTS ---
    const modal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModalBtn = document.querySelector('.close-modal-x'); // Fixed selector if needed, or check ID
    const logoutBtn = document.getElementById('logout-btn');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const guestView = document.querySelector('.guest-view');
    const userView = document.querySelector('.user-view');
    const welcomeMsg = document.getElementById('welcome-msg');
    const profileModal = document.getElementById('super-profile-modal');
    const profileSection = document.getElementById('profile-section');

    // --- 2. AUTH STATE CHECK ---
    let currentUser = null;

    async function checkAuth() {
        const token = localStorage.getItem("kiit_token");
        if (!token) return;

        try {
            const res = await fetch("/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem("kiit_user", JSON.stringify(data.user));
                updateUI(currentUser);
            } else {
                // Token invalid
                localStorage.removeItem("kiit_user");
                localStorage.removeItem("kiit_token");
            }
        } catch (e) {
            console.error("Auth check failed", e);
        }
    }
    checkAuth();

    // --- 3. PROFILE CLICK HANDLER (THE FIX) ---
    // This attaches the click event directly via JS, which is more reliable than HTML onclick
    if (profileSection) {
        profileSection.onclick = function(e) {
            // Prevent triggering if clicking logout button inside
            if (e.target.closest('#logout-btn')) return;

            const user = localStorage.getItem("kiit_user");
            if (user) {
                // Logged in -> Open Profile Card
                if(profileModal) profileModal.classList.add('show');
            } else {
                // Guest -> Open Login Modal
                if(modal) modal.classList.add('show');
            }
        };
    }

    // --- 4. LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("inp-email").value;
            const password = document.getElementById("inp-roll").value; // Using Roll as password for now
            const name = document.getElementById("inp-name").value;
            const roll = document.getElementById("inp-roll").value;
            const section = document.getElementById("inp-sec").value;
            
            // Branch logic
            let branch = "B.Tech";
            if (section.toUpperCase().includes('CS')) branch = 'CSE';
            else if (section.toUpperCase().includes('IT')) branch = 'IT';
            else if (section.toUpperCase().includes('EC')) branch = 'ECE';

            // 1. Try Login
            try {
                let res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                let data = await res.json();

                // 2. If fail, Register
                if (!data.success) {
                    res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, roll, section, branch, email, password })
                    });
                    data = await res.json();
                }

                if (data.success) {
                    localStorage.setItem("kiit_user", JSON.stringify(data.user));
                    localStorage.setItem("kiit_token", data.token);
                    currentUser = data.user;
                    updateUI(currentUser);
                    if(modal) modal.classList.remove('show');
                } else {
                    alert(data.error || "Login failed");
                }
            } catch (err) {
                alert("Server error. Check console.");
            }
        });
    }

    // --- 5. UI UPDATER ---
    function updateUI(user) {
        if (user) {
            guestView.classList.add('hidden');
            userView.classList.remove('hidden');
            document.getElementById('display-name').textContent = user.name;
            document.getElementById('display-roll').textContent = user.roll;
            if(welcomeMsg) welcomeMsg.innerHTML = `Welcome, <span style="opacity:0.9">${user.name.split(' ')[0]}</span> 👋`;
            
            // Admin link visibility
            const adminLink = document.querySelector('.admin-link');
            if(adminLink) {
                adminLink.style.display = (user.role === 'admin') ? 'flex' : 'none';
            }
        } else {
            guestView.classList.remove('hidden');
            userView.classList.add('hidden');
        }
    }

    // --- 6. LOGOUT ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Stop bubbling to profile click
            localStorage.clear();
            window.location.reload();
        });
    }

    // --- 7. MODAL CLOSERS ---
    // Close button inside login modal
    const closeBtns = document.querySelectorAll('.close-modal-x, .btn-close-modal');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if(modal) modal.classList.remove('show');
            if(profileModal) profileModal.classList.remove('show');
        });
    });

    // Close Profile Modal (Global function for button inside modal)
    window.closeSuperProfile = () => {
        if(profileModal) profileModal.classList.remove('show');
    };

    // --- 8. MOBILE MENU ---
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            if(sidebar) sidebar.classList.toggle('open');
        });
    }
});