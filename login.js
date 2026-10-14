document.addEventListener('DOMContentLoaded', () => {
    let usersData = [];
    let currentUser = null;
    let loggedInEmailString = ""; // To store the exact email the user typed

    // Navbar Scroll Logic for Login Page
    const topMenu = document.getElementById('top-menu');
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 10) {
            topMenu.classList.add('scrolled');
        } else {
            topMenu.classList.remove('scrolled');
        }
    });

    // Load data silently in the background when the login page opens
    const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    Papa.parse(csvUrl, {
        download: true,
        header: false,
        complete: function(results) {
            const data = results.data;
            const headerRowIndex = data.findIndex(row => row[0] === 'Name' && row[1] === 'email');
            
            if (headerRowIndex !== -1) {
                const headers = data[headerRowIndex];
                usersData = data.slice(headerRowIndex + 1).map(row => {
                    let userObj = {};
                    headers.forEach((headerName, index) => {
                        userObj[headerName.trim()] = row[index] ? row[index].trim() : '';
                    });
                    return userObj;
                });
            }
        }
    });

    // --- STEP 1: Verify Email ---
    document.getElementById('next-btn').addEventListener('click', () => {
        const emailInput = document.getElementById('email-input').value.trim();
        const errorMsg = document.getElementById('email-error');
        
        if (!emailInput || !emailInput.includes('@')) {
            errorMsg.textContent = "Please enter a valid email address.";
            return;
        }

        // Search for user by checking if the typed email exists within the comma-separated list
        currentUser = usersData.find(u => {
            if (!u.email) return false;
            // Split the cell by comma, trim spaces, and check if any match the input
            const emailList = u.email.split(',').map(e => e.trim().toLowerCase());
            return emailList.includes(emailInput.toLowerCase());
        });

        if (!currentUser) {
            errorMsg.textContent = "Email not found in our records.";
            return;
        }

        // Email found: Hide Step 1, Show Step 2
        loggedInEmailString = emailInput; // Save exactly what they typed to show on the next screen
        errorMsg.textContent = "";
        document.getElementById('step-email').style.display = 'none';
        document.getElementById('step-password').style.display = 'block';
        document.getElementById('display-email').textContent = loggedInEmailString;
    });

    // --- GO BACK: Change Email ---
    document.getElementById('change-email').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('step-password').style.display = 'none';
        document.getElementById('step-email').style.display = 'block';
        document.getElementById('password-input').value = ""; 
        document.getElementById('password-error').textContent = "";
    });

    // --- PASSWORD VISIBILITY TOGGLE ---
    document.getElementById('toggle-password').addEventListener('click', function() {
        const pwdInput = document.getElementById('password-input');
        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            this.textContent = 'hide';
        } else {
            pwdInput.type = 'password';
            this.textContent = 'show';
        }
    });

    // --- STEP 2: Verify Password and Login ---
    document.getElementById('signin-btn').addEventListener('click', () => {
        const pwdInput = document.getElementById('password-input').value;
        const errorMsg = document.getElementById('password-error');
        
        // Match the password field exactly as it's titled in your sheet
        if (pwdInput !== currentUser.Password) {
            errorMsg.textContent = "Password incorrect";
            return;
        }

        // SUCCESS! Save the typed email into browser storage so the dashboard knows who logged in
        localStorage.setItem('loggedInEmail', loggedInEmailString);
        
        // Redirect to the provided Google Sites URL
        window.location.href = "https://sites.google.com/view/5titanium2024/member-dashboard";
    });
});
