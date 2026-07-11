import rss from '@astrojs/rss';
import { getSortedDevlogs, getPostUrl } from '../lib/devlog';

export async function GET(context) {
    const devlogs = await getSortedDevlogs();

    return rss({
        title: 'Veilkeeper Development Log',
        description: 'Follow the progress of Veilkeeper as core systems come online.',
        site: context.site,
        items: devlogs.map(entry => ({
            title: `${entry.data.label} — ${entry.data.title}`,
            pubDate: entry.data.date,
            description: entry.data.summary,
            link: getPostUrl(entry)
        }))
    });
}
