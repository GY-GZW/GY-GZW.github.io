function showPopup(element) {
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupContent = document.getElementById('popup-content');

    // 设置弹出窗口的标题
    popupTitle.textContent = element.textContent;

    // 设置弹出窗口的内容
    popupContent.innerHTML = element.getAttribute('data-content');

    // 显示弹出窗口，并添加动画效果
    popup.style.display = 'block';
    popup.style.opacity = '0'; // 初始透明度为0
    popup.style.transform = 'translateY(20px)'; // 初始状态，窗口向下移动

    // 使用setTimeout来确保DOM更新后开始动画
    setTimeout(function() {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0)'; // 动画效果，窗口向上移动到原位
    }, 10); // 延迟10毫秒以确保DOM更新
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)'; /* 动画效果，窗口向下移动 */
    setTimeout(() => {
        popup.style.display = 'none';
    }, 500); // 确保在动画完成后再隐藏元素
}
