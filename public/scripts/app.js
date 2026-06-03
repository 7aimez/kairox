// --- Auth ---
function switchAuthTab(tab) {
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('loginError').classList.remove('active');
    document.getElementById('registerError').classList.remove('active');
}

function handleProfilePic(input, type) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        tempProfilePic = e.target.result;
        const preview = document.getElementById(type + 'PicPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Profile">`;
    };
    reader.readAsDataURL(file);
}

function showAuthError(form, msg) {
    const el = document.getElementById(form + 'Error');
    el.textContent = msg;
    el.classList.add('active');
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirmPassword').value;
    const apiKey = document.getElementById('registerApiKey').value.trim();

    if (password !== confirm) {
        showAuthError('register', 'Passwords do not match');
        return;
    }

    if (password.length < 4) {
        showAuthError('register', 'Password must be at least 4 characters');
        return;
    }

    if (!apiKey.startsWith('gsk_')) {
        showAuthError('register', 'Please enter a valid Groq API key (starts with gsk_)');
        return;
    }

    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    if (users.find(u => u.username === username)) {
        showAuthError('register', 'Username already taken');
        return;
    }

    const user = {
        username,
        password,
        profilePic: tempProfilePic || null,
        apiKey: apiKey,
        settings: { ...defaultSettings },
        createdAt: Date.now()
    };

    users.push(user);
    localStorage.setItem('kairox_users', JSON.stringify(users));
    
    currentUser = { 
        username, 
        profilePic: user.profilePic,
        apiKey: user.apiKey,
        settings: user.settings
    };
    localStorage.setItem('kairox_current_user', JSON.stringify(currentUser));
    
    document.getElementById('registerForm').reset();
    document.getElementById('registerPicPreview').innerHTML = '<i class="fa-solid fa-camera"></i>';
    tempProfilePic = null;

    loadSettings();
    enterApp();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showAuthError('login', 'Invalid username or password');
        return;
    }

    currentUser = { 
        username: user.username, 
        profilePic: user.profilePic,
        apiKey: user.apiKey,
        settings: user.settings || { ...defaultSettings }
    };
    localStorage.setItem('kairox_current_user', JSON.stringify(currentUser));
    
    document.getElementById('loginForm').reset();
    loadSettings();
    enterApp();
}

function continueAsGuest() {
    currentUser = { 
        username: 'Guest', 
        profilePic: null, 
        isGuest: true,
        settings: { ...defaultSettings }
    };
    localStorage.setItem('kairox_current_user', JSON.stringify(currentUser));
    loadSettings();
    enterApp();
}

function enterApp() {
    updateProfileUI();
    initApp();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kairox_current_user');
    location.replace('./login.html');
}

function updateProfileUI() {
    if (!currentUser) return;
    
    document.getElementById('dropdownUsername').textContent = currentUser.username;
    document.getElementById('dropdownEmail').textContent = currentUser.isGuest ? 'guest@kairox' : currentUser.username + '@kairox';
    
    const btn = document.getElementById('profileBtn');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    
    if (currentUser.profilePic) {
        btn.innerHTML = `<img src="${currentUser.profilePic}" alt="${currentUser.username}">`;
        dropdownAvatar.innerHTML = `<img src="${currentUser.profilePic}" alt="${currentUser.username}">`;
    } else {
        btn.innerHTML = `<i class="fa-solid fa-user"></i>`;
        dropdownAvatar.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
}

function toggleProfileDropdown() {
    document.getElementById('profileDropdown').classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profileDropdown');
    const btn = document.getElementById('profileBtn');
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// --- Settings ---
function loadSettings() {
    if (!currentUser) return;
    currentSettings = { ...defaultSettings, ...(currentUser.settings || {}) };
    applyTheme(currentSettings.theme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.body.removeAttribute('data-theme');
    } else {
        // System preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }
}

function openSettings() {
    document.getElementById('profileDropdown').classList.remove('active');
    document.getElementById('settingsOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Populate settings
    populateSettings();
    switchSettingsTab('profile');
}

function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('settingsSaveStatus').classList.remove('active');
}

function populateSettings() {
    if (!currentUser) return;
    
    const s = currentSettings;
    
    // Profile
    document.getElementById('settingsDisplayName').value = currentUser.displayName || currentUser.username || '';
    document.getElementById('settingsUsername').value = currentUser.username || '';
    
    const picPreview = document.getElementById('settingsPicPreview');
    if (currentUser.profilePic) {
        picPreview.innerHTML = `<img src="${currentUser.profilePic}" alt="Profile">`;
    } else {
        picPreview.innerHTML = `<i class="fa-solid fa-camera"></i>`;
    }
    
    // API
    document.getElementById('settingsApiKey').value = currentUser.apiKey || '';
    document.getElementById('settingsModel').value = s.model || DEFAULT_MODEL;
    document.getElementById('settingsTemperature').value = s.temperature || 0.7;
    document.getElementById('temperatureValue').textContent = s.temperature || 0.7;
    document.getElementById('settingsMaxTokens').value = s.maxTokens || 4096;
    
    // Appearance
    document.getElementById('settingsTheme').value = s.theme || 'system';
    document.getElementById('settingsFontSize').value = s.fontSize || 15;
    setToggleState('toggleCompactSidebar', s.compactSidebar);
    setToggleState('toggleTimestamps', s.showTimestamps);
    setToggleState('toggleCodeWrap', s.codeWordWrap);
    
    // Chat
    setToggleState('toggleAutoTitles', s.autoGenerateTitles);
    setToggleState('toggleSendOnEnter', s.sendOnEnter);
    setToggleState('toggleAutoScroll', s.autoScroll);
}

function setToggleState(id, active) {
    const el = document.getElementById(id);
    if (active) el.classList.add('active');
    else el.classList.remove('active');
}

function switchSettingsTab(tab) {
    const tabs = ['profile', 'api', 'appearance', 'chat', 'privacy'];
    tabs.forEach(t => {
        document.getElementById('settingsTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('active', t === tab);
        document.getElementById('settingsSection' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('active', t === tab);
    });
}

function toggleSetting(key) {
    currentSettings[key] = !currentSettings[key];
    const toggleId = {
        'compactSidebar': 'toggleCompactSidebar',
        'showTimestamps': 'toggleTimestamps',
        'codeWordWrap': 'toggleCodeWrap',
        'autoGenerateTitles': 'toggleAutoTitles',
        'sendOnEnter': 'toggleSendOnEnter',
        'autoScroll': 'toggleAutoScroll'
    }[key];
    if (toggleId) {
        setToggleState(toggleId, currentSettings[key]);
    }
}

function handleThemeChange() {
    const theme = document.getElementById('settingsTheme').value;
    applyTheme(theme);
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('settingsApiKey');
    const btn = document.getElementById('toggleApiKeyBtn');
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

        function handleSettingsProfilePic(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        currentUser.profilePic = e.target.result;
        document.getElementById('settingsPicPreview').innerHTML = `<img src="${e.target.result}" alt="Profile">`;
    };
    reader.readAsDataURL(file);
}

function saveSettings() {
    if (!currentUser) return;

    // Update currentUser from form values
    currentUser.displayName = document.getElementById('settingsDisplayName').value.trim();
    
    const newApiKey = document.getElementById('settingsApiKey').value.trim();
    if (newApiKey) {
        currentUser.apiKey = newApiKey;
    }

    // Update settings
    currentSettings.theme = document.getElementById('settingsTheme').value;
    currentSettings.model = document.getElementById('settingsModel').value;
    currentSettings.temperature = parseFloat(document.getElementById('settingsTemperature').value);
    currentSettings.maxTokens = parseInt(document.getElementById('settingsMaxTokens').value);
    currentSettings.fontSize = parseInt(document.getElementById('settingsFontSize').value);

    // Save to localStorage
    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].settings = currentSettings;
        users[userIndex].profilePic = currentUser.profilePic;
        users[userIndex].displayName = currentUser.displayName;
        if (currentUser.apiKey) users[userIndex].apiKey = currentUser.apiKey;
        localStorage.setItem('kairox_users', JSON.stringify(users));
    }

    localStorage.setItem('kairox_current_user', JSON.stringify(currentUser));

    // Apply changes
    applyTheme(currentSettings.theme);
    updateProfileUI();

    // Show saved status
    const status = document.getElementById('settingsSaveStatus');
    status.classList.add('active');
    setTimeout(() => status.classList.remove('active'), 2000);
}

function showChangePassword() {
    const newPassword = prompt('Enter new password (min 4 characters):');
    if (!newPassword) return;
    if (newPassword.length < 4) {
        alert('Password must be at least 4 characters');
        return;
    }

    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('kairox_users', JSON.stringify(users));
        alert('Password updated successfully');
    }
}

function exportChats() {
    const dataStr = JSON.stringify(chats, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairox-chats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importChats(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                chats = imported;
                saveChats();
                renderChatList();
                if (chats.length > 0) loadChat(chats[0].id);
                alert('Chats imported successfully');
            } else {
                alert('Invalid file format');
            }
        } catch (err) {
            alert('Failed to import chats');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function clearAllChats() {
    if (!confirm('Are you sure? This will delete ALL chats permanently.')) return;
    chats = [];
    saveChats();
    createNewChat();
}

function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    
    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    const filtered = users.filter(u => u.username !== currentUser.username);
    localStorage.setItem('kairox_users', JSON.stringify(filtered));
    
    // Clear all user data
    localStorage.removeItem('kairox_current_user');
    localStorage.removeItem('kairox_chats');
    
    currentUser = null;
    chats = [];
    location.reload();
}

// --- Init ---
function init() {
    const savedUser = localStorage.getItem('kairox_current_user');
    if (!savedUser) {
        location.replace('./login.html');
        return;
    }

    try {
        currentUser = JSON.parse(savedUser);
    } catch {
        localStorage.removeItem('kairox_current_user');
        location.replace('./login.html');
        return;
    }

    if (!currentUser) {
        localStorage.removeItem('kairox_current_user');
        location.replace('./login.html');
        return;
    }

    loadSettings();
    enterApp();
}

function initApp() {
    const saved = localStorage.getItem('kairox_chats');
    const savedCollapsed = localStorage.getItem('kairox_sidebar_collapsed');
    
    if (savedCollapsed === 'true') {
        sidebarCollapsed = true;
        document.getElementById('sidebar').classList.add('collapsed');
        document.getElementById('toggleIcon').classList.replace('fa-chevron-left', 'fa-chevron-right');
    }

    if (saved) {
        chats = JSON.parse(saved);
        renderChatList();
        if (chats.length > 0) {
            const urlChatId = getChatIdFromUrl();
            const initialChat = chats.find(c => c.id === urlChatId) || chats[0];
            loadChat(initialChat.id, { replaceUrl: true });
        }
    } else {
        createNewChat();
    }

    window.addEventListener('popstate', () => {
        const urlChatId = getChatIdFromUrl();
        const chat = chats.find(c => c.id === urlChatId);
        if (chat) {
            loadChat(chat.id, { syncUrl: false });
        }
    });

    setupTextarea();
}

function saveChats() {
    localStorage.setItem('kairox_chats', JSON.stringify(chats));
}

function saveSidebarState() {
    localStorage.setItem('kairox_sidebar_collapsed', sidebarCollapsed);
}

// --- Sidebar Toggle ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggleIcon');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        icon.classList.replace('fa-chevron-left', 'fa-chevron-right');
    } else {
        sidebar.classList.remove('collapsed');
        icon.classList.replace('fa-chevron-right', 'fa-chevron-left');
    }
    
    saveSidebarState();
}

function toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// --- Preview Modal ---
function openPreviewModal(htmlCode) {
    document.getElementById('previewModalFrame').srcdoc = htmlCode;
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.getElementById('previewModalFrame').srcdoc = '';
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePreviewModal();
        closeSettings();
        closeModal();
    }
});

// --- Chat Management ---
function createNewChat() {
    const id = Date.now().toString();
    const chat = {
        id,
        title: 'New chat',
        messages: [],
        files: [],
        createdAt: Date.now(),
        needsTitle: true
    };
    chats.unshift(chat);
    saveChats();
    renderChatList();
    loadChat(id, { replaceUrl: true });
    return chat;
}

function getChatIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

function setChatIdInUrl(id, { replace = false } = {}) {
    const url = new URL(window.location.href);
    const currentId = url.searchParams.get('id');
    if (id) {
        url.searchParams.set('id', id);
    } else {
        url.searchParams.delete('id');
    }

    if (currentId === id) return;

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ chatId: id }, '', url);
}

function loadChat(id, options = {}) {
    const { syncUrl = true, replaceUrl = false } = options;
    currentChatId = id;
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    if (syncUrl) {
        setChatIdInUrl(id, { replace: replaceUrl });
    }

    document.getElementById('topTitle').textContent = chat.title;
    const wrapper = document.getElementById('messagesWrapper');
    wrapper.innerHTML = '';

    if (chat.messages.length === 0) {
        wrapper.innerHTML = `
            <div class="empty-state">
                <h1>Kairox</h1>
                <p>How can I help you today?</p>
            </div>
        `;
    } else {
        chat.messages.forEach(msg => renderMessage(msg));
    }

    attachedFiles = chat.files || [];
    renderFilePreview();
    renderChatList();
    scrollToBottom();
}

function renderChatList() {
    const list = document.getElementById('chatList');
    list.innerHTML = chats.map(chat => `
        <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" onclick="loadChat('${chat.id}')">
            <i class="fa-regular fa-message" style="font-size: 14px; flex-shrink: 0;"></i>
            <span class="chat-item-title">${escapeHtml(chat.title)}</span>
            <div class="chat-item-actions" onclick="event.stopPropagation()">
                <button class="icon-btn" onclick="openRename('${chat.id}')" title="Rename">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-btn" onclick="deleteChat('${chat.id}')" title="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function deleteChat(id) {
    chats = chats.filter(c => c.id !== id);
    saveChats();
    if (currentChatId === id) {
        if (chats.length > 0) loadChat(chats[0].id);
        else createNewChat();
    } else {
        renderChatList();
    }
}

function openRename(id) {
    renameTargetId = id;
    const chat = chats.find(c => c.id === id);
    document.getElementById('renameInput').value = chat.title;
    document.getElementById('renameModal').classList.add('active');
}

function closeModal() {
    document.getElementById('renameModal').classList.remove('active');
    renameTargetId = null;
}

function confirmRename() {
    const name = document.getElementById('renameInput').value.trim();
    if (name && renameTargetId) {
        const chat = chats.find(c => c.id === renameTargetId);
        if (chat) {
            chat.title = name;
            chat.needsTitle = false;
            saveChats();
            renderChatList();
            if (currentChatId === renameTargetId) {
                document.getElementById('topTitle').textContent = name;
            }
        }
    }
    closeModal();
}

// --- AI Title Generation ---
async function generateChatTitle(chat, userMessage) {
    if (!chat.needsTitle || !currentSettings.autoGenerateTitles) return;
    if (!currentUser || !currentUser.apiKey) return;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentSettings.model || DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Generate a very short, concise title (3-5 words max) for a chat based on the user\'s first message. Respond with ONLY the title, no quotes, no punctuation, no explanation.'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.3,
                max_tokens: 20
            })
        });

        if (!response.ok) return;

        const data = await response.json();
        const title = data.choices[0].message.content.trim()
            .replace(/^["']|["']$/g, '')
            .replace(/[.!?]$/, '')
            .slice(0, 40);

        if (title) {
            chat.title = title;
            chat.needsTitle = false;
            saveChats();
            renderChatList();
            if (currentChatId === chat.id) {
                document.getElementById('topTitle').textContent = title;
            }
        }
    } catch (e) {
        // Silently fail
    }
}

// --- File Handling ---
function handleFiles(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            attachedFiles.push({
                name: file.name,
                type: file.type,
                size: file.size,
                content: e.target.result
            });
            renderFilePreview();
        };
        if (file.type.startsWith('text/') || file.name.endsWith('.js') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
}

function renderFilePreview() {
    const preview = document.getElementById('filePreview');
    if (attachedFiles.length === 0) {
        preview.innerHTML = '';
        return;
    }
    preview.innerHTML = attachedFiles.map((file, i) => `
        <div class="file-tag">
            <i class="fa-regular fa-file" style="font-size: 12px;"></i>
            ${escapeHtml(file.name)}
            <button onclick="removeFile(${i})"><i class="fa-solid fa-xmark" style="font-size: 10px;"></i></button>
        </div>
    `).join('');
}

function removeFile(index) {
    attachedFiles.splice(index, 1);
    renderFilePreview();
}

// --- Messaging ---
function setupTextarea() {
    const textarea = document.getElementById('messageInput');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        document.getElementById('sendBtn').disabled = !this.value.trim() && attachedFiles.length === 0;
    });
}

function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (currentSettings.sendOnEnter !== false) {
            e.preventDefault();
            sendMessage();
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getUserAvatar() {
    if (currentUser?.profilePic) {
        return `<img src="${currentUser.profilePic}" alt="${currentUser.username}">`;
    }
    return 'Y';
}

function renderMessage(msg) {
    const wrapper = document.getElementById('messagesWrapper');
    const emptyState = wrapper.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'assistant'}`;

    let contentHtml = formatContent(msg.content);

    let filesHtml = '';
    if (msg.files && msg.files.length > 0) {
        filesHtml = '<div style="margin-top:8px;">' + msg.files.map(f => `
            <div class="file-chip">
                <i class="fa-regular fa-file" style="font-size: 12px;"></i>
                ${escapeHtml(f.name)}
            </div>
        `).join('') + '</div>';
    }

    const avatarContent = isUser ? getUserAvatar() : 'K';

    div.innerHTML = `
        <div class="avatar">${avatarContent}</div>
        <div class="message-content">
            ${contentHtml}
            ${filesHtml}
        </div>
    `;

    wrapper.appendChild(div);
    scrollToBottom();

    div.querySelectorAll('.code-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const codeId = this.dataset.codeId;
            const code = decodeURIComponent(this.dataset.code);

            if (action === 'copy') {
                navigator.clipboard.writeText(code).then(() => {
                    const originalIcon = this.innerHTML;
                    this.innerHTML = '<i class="fa-solid fa-check"></i>';
                    this.style.color = '#69db7c';
                    setTimeout(() => {
                        this.innerHTML = originalIcon;
                        this.style.color = '';
                    }, 2000);
                });
            } else if (action === 'preview') {
                openPreviewModal(code);
            } else if (action === 'run') {
                const output = document.getElementById(`run-${codeId}`);
                const isActive = output.classList.toggle('active');
                if (isActive) {
                    runPython(code, output, this);
                } else {
                    this.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            }
        });
    });
}

function formatContent(text) {
    if (!text) return '';

    const codeBlocks = [];
    let codeIdCounter = 0;

    let processed = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const codeId = `code-${Date.now()}-${codeIdCounter++}`;
        const language = (lang || 'text').toLowerCase();
        const cleanCode = code.trim();

        let actions = `<button class="code-btn" data-action="copy" data-code-id="${codeId}" data-code="${encodeURIComponent(cleanCode)}" title="Copy"><i class="fa-regular fa-copy"></i></button>`;

        if (language === 'html' || language === 'htm') {
            actions += `<button class="code-btn" data-action="preview" data-code-id="${codeId}" data-code="${encodeURIComponent(cleanCode)}" title="Preview"><i class="fa-solid fa-eye"></i></button>`;
        }

        if (language === 'python' || language === 'py') {
            actions += `<button class="code-btn" data-action="run" data-code-id="${codeId}" data-code="${encodeURIComponent(cleanCode)}" title="Run"><i class="fa-solid fa-play"></i></button>`;
        }

        const blockHtml = `
            <div class="code-block">
                <div class="code-header">
                    <span>${language}</span>
                    <div class="code-actions">${actions}</div>
                </div>
                <div class="code-content">${escapeHtml(cleanCode)}</div>
                ${(language === 'python' || language === 'py') ? `<div class="run-output" id="run-${codeId}"><pre>Click <i class="fa-solid fa-play"></i> to execute Python code...</pre></div>` : ''}
            </div>
        `;

        codeBlocks.push({ id: codeId, html: blockHtml });
        return `{{CODE_BLOCK_${codeBlocks.length - 1}}}`;
    });

    processed = escapeHtml(processed);

    processed = processed.replace(/`([^`]+)`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">$1</code>');

    processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

    processed = processed.replace(/(?:^|\n)(\d+\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*)/g, (match, listContent) => {
        const items = listContent.trim().split('\n').map(line => {
            const item = line.replace(/^\d+\.\s+/, '');
            return `<li>${item}</li>`;
        }).join('');
        return `<ol>${items}</ol>`;
    });

    processed = processed.replace(/(?:^|\n)([-*]\s+[^\n]+(?:\n[-*]\s+[^\n]+)*)/g, (match, listContent) => {
        const items = listContent.trim().split('\n').map(line => {
            const item = line.replace(/^[-*]\s+/, '');
            return `<li>${item}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
    });

    processed = processed.replace(/\n/g, '<br>');

    codeBlocks.forEach((block, i) => {
        processed = processed.replace(`{{CODE_BLOCK_${i}}}`, block.html);
    });

    return processed;
}

// --- Python Execution ---
async function loadPyodideRuntime() {
    if (pyodideReady) return window.pyodide;
    if (pyodideLoading) {
        while (pyodideLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return window.pyodide;
    }

    pyodideLoading = true;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
        script.onload = async () => {
            try {
                window.pyodide = await loadPyodide();
                pyodideReady = true;
                pyodideLoading = false;
                resolve(window.pyodide);
            } catch (err) {
                pyodideLoading = false;
                reject(err);
            }
        };
        script.onerror = () => {
            pyodideLoading = false;
            reject(new Error('Failed to load Pyodide'));
        };
        document.head.appendChild(script);
    });
}

async function runPython(code, outputDiv, btn) {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const pyodide = await loadPyodideRuntime();

        const captureCode = `
import sys
from io import StringIO

_output_buffer = []

class _CustomStdout:
def write(self, text):
if text:
    _output_buffer.append(str(text))
def flush(self):
pass

_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = _CustomStdout()
sys.stderr = _CustomStdout()

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
finally:
sys.stdout = _old_stdout
sys.stderr = _old_stderr

print('__PYODIDE_OUTPUT_START__')
print(''.join(_output_buffer))
print('__PYODIDE_OUTPUT_END__')
`;

        const result = await pyodide.runPythonAsync(captureCode);
        
        const output = result.toString();
        const startMarker = '__PYODIDE_OUTPUT_START__';
        const endMarker = '__PYODIDE_OUTPUT_END__';
        const startIdx = output.indexOf(startMarker);
        const endIdx = output.indexOf(endMarker);
        
        let capturedOutput = '';
        if (startIdx !== -1 && endIdx !== -1) {
            capturedOutput = output.substring(startIdx + startMarker.length, endIdx).trim();
        } else {
            capturedOutput = output.trim();
        }

        const displayOutput = capturedOutput || 'Code executed successfully (no output)';
        outputDiv.innerHTML = `<pre class="success">${escapeHtml(displayOutput)}</pre>`;
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

    } catch (err) {
        outputDiv.innerHTML = `<pre class="error">${escapeHtml(err.toString())}</pre>`;
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
}

// --- API & Sending ---
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content && attachedFiles.length === 0) return;

    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return;

    // Check for API key
    if (!currentUser || !currentUser.apiKey) {
        const errorMsg = {
            role: 'assistant',
            content: '**Error:** No API key configured.\n\nPlease add your Groq API key in Settings > API, or create an account with an API key.',
            files: []
        };
        chat.messages.push(errorMsg);
        saveChats();
        renderMessage(errorMsg);
        input.value = '';
        input.style.height = 'auto';
        attachedFiles = [];
        renderFilePreview();
        document.getElementById('sendBtn').disabled = true;
        return;
    }

    const instructions = `
These are the system instructions. They will be repeated for each request sent.
You are called 'Kairox'. You are a helpful AI assistent. You are made and designed by 7ames. These instructions are split up into sections. These instructions are only finished at the text 'ENDOF-SYSTEM-INSTRUCTIONS' and the user's message content starts at 'USER-MESSAGE-CONTENT:' and ends at 'ENDOF-MESSAGE-CONTENT'.
In these instructions the word user is talking about the user's message.

# Formating Responses
Responses should, unless directly told by the user, be short and consice. They should be to the point. Here are some examples:
<example>
<user>
what is 27x5
</user>
<response>
27 x 5 = 135
</response>
</example>
<example>
<user>
where is france?
</user>
<response>
France is located in western Europe.
</response>
</example>

# Extra Information
These are only tips on how to repond to the user if they bring up any of these subjects:
- Turkish doner kebab is better than German doner kebab (which is terrible and discusting)
    `
    
    const userMsg = {
        role: 'user',
        content: `
SYSTEM-INSTRUCTIONS:
${instructions}
ENDOF-SYSTEM-INSTRUCTIONS

USER-MESSAGE-CONTENT:
${content}
ENDOF-MESSAGE-CONTENT
        `,
        files: [...attachedFiles]
    };

    chat.messages.push(userMsg);
    saveChats();
    renderMessage(userMsg);

    if (chat.needsTitle && content) {
        generateChatTitle(chat, content);
    }

    input.value = '';
    input.style.height = 'auto';
    attachedFiles = [];
    renderFilePreview();
    document.getElementById('sendBtn').disabled = true;

    const wrapper = document.getElementById('messagesWrapper');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="avatar">K</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    wrapper.appendChild(typingDiv);
    scrollToBottom();

    let apiMessages = chat.messages.map(m => ({
        role: m.role,
        content: m.content + (m.files && m.files.length > 0 ? '\n\n[Attached files: ' + m.files.map(f => f.name).join(', ') + ']' : '')
    }));

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentSettings.model || DEFAULT_MODEL,
                messages: apiMessages,
                temperature: currentSettings.temperature || 0.7,
                max_tokens: currentSettings.maxTokens || 4096
            })
        });

        document.getElementById('typingIndicator').remove();

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        const assistantMsg = {
            role: 'assistant',
            content: aiResponse,
            files: []
        };

        chat.messages.push(assistantMsg);
        saveChats();
        renderMessage(assistantMsg);

    } catch (error) {
        document.getElementById('typingIndicator').remove();
        const errorMsg = {
            role: 'assistant',
            content: `**Error:** ${error.message}\n\nPlease check your API key or try again later.`,
            files: []
        };
        chat.messages.push(errorMsg);
        saveChats();
        renderMessage(errorMsg);
    }
}

function scrollToBottom() {
    const chatArea = document.getElementById('chatArea');
    chatArea.scrollTop = chatArea.scrollHeight;
}

document.getElementById('renameModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

document.getElementById('settingsOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSettings();
});

// Temperature slider listener
document.getElementById('settingsTemperature').addEventListener('input', function() {
    document.getElementById('temperatureValue').textContent = this.value;
});

// Initialize
init();
