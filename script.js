document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. BANNER SCROLL LOGIC ---
    const banner = document.getElementById('banner');
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 50) {
            banner.style.marginTop = `-${banner.offsetHeight}px`; // Move banner away
        } else {
            banner.style.marginTop = '0'; // Bring back when at top
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

    // Attach listeners to Sidebar
    menuProfile.addEventListener('click', (e) => { e.preventDefault(); switchTab(true); });
    menuStatus.addEventListener('click', (e) => { e.preventDefault(); switchTab(false); });
    
    // If user clicks "Member Status" text inside the profile section, switch tab
    secProfile.addEventListener('click', (e) => {
        if(e.target.innerText.toLowerCase().includes('member status')) {
            switchTab(false);
        }
    });

    // --- 3. ROLE PARSING (Comma Separator to New Line) ---
    function populateRoles(roleString, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = ''; 
        if (!roleString) return;

        // Split by comma and create list items
        const roles = roleString.split(',');
        roles.forEach(role => {
            if (role.trim()) {
                const li = document.createElement('li');
                li.textContent = role.trim();
                container.appendChild(li);
            }
        });
    }

    // --- 4. PLAN INCLUSIONS PARSING (Hyphen to Sub-bullets) ---
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
                // If text has (-), separate and add as a nested bullet
                if (!subList) {
                    subList = document.createElement('ul');
                    if(currentMainItem) currentMainItem.appendChild(subList);
                }
                const subLi = document.createElement('li');
                subLi.textContent = trimmed.substring(1).trim();
                subList.appendChild(subLi);
            } else {
                // Main parent bullet with a checkmark
                currentMainItem = document.createElement('li');
                currentMainItem.innerHTML = `✓ ${trimmed}`;
                listEl.appendChild(currentMainItem);
                subList = null; // Reset for the next main item
            }
        });
    }

    // --- 5. DATA FETCHING (Google Sheets & GitHub Repo) ---
    async function loadDashboardData() {
        try {
            const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            // Fetch User Data from Google Sheets
            Papa.parse(csvUrl, {
                download: true,
                header: true,
                complete: async function(results) {
                    const data = results.data;
                    
                    if (data.length > 0) {
                        const user = data[0]; 
                        const userPlan = user.Plan || 'Premium (Legacy)';
                        
                        // Update Profile UI
                        document.getElementById('user-name').textContent = user.Name || 'Admin User';
                        document.getElementById('user-email').textContent = user.Email || 'admin@gmail.com';
                        document.getElementById('user-phone').textContent = user.Phone || '011 345 6789';
                        document.getElementById('plan-name').textContent = userPlan;
                        
                        populateRoles(user.ACTI_Roles, 'acti-roles');
                        populateRoles(user.ASTI_Roles, 'asti-roles');

                        // 1. Fetch and Parse Pricing from Plan_Price.txt based on userPlan
                        try {
                            const priceRes = await fetch('./membership/Plan_Price.txt');
                            if (priceRes.ok) {
                                const priceText = await priceRes.text();
                                const lines = priceText.split('\n');
                                let matchedPrice = "Price not found";

                                for (let line of lines) {
                                    if (!line.trim()) continue;
                                    
                                    const parts = line.split('|');
                                    if (parts.length === 2) {
                                        const planName = parts[0].trim();
                                        const price = parts[1].trim();
                                        
                                        if (planName === userPlan) {
                                            matchedPrice = price;
                                            break;
                                        }
                                    }
                                }
                                document.getElementById('plan-price').textContent = matchedPrice;
                            } else {
                                document.getElementById('plan-price').textContent = "RM 10 / month"; // Fallback
                            }
                        } catch (error) {
                            console.error("Error loading price text:", error);
                            document.getElementById('plan-price').textContent = "RM 10 / month";
                        }

                        // 2. Fetch Plan Inclusions from the respective .txt file
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
