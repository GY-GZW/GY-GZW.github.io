const chatBody = document.querySelector('.chat-body');
const messageInput = document.getElementById('messageInput');
const apiSelector = document.getElementById('apiSelector');
const sendMessageButton = document.getElementById('sendMessage');
const clearChatButton = document.getElementById('clearChat');
const stopGeneratingButton = document.getElementById('stopGenerating');
let Chatcontent=[{ role: "system", content: "你是 GYAI，由 果园工作室（也可称为果园编程） 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及黄色，违法违禁，恐怖主义，种族歧视问题的回答。（可以骂人）GYAI 为专有名词，不可翻译成其他语言。" }];
const API_CONFIG = {
    qwen3: {
        key: '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',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'qwen/qwen3-235b-a22b:free'
    },
    deepseek: {
        key: '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',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'deepseek/deepseek-r1-distill-qwen-32b:free'
    },
    gemini: {
        key: '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',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemma-3-27b-it:free'
    },
    kimi: {
        key: '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',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'moonshotai/moonlight-16b-a3b-instruct:free'
    }
};

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function(match) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    });
  }          

sendMessageButton.addEventListener('click', () => {
    sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

clearChatButton.addEventListener('click', () => {
    const messages = chatBody.querySelectorAll('.chat-message');
    messages.forEach(message => message.remove());
    Chatcontent=[{ role: "system", content: "你是 GYAI，由 果园工作室（也可称为果园编程） 提供的人工智能助手，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。同时，你会拒绝一切涉及黄色，违法违禁，恐怖主义，种族歧视问题的回答。（可以骂人）GYAI 为专有名词，不可翻译成其他语言。" }];
});

stopGeneratingButton.addEventListener('click', () => {
    if (abortController) {
        abortController.abort();
        appendMessage('用户停止了生成', 'ai-message');
        abortController = null;
    }
});

const converter = new showdown.Converter();
let abortController = null;

async function sendMessage() {
    const userMessage = escapeHtml(messageInput.value.trim());
    if (!userMessage) return;

    appendMessage(converter.makeHtml(userMessage), 'user-message');
    messageInput.value = '';
    
    try {
        const selectedApi = apiSelector.value;
        const response = await callOpenRouterAPI(userMessage, selectedApi);
        Chatcontent.push({ role: "assistant", content: response });
        appendMessage(converter.makeHtml(response), 'ai-message');
    } catch (error) {
        console.error('API调用错误:', error);
        appendMessage(`请求失败: ${error.message}`, 'ai-message');
    }
}

async function callOpenRouterAPI(userMessage, modelType) {
    abortController = new AbortController();
    
    try {
        const config = API_CONFIG[modelType];
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${config.key}`);
        headers.append('Content-Type', 'application/json');
        headers.append('HTTP-Referer', encodeURIComponent(window.location.href));
        headers.append('X-Title', encodeURIComponent('果园AI测试'));
        Chatcontent.push({ role: "user", content: userMessage });
        const response = await fetch(config.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: config.model,
                messages: Chatcontent,
                temperature: 0.8,
            }),
            signal: abortController.signal
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API请求失败');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } finally {
        abortController = null;
    }
}

function appendMessage(text, messageType) {
    const message = document.createElement('div');
    message.classList.add('chat-message', messageType);
    message.style.padding = '10px';
    message.style.borderRadius = '5px';
    message.style.marginBottom = '10px';
    message.innerHTML = text;

    chatBody.appendChild(message);
    chatBody.scrollTop = chatBody.scrollHeight;
}