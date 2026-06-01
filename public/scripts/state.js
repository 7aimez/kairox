        // --- State ---
        const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
        const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

        let chats = [];
        let currentChatId = null;
        let attachedFiles = [];
        let renameTargetId = null;
        let pyodideReady = false;
        let pyodideLoading = false;
        let sidebarCollapsed = false;
        let currentUser = null;
        let tempProfilePic = null;
        let currentSettings = {};

        // Default settings
        const defaultSettings = {
            theme: 'system',
            compactSidebar: false,
            showTimestamps: false,
            codeWordWrap: false,
            fontSize: 15,
            autoGenerateTitles: true,
            sendOnEnter: true,
            autoScroll: true,
            model: DEFAULT_MODEL,
            temperature: 0.7,
            maxTokens: 4096
        };
