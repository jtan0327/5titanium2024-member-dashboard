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
        // Split the emails by comma, trim whitespace, and join them with a line break or comma-space
        // Using comma + space to keep it clean, but you could use '<br>' if you want them on new lines
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
        try {
            const sheetId = '11fZl1_k9Txz6zXZqZnZuKcH5PtF6QQuY';
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            
            Papa.parse(csvUrl, {
                download: true,
                header: false,
                complete: async function(results) {
                    const data = results.data;
                    
                    const headerRowIndex = data.findIndex(row => row[0] === 'Name' && row[1] === 'email');
                    
                    if (headerRowIndex !== -1 && data.length >
