// Cloudflare Worker for the Veilkeeper feedback form.
//
// Only POST /api/feedback is handled here (see `run_worker_first` in
// wrangler.jsonc); every other request is served from static assets. The
// handler validates a Turnstile token server-side, allowlists the submitted
// fields against the shared schema, and emails a plain-text notification to
// support@veilkeepergame.com via Cloudflare Email Sending.

import {
    CATEGORY_VALUES,
    EMAIL_MAX,
    HONEYPOT_FIELD,
    MAX_BODY_BYTES,
    MAX_TOTAL_CHARS,
    getCategory,
} from '../src/lib/feedback';

interface EmailSendMessage {
    to: string;
    from: { email: string; name: string };
    subject: string;
    text: string;
    replyTo?: string;
}

interface Env {
    ASSETS: Fetcher;
    EMAIL: { send(message: EmailSendMessage): Promise<{ messageId?: string }> };
    TURNSTILE_SECRET: string;
    ALLOWED_HOSTNAMES: string;
    ALLOWED_ORIGINS: string;
    // Expected Turnstile action, enforced when non-empty (production = "feedback").
    // Left empty in local dev because dummy test tokens carry no action.
    TURNSTILE_ACTION: string;
}

const FROM = { email: 'feedback@veilkeepergame.com', name: 'Veilkeeper Feedback' };
const TO = 'support@veilkeepergame.com';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// C0 control characters (U+0000–U+001F) plus DEL (U+007F). Built via RegExp()
// so no literal control bytes ever appear in this source file.
const CONTROL_RE = new RegExp('[\\u0000-\\u001F\\u007F]', 'g');

const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json' },
    });

const toSet = (csv: string) =>
    new Set(
        csv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    );

/** Strip line breaks and control chars so a field value can't inject headers. */
const sanitizeLine = (value: string) =>
    value.replace(/[\r\n\t]+/g, ' ').replace(CONTROL_RE, '').trim();

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/api/feedback' && request.method === 'POST') {
            return handleFeedback(request, env);
        }
        if (url.pathname.startsWith('/api/')) {
            return json({ error: 'Not found' }, 404);
        }
        return env.ASSETS.fetch(request);
    },
} satisfies ExportedHandler<Env>;

async function handleFeedback(request: Request, env: Env): Promise<Response> {
    // Same-origin only: exact-match the Origin header against the allowlist.
    const origin = request.headers.get('Origin');
    const allowedOrigins = toSet(env.ALLOWED_ORIGINS);
    if (!origin || !allowedOrigins.has(origin)) {
        return json({ error: 'Forbidden' }, 403);
    }

    // Reject oversized bodies before parsing.
    const contentLength = Number(request.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BODY_BYTES) {
        return json({ error: 'Payload too large' }, 413);
    }

    let form: FormData;
    try {
        form = await request.formData();
    } catch {
        return json({ error: 'Invalid form data' }, 400);
    }

    const getField = (name: string) => (form.get(name) ?? '').toString();

    // Honeypot: silently accept and drop bot submissions.
    if (getField(HONEYPOT_FIELD).trim() !== '') {
        return json({ ok: true });
    }

    // Verify Turnstile server-side.
    const token = getField('cf-turnstile-response');
    const turnstileOk = await verifyTurnstile(token, request, env);
    if (!turnstileOk) {
        return json({ error: 'Verification failed. Please try again.' }, 400);
    }

    // Category must be one of the known values.
    const category = getCategory(getField('category'));
    if (!category || !CATEGORY_VALUES.includes(category.value)) {
        return json({ error: 'Invalid submission.' }, 400);
    }

    // Allowlist + validate fields for the chosen category.
    const collected: { label: string; value: string }[] = [];
    let totalChars = 0;
    for (const field of category.fields) {
        const raw = getField(field.name).trim();
        if (!raw) {
            if (field.required) {
                return json({ error: 'Please fill in the required fields.' }, 400);
            }
            continue;
        }
        if (raw.length > field.maxLength) {
            return json({ error: 'One of your answers is too long.' }, 400);
        }
        totalChars += raw.length;
        if (totalChars > MAX_TOTAL_CHARS) {
            return json({ error: 'Submission is too long.' }, 400);
        }
        collected.push({ label: field.label, value: raw });
    }
    if (collected.length === 0) {
        return json({ error: 'Please fill in the form.' }, 400);
    }

    // Optional contact email → Reply-To (only if it looks valid).
    const emailRaw = getField('email').trim();
    const replyTo =
        emailRaw && emailRaw.length <= EMAIL_MAX && EMAIL_RE.test(emailRaw) ? emailRaw : undefined;

    const summarySource =
        getField(category.summaryField).trim() || collected[0].value;
    const summary = sanitizeLine(summarySource).slice(0, 80) || category.label;
    const subject = sanitizeLine(`[Veilkeeper] ${category.label} — ${summary}`).slice(0, 200);

    const bodyLines = [
        `Category: ${category.label}`,
        `Contact: ${replyTo ?? '(none provided)'}`,
        `Received: ${new Date().toISOString()}`,
        '',
        '----------------------------------------',
        '',
    ];
    for (const { label, value } of collected) {
        bodyLines.push(`${label}:`, value, '');
    }
    const text = bodyLines.join('\n');

    try {
        await env.EMAIL.send({ to: TO, from: FROM, subject, text, replyTo });
    } catch (err) {
        console.error('feedback email send failed', err);
        return json({ error: 'Could not deliver your feedback right now.' }, 502);
    }

    // Ordinary browser form posts (no JS) get an HTML thank-you page;
    // fetch() callers get JSON.
    const accept = request.headers.get('Accept') ?? '';
    if (accept.includes('text/html')) {
        return new Response(thankYouHtml(), {
            headers: { 'content-type': 'text/html; charset=utf-8' },
        });
    }
    return json({ ok: true });
}

async function verifyTurnstile(token: string, request: Request, env: Env): Promise<boolean> {
    if (!token) return false;
    const body = new FormData();
    body.append('secret', env.TURNSTILE_SECRET);
    body.append('response', token);
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.append('remoteip', ip);

    try {
        const res = await fetch(SITEVERIFY, { method: 'POST', body });
        const data = (await res.json()) as {
            success?: boolean;
            hostname?: string;
            action?: string;
        };
        const allowedHostnames = toSet(env.ALLOWED_HOSTNAMES);
        const expectedAction = (env.TURNSTILE_ACTION ?? '').trim();
        const actionOk = expectedAction === '' || data.action === expectedAction;
        return (
            data.success === true &&
            actionOk &&
            typeof data.hostname === 'string' &&
            allowedHostnames.has(data.hostname)
        );
    } catch (err) {
        console.error('turnstile verify failed', err);
        return false;
    }
}

function thankYouHtml(): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thanks | Veilkeeper</title>
<style>body{font-family:system-ui,sans-serif;background:#090612;color:#f7f2ff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:1.5rem}a{color:#c58cff}</style>
</head><body><main><h1>Thank you</h1>
<p>Your feedback reached the team.</p>
<p><a href="/feedback">Send another</a> &middot; <a href="/">Back to Veilkeeper</a></p>
</main></body></html>`;
}
