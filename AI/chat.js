let abortController = null;

document.getElementById('send-button').addEventListener('click', function() {
    const inputBox = document.getElementById('input-box');
    const chatLog = document.getElementById('chat-log');

    if (inputBox.value.trim() === '') return;

    // 显示用户输入的问题
    chatLog.innerHTML += `<p style="animation-delay: 0.1s;"><strong>我:</strong> ${inputBox.value}</p>`;

    // 生成随机的userid
    const userid = generateRandomNumber();
    const modelId = userid.toString().substring(0, 5).replace(/\./g, ''); // 获取前五位并去掉小数点

    // 果园AI提示信息
    chatLog.innerHTML += `<p style="animation-delay: 0.3s;"><strong>果园AI提示:</strong> 果园AI已经理解您的问题，并将使用模型${modelId}来解答。</p>`;

    // 构造请求URL
    const requestUrl = `https://api.sizhi.com/chat?spoken=${encodeURIComponent(inputBox.value)}&stream=false&userid=${userid}`;

    // 设置超时时间
    const timeoutId = setTimeout(() => {
        chatLog.innerHTML += '<p style="animation-delay: 0.5s;"><strong>果园AI提示:</strong> AI正在生成长文本，等待时间较长，望各位仁兄稍等下……</p>';
    }, 3000); // 假设超时时间为3秒

    // 创建AbortController实例
    abortController = new AbortController();
    const signal = abortController.signal;

    // 发送请求到API
    fetch(requestUrl, { signal })
        .then(response => response.json())
        .then(data => {
            clearTimeout(timeoutId); // 取消超时计时器

            if (data.status === 0 && data.data.type === 'text') {
                // 显示AI的回答
                const markdownText = data.data.info.text;
                const htmlText = marked.parse(markdownText);
                chatLog.innerHTML += `<p style="animation-delay: 0.7s;"><strong>果园AI4.0：</strong>${htmlText}</p>`;

                // 检查用户是否已经开始手动滚动
                if (!chatLog.classList.contains('user-scrolling')) {
                    scrollToBottom(chatLog);
                }
            } else {
                chatLog.innerHTML += '<p style="animation-delay: 0.7s;"><strong>错误:</strong> 请求失败，请稍后再试，不行找2373460868</p>';
            }
        })
        .catch(error => {
            clearTimeout(timeoutId); // 取消超时计时器
            if (signal.aborted) {
                chatLog.innerHTML += '<p style="animation-delay: 0.7s;"><strong>果园AI提示:</strong> AI已停止请求。</p>';
            } else {
                chatLog.innerHTML += '<p style="animation-delay: 0.7s;"><strong>错误:</strong> 请求失败，请检查网络连接，不行找2373460868</p>';
            }
        });

    inputBox.value = ''; // 清空输入框
});

document.getElementById('clear-button').addEventListener('click', function() {
    const chatLog = document.getElementById('chat-log');
    chatLog.innerHTML = ''; // 清空聊天记录
});

document.getElementById('cancel-button').addEventListener('click', function() {
    if (abortController) {
        abortController.abort(); // 中断请求
        abortController = null;
    }
});

function generateRandomNumber() {
    return Math.floor(Math.random()* 1000000000); // 生成一个随机数
}