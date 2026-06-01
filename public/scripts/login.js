const defaultSettings = {
    theme: 'system',
    compactSidebar: false,
    showTimestamps: false,
    codeWordWrap: false,
    fontSize: 15,
    autoGenerateTitles: true,
    sendOnEnter: true,
    autoScroll: true,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 4096
};
const GROQ_API_KEY_PREFIX = 'gsk_';

let tempProfilePic = null;

function bytesToHex(bytes) {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    return bytesToHex(salt);
}

async function hashPassword(password, saltHex) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const saltBytes = Uint8Array.from(saltHex.match(/.{2}/g).map((byte) => parseInt(byte, 16)));
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
        key,
        256
    );
    return bytesToHex(new Uint8Array(bits));
}

async function migrateLegacyPasswords() {
    try {
        const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
        let hasChanges = false;

        for (const user of users) {
            if (typeof user.password === 'string' && user.password.length > 0) {
                if (!user.passwordHash || !user.passwordSalt) {
                    user.passwordSalt = generateSalt();
                    user.passwordHash = await hashPassword(user.password, user.passwordSalt);
                }
                delete user.password;
                hasChanges = true;
            }
        }

        if (hasChanges) {
            localStorage.setItem('kairox_users', JSON.stringify(users));
        }
    } catch (error) {
        console.error('Failed to migrate legacy passwords', error);
    }
}

function switchAuthTab(tab) {
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('registerTab').classList.toggle('active', tab === 'register');
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    document.getElementById('loginError').classList.remove('active');
    document.getElementById('registerError').classList.remove('active');
}

function showAuthError(form, msg) {
    const el = document.getElementById(form + 'Error');
    el.textContent = msg;
    el.classList.add('active');
}

function handleProfilePic(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        tempProfilePic = e.target.result;
        const preview = document.getElementById('registerPicPreview');
        preview.innerHTML = '';
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = 'Profile';
        preview.appendChild(img);
    };
    reader.readAsDataURL(file);
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const normalizedUsername = username.toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirmPassword').value;
    const apiKey = document.getElementById('registerApiKey').value.trim();

    if (password !== confirm) {
        showAuthError('register', 'Passwords do not match');
        return;
    }

    if (password.length < 8) {
        showAuthError('register', 'Password must be at least 8 characters');
        return;
    }

    if (!apiKey.startsWith(GROQ_API_KEY_PREFIX)) {
        showAuthError('register', `Please enter a valid Groq API key (starts with ${GROQ_API_KEY_PREFIX})`);
        return;
    }

    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    if (users.find((u) => u.username.toLowerCase() === normalizedUsername)) {
        showAuthError('register', 'Username already taken');
        return;
    }

    const passwordSalt = generateSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const user = {
        username,
        passwordHash,
        passwordSalt,
        profilePic: tempProfilePic || null,
        apiKey,
        settings: { ...defaultSettings },
        createdAt: Date.now()
    };

    users.push(user);
    localStorage.setItem('kairox_users', JSON.stringify(users));
    localStorage.setItem('kairox_current_user', JSON.stringify({
        username: user.username,
        profilePic: user.profilePic,
        apiKey: user.apiKey,
        settings: user.settings
    }));
    location.replace('./chat.html');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('kairox_users') || '[]');
    const normalizedUsername = username.toLowerCase();
    const user = users.find((u) => u.username.toLowerCase() === normalizedUsername);
    if (!user || !user.passwordSalt || !user.passwordHash) {
        showAuthError('login', 'Invalid username or password');
        return;
    }

    const passwordHash = await hashPassword(password, user.passwordSalt);
    if (user.passwordHash !== passwordHash) {
        showAuthError('login', 'Invalid username or password');
        return;
    }

    localStorage.setItem('kairox_current_user', JSON.stringify({
        username: user.username,
        profilePic: user.profilePic,
        apiKey: user.apiKey,
        settings: user.settings || { ...defaultSettings }
    }));
    location.replace('./chat.html');
}

function continueAsGuest() {
    localStorage.setItem('kairox_current_user', JSON.stringify({
        username: 'Guest',
        profilePic: null,
        isGuest: true,
        settings: { ...defaultSettings }
    }));
    location.replace('./chat.html');
}

(async function initLogin() {
    const savedUser = localStorage.getItem('kairox_current_user');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && typeof parsedUser === 'object' && parsedUser.username) {
                location.replace('./chat.html');
                return;
            }
            localStorage.removeItem('kairox_current_user');
        } catch {
            localStorage.removeItem('kairox_current_user');
        }
    }

    await migrateLegacyPasswords();
})();
