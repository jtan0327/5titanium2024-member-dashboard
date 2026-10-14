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
    
    // If user clicks "Member Status" from profile, switch tab automatically
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
            // A. Fetch Pricing from the repo folder
            // Since this runs on GitHub pages, a relative path works.
            const priceRes = await fetch('./membership/Plan_Price.txt');
            if (priceRes.ok) {
                const priceText = await priceRes.text();
                document.getElementById('plan-price').textContent = priceText.trim();
            } else {
                document.getElementById('plan-price').textContent = "RM10/month"; // Fallback
            }

            // B. Fetch Data from Google Sheets
            // To bypass CORS and auth, we export the sheet as CSV and use PapaParse.
            const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            Papa.parse(csvUrl, {
                download: true,
                header: true, // Uses first row of sheet as keys
                complete: function(results) {
                    const data = results.data;
                    
                    // Assuming we are fetching the first row for the logged-in user
                    if (data.length > 0) {
                        const user = data[0]; 
                        
                        // Map spreadsheet columns to UI elements (Ensure column names match your sheet)
                        document.getElementById('user-name').textContent = user.Name || 'Admin User';
                        document.getElementById('user-email').textContent = user.Email || 'admin@gmail.com';
                        document.getElementById('user-phone').textContent = user.Phone || '011 345 6789';
                        document.getElementById('plan-name').textContent = user.Plan || 'Premium (Legacy)';
                        
                        populateRoles(user.ACTI_Roles, 'acti-roles');
                        populateRoles(user.ASTI_Roles, 'asti-roles');
                    }
                }
            });

            // Mock Data for Plan Inclusions based on the PDF
            const mockPlanData = 
`Full set (no limit)
Documents
-staple
-arranged
-punched hole when needed
Fullscapes paper (no limit)
A4 paper blank (75/80 gsm)
Exam privilege (Ruler/protractor/eraser)
Assignment binding tape & staple
Emergency case (Print / fill document, etc)`;
            
            parsePlanFeatures(mockPlanData);

        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    loadDashboardData();
});
