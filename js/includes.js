async function loadPartial(targetId, path) {
    const target = document.getElementById(targetId);

    if (!target) {
        return;
    }

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Failed to load partial: ${path}`);
    }

    target.innerHTML = await response.text();
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadPartial('site-header', '/partials/header.html');
        await loadPartial('site-footer', '/partials/footer.html');

        if (typeof window.initMenu === 'function') {
            window.initMenu();
        }
    } catch (error) {
        console.error(error);
    }
});