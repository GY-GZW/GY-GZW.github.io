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

    // 为用户消息创建一个独立的容器
    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('chat-message', 'user-message');
    userMessageDiv.style.padding = '10px';
    userMessageDiv.style.borderRadius = '5px';
    userMessageDiv.style.marginBottom = '10px';
    userMessageDiv.innerHTML = converter.makeHtml(userMessage);

    chatBody.appendChild(userMessageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    messageInput.value = '';

    try {
        const selectedApi = apiSelector.value;
        // 调用API并获取流式输出
        const aiMessageDivId = await callOpenRouterAPI(userMessage, selectedApi);
        // 确保聊天内容数组中的消息与页面显示一致
        const aiMessageDiv = document.getElementById(aiMessageDivId);
        if (aiMessageDiv) {
            // 使用textContent来获取纯文本内容
            Chatcontent.push({ role: "assistant", content: aiMessageDiv.textContent });
        }
    } catch (error) {
        console.error('API调用错误:', error);
        appendMessage(`请求失败: ${error.message}`, 'ai-message');
    }
}

async function callOpenRouterAPI(userMessage, modelType) {
    abortController = new AbortController();
    let content = ''; // 用于累加流式返回的内容
    let aiMessageDivId = `ai-message-${Date.now()}`; // 为AI消息创建一个唯一的ID

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
                stream: true // 启用流式输出
            }),
            signal: abortController.signal
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API请求失败');
        }

        // 使用ReadableStream读取流式数据
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
                // 去除前缀 "data: "
                const jsonStr = line.replace(/^data: /, '');
                
                if (jsonStr === '[DONE]') {
                    // 流式传输结束
                    return aiMessageDivId;
                }
                
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.choices && data.choices[0] && data.choices[0].delta && data.choices[0].delta.content) {
                        const deltaContent = data.choices[0].delta.content;
                        content += deltaContent;
                        
                        // 创建或获取AI消息的容器
                        let aiMessageDiv = document.getElementById(aiMessageDivId);
                        if (!aiMessageDiv) {
                            aiMessageDiv = document.createElement('div');
                            aiMessageDiv.id = aiMessageDivId;
                            aiMessageDiv.classList.add('chat-message', 'ai-message');
                            aiMessageDiv.style.padding = '10px';
                            aiMessageDiv.style.borderRadius = '5px';
                            aiMessageDiv.style.marginBottom = '10px';
                            chatBody.appendChild(aiMessageDiv);
                        }
                        
                        // 更新AI消息的容器内容
                        aiMessageDiv.innerHTML = converter.makeHtml(content);
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }
                } catch (e) {
                    console.warn('JSON解析错误:', e);
                    console.log('尝试解析的字符串:', jsonStr);
                }
            }
        }
    } catch (error) {
        console.error('API调用错误:', error);
        appendMessage(`请求失败: ${error.message}`, 'ai-message');
    } finally {
        abortController = null;
    }

    return aiMessageDivId;
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