async function fetchDevlogs() {
    const response = await fetch('/devlog/devlogs.json', {
        headers: {
            Accept: 'application/json'
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

    if (typeof textContent === 'string') {
        element.textContent = textContent;
    }

    return element;
}

function getPostUrl(entry) {
    return `/devlog/post.html?slug=${entry.slug}`;
}

function getSlugFromLocation() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
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

    const title = createElement('p', 'status-update-caption');
    const strong = document.createElement('strong');
    strong.textContent = `${entry.label} — ${entry.title}`;

    title.appendChild(strong);
    title.appendChild(document.createElement('br'));
    title.appendChild(document.createTextNode(entry.summary));

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

    if (entry.hasFullPost === true) {
        const readMore = document.createElement('a');
        readMore.href = getPostUrl(entry);
        readMore.className = 'devlog-read-more';
        readMore.textContent = 'Read full update →';
        article.appendChild(readMore);
    }

    return article;
}

function renderContentSection(container, section) {
    if (section.type === 'paragraph') {
        const paragraph = document.createElement('p');
        paragraph.textContent = section.text || '';
        container.appendChild(paragraph);
        return;
    }

    if (section.type === 'heading') {
        const heading = document.createElement('h2');
        heading.textContent = section.text || '';
        container.appendChild(heading);
        return;
    }

    if (section.type === 'list' && Array.isArray(section.items)) {
        const list = document.createElement('ul');

        for (const itemText of section.items) {
            const item = document.createElement('li');
            item.textContent = itemText;
            list.appendChild(item);
        }

        container.appendChild(list);
    }
}

function createPostNavigation(devlogs, currentEntry) {
    const fullPosts = devlogs.filter(devlog => devlog.hasFullPost === true);
    const currentIndex = fullPosts.findIndex(devlog => devlog.slug === currentEntry.slug);

    if (currentIndex === -1) {
        return null;
    }

    const nav = createElement('div', 'devlog-post-nav');

    const olderEntry = currentIndex < fullPosts.length - 1 ? fullPosts[currentIndex + 1] : null;
    const newerEntry = currentIndex > 0 ? fullPosts[currentIndex - 1] : null;

    if (olderEntry) {
        const previousLink = document.createElement('a');
        previousLink.href = getPostUrl(olderEntry);
        previousLink.className = 'devlog-read-more';
        previousLink.textContent = '← Previous devlog';
        nav.appendChild(previousLink);
    } else {
        nav.appendChild(createElement('span', 'devlog-nav-spacer', ''));
    }

    const archiveLink = document.createElement('a');
    archiveLink.href = '/devlog/';
    archiveLink.className = 'devlog-read-more';
    archiveLink.textContent = 'All devlogs';
    nav.appendChild(archiveLink);

    if (newerEntry) {
        const nextLink = document.createElement('a');
        nextLink.href = getPostUrl(newerEntry);
        nextLink.className = 'devlog-read-more';
        nextLink.textContent = 'Next devlog →';
        nav.appendChild(nextLink);
    } else {
        nav.appendChild(createElement('span', 'devlog-nav-spacer', ''));
    }

    return nav;
}

function renderDevlogPost(entry, devlogs) {
    const container = document.getElementById('devlog-post');

    if (!container) {
        return;
    }

    container.innerHTML = '';

    const article = createElement('article', 'devlog-post surface');

    const header = createElement('header', 'devlog-post-header');

    const meta = createElement(
        'div',
        'devlog-meta',
        `${entry.label} — ${formatDate(entry.date)}`
    );

    const title = createElement('h1', 'devlog-post-title', entry.title);

    header.appendChild(meta);
    header.appendChild(title);
    article.appendChild(header);

    if (entry.image) {
        const figure = createElement('figure', 'devlog-post-media');

        const image = document.createElement('img');
        image.src = entry.image;
        image.alt = entry.alt || '';
        image.loading = 'lazy';

        figure.appendChild(image);
        article.appendChild(figure);
    }

    const content = createElement('div', 'devlog-post-content');

    if (Array.isArray(entry.sections)) {
        for (const section of entry.sections) {
            renderContentSection(content, section);
        }
    }

    article.appendChild(content);

    const nav = createPostNavigation(devlogs, entry);

    if (nav) {
        article.appendChild(nav);
    }

    container.appendChild(article);

    document.title = `${entry.label} — ${entry.title} | Veilkeeper`;
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

async function renderSingleDevlogPost() {
    const container = document.getElementById('devlog-post');

    if (!container) {
        return;
    }

    const slug = getSlugFromLocation();

    if (!slug) {
        container.textContent = 'No devlog specified.';
        return;
    }

    try {
        const devlogs = await fetchDevlogs();
        const entry = devlogs.find(devlog => devlog.slug === slug);

        if (!entry || entry.hasFullPost !== true) {
            container.textContent = 'Devlog not found.';
            return;
        }

        renderDevlogPost(entry, devlogs);
    } catch (error) {
        console.error(error);
        container.textContent = 'Unable to load this devlog right now.';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderLatestDevlog();
    renderDevlogArchive();
    renderSingleDevlogPost();
});