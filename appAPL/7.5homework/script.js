function showPopup(element) {
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupContent = document.getElementById('popup-content');

    popupTitle.textContent = element.textContent;
    popupContent.innerHTML = element.getAttribute('data-content');

    popup.style.display = 'block';
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)';

    setTimeout(function() {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0)';
    }, 10);
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(20px)';
    setTimeout(() => {
        popup.style.display = 'none';
    }, 500);
}
