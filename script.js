document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. AUTHENTICATION CHECK ---
    const loggedInEmail = localStorage.getItem('loggedInEmail');
    if (!loggedInEmail) {
        window.location.href = "login.html";
        return; 
    }
    
    // --- 1. NAVBAR SCROLL LOGIC ---
    const topMenu = document.getElementById('top-menu');
    
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 10) {
            topMenu.classList.add('scrolled');
        } else {
            topMenu.classList.remove('scrolled');
        }
    });

    // --- 2. NAVIGATION LOGIC (Tabs) ---
    const menuProfile = document.getElementById('menu-profile');
    const menuStatus = document.getElementById('menu-status');
    const secProfile = document.getElementById('section-profile');
    const secStatus = document.getElementById('section-status');

    function switchTab(toProfile) {
        if (toProfile) {
            secProfile.style.display = 'block';
            secStatus.style.display = 'none';
            menuProfile.classList.add('active');
            menuStatus.classList.remove('active');
        } else {
            secProfile.style.display = 'none';
            secStatus.style.display = 'block';
            menuProfile.classList.remove('active');
            menuStatus.classList.add('active');
        }
    }

    menuProfile.addEventListener('click', (e) => { e.preventDefault(); switchTab(true); });
    menuStatus.addEventListener('click', (e) => { e.preventDefault(); switchTab(false); });
    
    document.getElementById('link-member-status').addEventListener('click', (e) => { 
        e.preventDefault(); 
        switchTab(false); 
    });

    // --- 2.5 LOGOUT LOGIC ---
    document.getElementById('menu-logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('loggedInEmail'); 
        window.location.href = "login.html"; 
    });

    // --- 3. ROLE & EMAIL PARSING ---
    function populateRoles(roleString, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 
        if (!roleString || roleString.trim() === '-') return;

        const roles = roleString.split(',');
        roles.forEach(role => {
            if (role.trim()) {
                const li = document.createElement('li');
                li.textContent = role.trim();
                container.appendChild(li);
            }
        });
    }

    function getFirstRole(roleString) {
        if (!roleString || roleString.trim() === '-') return '';
        const firstRole = roleString.split(',')[0].trim();
        return firstRole ? `- ${firstRole}` : '';
    }
    
    function formatEmails(emailString) {
        if (!emailString) return 'No email provided';
        return emailString.split(',').map(e => e.trim()).join(', ');
    }

    // --- 4. PLAN INCLUSIONS PARSING ---
    function parsePlanFeatures(rawText) {
        const lines = rawText.split('\n');
        const listEl = document.getElementById('plan-includes');
        listEl.innerHTML = '';
        
        let currentMainItem = null;
        let subList = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('-')) {
                if (!subList) {
                    subList = document.createElement('ul');
                    if(currentMainItem) currentMainItem.appendChild(subList);
                }
                const subLi = document.createElement('li');
                subLi.textContent = trimmed.substring(1).trim();
                subList.appendChild(subLi);
            } else {
                currentMainItem = document.createElement('li');
                currentMainItem.innerHTML = `✓ ${trimmed}`;
                listEl.appendChild(currentMainItem);
                subList = null; 
            }
        });
    }

    // --- 5. DATA FETCHING (Google Sheets & GitHub Repo) ---
    async function loadDashboardData() {
        const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        Papa.parse(csvUrl, {
            download: true,
            header: false,
            complete: async function(results) {
                try {
                    const data = results.data;
                    
                    // Bulletproof Header Finding
                    const headerRowIndex = data.findIndex(row => 
                        row[0] && row[0].toString().trim().toLowerCase() === 'name'
                    );
                    
                    if (headerRowIndex !== -1 && data.length > headerRowIndex + 1) {
                        
                        const targetUserRow = data.slice(headerRowIndex + 1).find(row => {
                            if (!row[1]) return false;
                            const emailList = row[1].split(',').map(e => e.trim().toLowerCase());
                            return emailList.includes(loggedInEmail.toLowerCase());
                        });
                        
                        if (!targetUserRow) {
                            console.error("User found in memory but not in Google Sheet. Logging out.");
                            localStorage.removeItem('loggedInEmail'); 
                            window.location.href = "login.html"; 
                            return;
                        }
                        
                        // Map data directly by column order
                        const userName = targetUserRow[0] ? targetUserRow[0].trim() : 'User';
                        const allUserEmails = targetUserRow[1] ? targetUserRow[1] : ''; 
                        const userGender = targetUserRow[2] ? targetUserRow[2].trim() : 'L';
                        const userPhone = targetUserRow[3] ? targetUserRow[3].trim() : 'N/A';
                        const actiRoleRaw = targetUserRow[4] ? targetUserRow[4].trim() : '';
                        const astiRoleRaw = targetUserRow[5] ? targetUserRow[5].trim() : '';
                        const userPlan = targetUserRow[6] ? targetUserRow[6].trim() : 'Premium (Legacy)';
                        const profilePicId = targetUserRow[7] ? targetUserRow[7].trim() : '';
                        
                        // Profile Header Updates
                        document.getElementById('user-name').textContent = userName;
                        document.getElementById('top-acti-role').textContent = getFirstRole(actiRoleRaw);
                        document.getElementById('top-asti-role').textContent = getFirstRole(astiRoleRaw);
                        
                        // Contact Info Updates
                        document.getElementById('link-member-status').textContent = userPlan;
                        document.getElementById('user-email').textContent = formatEmails(allUserEmails);
                        document.getElementById('user-phone').textContent = userPhone;
                        document.getElementById('plan-name').textContent = userPlan;
                        
                        // Full Department List Updates
                        populateRoles(actiRoleRaw, 'acti-roles');
                        populateRoles(astiRoleRaw, 'asti-roles');

                        // PROFILE PICTURE LOGIC
                        const profileImg = document.getElementById('user-profile-pic');
                        const baseUrl = "https://lh3.googleusercontent.com/d/";
                        const defaultMaleId = '1rpQ4Zy42TvwZLiy3oplSDvtVeGgDgzKM';
                        const defaultFemaleId = '1YAXVj4nkU75hiV5U0ewPmoU3qErDMB4-';

                        if (profilePicId && profilePicId !== '-') {
                            profileImg.src = baseUrl + profilePicId;
                        } else {
                            if (userGender.toUpperCase() === 'P' || userGender.toLowerCase() === 'female') {
                                profileImg.src = baseUrl + defaultFemaleId;
                            } else {
                                profileImg.src = baseUrl + defaultMaleId;
                            }
                        }

                        profileImg.onerror = function() {
                            if (userGender.toUpperCase() === 'P' || userGender.toLowerCase() === 'female') {
                                profileImg.src = baseUrl + defaultFemaleId;
                            } else {
                                profileImg.src = baseUrl + defaultMaleId;
                            }
                            profileImg.onerror = null; 
                        };

                        // 1. Fetch Pricing 
                        try {
                            const priceRes = await fetch('./membership/Plan_Price.txt');
                            if (priceRes.ok) {
                                const priceText = await priceRes.text();
                                const lines = priceText.split('\n');
                                let matchedPrice = "Price not found";

                                for (let line of lines) {
                                    if (!line.trim()) continue;
                                    const parts = line.split('|');
                                    if (parts.length === 2 && parts[0].trim() === userPlan) {
                                        matchedPrice = parts[1].trim();
                                        break;
                                    }
                                }
                                document.getElementById('plan-price').textContent = matchedPrice;
                            } else {
                                document.getElementById('plan-price').textContent = "RM 10 / month"; 
                            }
                        } catch (error) {
                            console.error("Error loading price text:", error);
                            document.getElementById('plan-price').textContent = "RM 10 / month";
                        }

                        // 2. Fetch Plan Inclusions
                        try {
                            const planDetailsRes = await fetch(`./membership/${userPlan}.txt`);
                            if (planDetailsRes.ok) {
                                const planData = await planDetailsRes.text();
                                parsePlanFeatures(planData);
                            } else {
                                document.getElementById('plan-includes').innerHTML = '<li>Error: Plan details not found.</li>';
                            }
                        } catch (error) {
                            console.error("Error loading plan details text:", error);
                            document.getElementById('plan-includes').innerHTML = '<li>Error loading plan details.</li>';
                        }
                    } else {
                        console.error("Could not find the 'Name' header row in the Google Sheet.");
                    }
                } catch (err) {
                    console.error("Error processing sheet data:", err);
                }
            },
            error: function(err) {
                console.error("PapaParse failed to fetch CSV:", err);
            }
        });
    }

    loadDashboardData();
});
