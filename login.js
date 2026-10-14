document.addEventListener('DOMContentLoaded', () => {
    let currentUser = null;
    let loggedInEmailString = ""; 

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

    const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

    // --- STEP 1: Verify Email ---
    document.getElementById('next-btn').addEventListener('click', () => {
        const emailInput = document.getElementById('email-input').value.trim();
        const errorMsg = document.getElementById('email-error');
        const nextBtn = document.getElementById('next-btn');
        
        if (!emailInput || !emailInput.includes('@')) {
            errorMsg.textContent = "Please enter a valid email address.";
            return;
        }

        // Show a loading state to prevent internet connection race conditions
        errorMsg.style.color = "#333";
        errorMsg.textContent = "Checking records, please wait...";
        nextBtn.disabled = true;

        // Fetch data ONLY when they click Next to ensure it's fully loaded
        Papa.parse(csvUrl, {
            download: true,
            header: false,
            complete: function(results) {
                nextBtn.disabled = false;
                errorMsg.style.color = "#d93025"; // Reset error text to red
                
                try {
                    const data = results.data;
                    
                    // Bulletproof Header Finding
                    const headerRowIndex = data.findIndex(row => 
                        row[0] && row[0].toString().trim().toLowerCase() === 'name'
                    );
                    
                    if (headerRowIndex === -1) {
                        errorMsg.textContent = "Database error: Cannot find sheet headers.";
                        return;
                    }

                    const headers = data[headerRowIndex].map(h => h ? h.trim() : '');
                    
                    const usersData = data.slice(headerRowIndex + 1).map(row => {
                        let userObj = {};
                        headers.forEach((headerName, index) => {
                            userObj[headerName] = row[index] ? row[index].trim() : '';
                        });
                        return userObj;
                    });

                    // Search for user by checking if the typed email exists within the comma-separated list
                    currentUser = usersData.find(u => {
                        // Find the column named 'email' regardless of capitalization
                        const emailKey = Object.keys(u).find(k => k.toLowerCase() === 'email');
                        if (!emailKey || !u[emailKey]) return false;
                        
                        const emailList = u[emailKey].split(',').map(e => e.trim().toLowerCase());
                        return emailList.includes(emailInput.toLowerCase());
                    });

                    if (!currentUser) {
                        errorMsg.textContent = "Email not found in our records.";
                        return;
                    }

                    // Email found: Hide Step 1, Show Step 2
                    loggedInEmailString = emailInput; 
                    errorMsg.textContent = "";
                    document.getElementById('step-email').style.display = 'none';
                    document.getElementById('step-password').style.display = 'block';
                    document.getElementById('display-email').textContent = loggedInEmailString;
                    
                } catch (err) {
                    console.error(err);
                    errorMsg.textContent = "Error processing data.";
                }
            },
            error: function() {
                nextBtn.disabled = false;
                errorMsg.style.color = "#d93025";
                errorMsg.textContent = "Network error. Please check your internet connection.";
            }
        });
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
        
        // Find the password column regardless of capitalization in the sheet
        const pwdKey = Object.keys(currentUser).find(k => k.toLowerCase() === 'password');
        const actualPassword = pwdKey ? currentUser[pwdKey] : '';

        if (pwdInput !== actualPassword) {
            errorMsg.textContent = "Password incorrect";
            return;
        }

        // SUCCESS! Save email and redirect
        localStorage.setItem('loggedInEmail', loggedInEmailString);
        window.location.href = "https://sites.google.com/view/5titanium2024/member-dashboard";
    });
});
