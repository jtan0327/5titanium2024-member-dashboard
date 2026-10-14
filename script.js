document.addEventListener('DOMContentLoaded', () => {
    
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

    // --- 3. ROLE PARSING ---
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
        try {
            const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            Papa.parse(csvUrl, {
                download: true,
                header: true,
                complete: async function(results) {
                    const data = results.data;
                    
                    if (data.length > 0) {
                        const user = data[0]; 
                        
                        const userPlan = user['Membership status'] || 'Premium (Legacy)';
                        const actiRoleRaw = user['ACTI Role'] || '';
                        const astiRoleRaw = user['ASTI Role'] || '';
                        
                        // Profile Header Updates
                        document.getElementById('user-name').textContent = user.Name || 'Admin User';
                        document.getElementById('top-acti-role').textContent = getFirstRole(actiRoleRaw);
                        document.getElementById('top-asti-role').textContent = getFirstRole(astiRoleRaw);
                        
                        // Contact Info Updates
                        document.getElementById('link-member-status').textContent = userPlan;
                        document.getElementById('user-email').textContent = user.email || 'admin@gmail.com';
                        document.getElementById('user-phone').textContent = user['phone number'] || '011 345 6789';
                        
                        document.getElementById('plan-name').textContent = userPlan;
                        
                        // Full Department List Updates
                        populateRoles(actiRoleRaw, 'acti-roles');
                        populateRoles(astiRoleRaw, 'asti-roles');

                        // PROFILE PICTURE LOGIC
                        const userGender = user.Gender || 'L';
                        const profilePicId = user.Profile_Pic_ID ? user.Profile_Pic_ID.trim() : '';
                        const profileImg = document.getElementById('user-profile-pic');
                        
                        const baseUrl = "https://drive.usercontent.google.com/download?id=";
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
                    }
                }
            });

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    }

    loadDashboardData();
});
