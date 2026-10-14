document.addEventListener('DOMContentLoaded', () => {
    let usersData = [];
    let currentUser = null;

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
                // Convert arrays into easy-to-search objects based on the headers
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

        // Search for user by email (case insensitive)
        currentUser = usersData.find(u => u.email.toLowerCase() === emailInput.toLowerCase());

        if (!currentUser) {
            errorMsg.textContent = "Email not found in our records.";
            return;
        }

        // Email found: Hide Step 1, Show Step 2
        errorMsg.textContent = "";
        document.getElementById('step-email').style.display = 'none';
        document.getElementById('step-password').style.display = 'block';
        document.getElementById('display-email').textContent = currentUser.email;
    });

    // --- GO BACK: Change Email ---
    document.getElementById('change-email').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('step-password').style.display = 'none';
        document.getElementById('step-email').style.display = 'block';
        document.getElementById('password-input').value = ""; // Clear password field
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

        // SUCCESS! Save the user's email into browser storage so the dashboard knows who logged in
        localStorage.setItem('loggedInEmail', currentUser.email);
        
        // Redirect to the provided Google Sites URL
        window.location.href = "https://sites.google.com/view/5titanium2024/member-dashboard";
    });
});
