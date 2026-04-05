async function fetchDevlogs() {
    const response = await fetch('/devlog/devlogs.json', {
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to load devlogs: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error('Devlog data is not an array.');
    }

    return data;
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long'
    }).format(date);
}

function createElement(tag, className, textContent) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

function createLatestDevlogCard(entry) {
    const article = createElement('article', 'status-update surface');

    const image = document.createElement('img');
    image.className = 'status-update-image';
    image.loading = 'lazy';
    image.alt = entry.alt || '';
    image.src = entry.image || '/assets/update.png';

    const body = createElement('div', 'status-update-body');

    const kicker = createElement('p', 'status-update-kicker', 'Latest update');

    const title = createElement(
        'p',
        'status-update-caption'
    );

    const strong = document.createElement('strong');
    strong.textContent = `${entry.label} — ${entry.title}`;

    const summary = document.createTextNode(` ${entry.summary}`);

    title.appendChild(strong);
    title.appendChild(document.createElement('br'));
    title.appendChild(summary);

    const link = document.createElement('a');
    link.href = '/devlog/';
    link.className = 'link-row status-update-link';

    const linkTextWrapper = document.createElement('div');

    const linkStrong = document.createElement('strong');
    linkStrong.textContent = 'View all updates';

    const linkSpan = document.createElement('span');
    linkSpan.textContent = 'Browse the development log';

    linkTextWrapper.appendChild(linkStrong);
    linkTextWrapper.appendChild(linkSpan);

    const arrow = document.createElement('span');
    arrow.textContent = '↗';

    link.appendChild(linkTextWrapper);
    link.appendChild(arrow);

    body.appendChild(kicker);
    body.appendChild(title);
    body.appendChild(link);

    article.appendChild(image);
    article.appendChild(body);

    return article;
}

function createArchiveCard(entry) {
    const article = createElement('article', 'devlog-entry surface');

    const meta = createElement(
        'div',
        'devlog-meta',
        `${entry.label} — ${formatDate(entry.date)}`
    );

    const title = createElement('h3', '', entry.title);

    article.appendChild(meta);
    article.appendChild(title);

    if (entry.image) {
        const image = document.createElement('img');
        image.src = entry.image;
        image.alt = entry.alt || '';
        image.loading = 'lazy';
        article.appendChild(image);
    }

    const summary = createElement('p', '', entry.summary);
    article.appendChild(summary);

    if (entry.postUrl) {
        const readMore = document.createElement('a');
        readMore.href = entry.postUrl;
        readMore.className = 'devlog-read-more';
        readMore.textContent = 'Read full update →';
        article.appendChild(readMore);
    }

    return article;
}

async function renderLatestDevlog() {
    const container = document.getElementById('latest-devlog');

    if (!container) {
        return;
    }

    try {
        const devlogs = await fetchDevlogs();
        container.innerHTML = '';

        if (devlogs.length === 0) {
            container.textContent = 'No updates yet.';
            return;
        }

        container.appendChild(createLatestDevlogCard(devlogs[0]));
    } catch (error) {
        console.error(error);
        container.textContent = 'Unable to load the latest update right now.';
    }
}

async function renderDevlogArchive() {
    const container = document.getElementById('devlog-archive');

    if (!container) {
        return;
    }

    try {
        const devlogs = await fetchDevlogs();
        container.innerHTML = '';

        if (devlogs.length === 0) {
            container.textContent = 'No devlogs yet.';
            return;
        }

        for (const entry of devlogs) {
            container.appendChild(createArchiveCard(entry));
        }
    } catch (error) {
        console.error(error);
        container.textContent = 'Unable to load the development log right now.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderLatestDevlog();
    renderDevlogArchive();
});