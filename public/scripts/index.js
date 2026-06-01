(function () {
    const list = document.getElementById('recentChats');
    const newChatLink = document.getElementById('newChatLink');

    const chats = JSON.parse(localStorage.getItem('kairox_chats') || '[]');

    if (!Array.isArray(chats) || chats.length === 0) {
        list.innerHTML = '<p style="margin:0;color:#9aa0a6;">No chats yet.</p>';
        newChatLink.href = './chat.html';
        return;
    }

    const sorted = [...chats].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    list.innerHTML = sorted.slice(0, 12).map((chat) => {
        const title = (chat.title || 'New chat').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
        const date = chat.createdAt ? new Date(chat.createdAt).toLocaleString() : '';
        return `<a class="chat-link" href="./chat.html?id=${encodeURIComponent(chat.id)}"><span>${title}</span><span>${date}</span></a>`;
    }).join('');

    newChatLink.href = './chat.html';
})();
