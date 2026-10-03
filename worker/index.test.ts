// Request-validation and delivery-failure tests for the feedback Worker.
//
// Runs on Node's built-in runner (`just test-worker`): Node 22 strips the types
// itself, and Request/Response/FormData are the same web APIs workerd provides.
// Turnstile and Resend are stubbed by replacing global fetch, so nothing here
// touches the network or sends mail.

import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import worker from './index.ts';
import { MAX_BODY_BYTES } from '../src/lib/feedback.ts';

const ORIGIN = 'https://veilkeepergame.com';

const env = {
    ASSETS: { fetch: async () => new Response('asset') },
    TURNSTILE_SECRET: 'test-secret',
    RESEND_API_KEY: 'test-key',
    ALLOWED_HOSTNAMES: 'veilkeepergame.com',
    ALLOWED_ORIGINS: ORIGIN,
    TURNSTILE_ACTION: 'feedback',
    RESEND_FROM_ADDRESS: 'Veilkeeper Feedback <noreply@feedback.veilkeepergame.com>',
    FEEDBACK_DESTINATION: 'support@veilkeepergame.com',
    FEEDBACK_TIMEZONE: 'UTC',
} as never;

// Stubbed upstream behaviour, reset before each test.
let turnstile: { success: boolean; hostname?: string; action?: string };
let resendStatus: number;
let resendCalls: { body: Record<string, unknown> }[];

const realFetch = globalThis.fetch;

beforeEach(() => {
    turnstile = { success: true, hostname: 'veilkeepergame.com', action: 'feedback' };
    resendStatus = 200;
    resendCalls = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes('challenges.cloudflare.com')) {
            return Response.json(turnstile);
        }
        if (url.includes('api.resend.com')) {
            resendCalls.push({ body: JSON.parse(String(init?.body)) });
            return new Response(resendStatus < 300 ? '{}' : 'upstream error', { status: resendStatus });
        }
        throw new Error(`unexpected fetch: ${url}`);
    }) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

function validForm(overrides: Record<string, string> = {}): FormData {
    const form = new FormData();
    const fields: Record<string, string> = {
        category: 'bug',
        'cf-turnstile-response': 'token',
        bug_build: '0.1.0.1',
        bug_os: 'Linux',
        bug_what: 'The relay screen froze.',
        ...overrides,
    };
    for (const [name, value] of Object.entries(fields)) form.append(name, value);
    return form;
}

function post(body: BodyInit, headers: Record<string, string> = {}): Request {
    return new Request('https://veilkeepergame.com/api/feedback', {
        method: 'POST',
        headers: { Origin: ORIGIN, ...headers },
        body,
        // Required by Node for streaming request bodies.
        duplex: 'half',
    } as RequestInit);
}

const call = (request: Request) => worker.fetch(request as never, env);

async function errorOf(res: Response): Promise<string> {
    return ((await res.json()) as { error: string }).error;
}

describe('feedback worker', () => {
    it('accepts a valid submission and emails it', async () => {
        const res = await call(post(validForm()));
        assert.equal(res.status, 200);
        assert.deepEqual(await res.json(), { ok: true });
        assert.equal(resendCalls.length, 1);
        assert.match(String(resendCalls[0].body.subject), /The relay screen froze/);
    });

    it('rejects a foreign origin', async () => {
        const res = await call(post(validForm(), { Origin: 'https://evil.example' }));
        assert.equal(res.status, 403);
        assert.equal(resendCalls.length, 0);
    });

    it('rejects an oversized body by its Content-Length', async () => {
        const res = await call(post('x', { 'content-length': String(MAX_BODY_BYTES + 1) }));
        assert.equal(res.status, 413);
    });

    it('rejects an oversized streamed body that sends no Content-Length', async () => {
        const chunk = new Uint8Array(16 * 1024);
        let sent = 0;
        const stream = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (sent > MAX_BODY_BYTES * 2) return controller.close();
                sent += chunk.byteLength;
                controller.enqueue(chunk);
            },
        });
        const req = post(stream, { 'content-type': 'application/x-www-form-urlencoded' });
        assert.equal(req.headers.get('content-length'), null);

        const res = await call(req);
        assert.equal(res.status, 413);
        // The reader gave up at the cap rather than buffering the whole stream.
        assert.ok(sent <= MAX_BODY_BYTES + chunk.byteLength * 2, `read ${sent} bytes`);
        assert.equal(resendCalls.length, 0);
    });

    it('explains a failed Turnstile check', async () => {
        turnstile = { success: false };
        const res = await call(post(validForm()));
        assert.equal(res.status, 400);
        assert.match(await errorOf(res), /verification/i);
    });

    it('rejects a Turnstile token issued for another hostname or action', async () => {
        turnstile = { success: true, hostname: 'evil.example', action: 'feedback' };
        assert.equal((await call(post(validForm()))).status, 400);
        turnstile = { success: true, hostname: 'veilkeepergame.com', action: 'login' };
        assert.equal((await call(post(validForm()))).status, 400);
    });

    it('asks for missing required fields', async () => {
        const res = await call(post(validForm({ bug_os: '' })));
        assert.equal(res.status, 400);
        assert.match(await errorOf(res), /required/);
    });

    it('rejects an over-long field', async () => {
        const res = await call(post(validForm({ bug_os: 'x'.repeat(10_000) })));
        assert.equal(res.status, 400);
        assert.match(await errorOf(res), /too long/);
    });

    it('drops honeypot submissions without sending mail', async () => {
        const res = await call(post(validForm({ company: 'Spam Inc' })));
        assert.equal(res.status, 200);
        assert.equal(resendCalls.length, 0);
    });

    it('reports a delivery failure when Resend errors', async () => {
        resendStatus = 500;
        const res = await call(post(validForm()));
        assert.equal(res.status, 502);
        assert.match(await errorOf(res), /deliver/);
    });
});
