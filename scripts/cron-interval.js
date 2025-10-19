#!/usr/bin/env node
// Lightweight Node.js cron runner: calls /api/cron/scheduler every 5 minutes
// Works locally and in servers. Uses only built-in http/https.

const https = require('https');
const http = require('http');

const BASE_URL = process.env.CRON_BASE_URL || process.env.RENDER_INTERNAL_URL || process.env.RENDER_URL || 'http://localhost:3000';
const LIMIT = parseInt(process.env.CRON_BATCH_LIMIT || '10', 10);
const INTERVAL_MS = parseInt(process.env.CRON_INTERVAL_MS || String(5 * 60 * 1000), 10); // default 5 minutes

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function requestJson(url, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });
  });
}

let running = false;
async function tick() {
  if (running) {
    log('⏭️ Previous tick still running, skipping...');
    return;
  }
  running = true;
  try {
    log(`🏥 Health check → ${BASE_URL}/api/health`);
    const health = await requestJson(`${BASE_URL}/api/health`, 10000);
    if (health.status !== 200) throw new Error(`Health ${health.status}`);

    const url = `${BASE_URL}/api/cron/scheduler?limit=${LIMIT}`;
    log(`📡 Calling scheduler: ${url}`);
    const res = await requestJson(url, 60000);
    if (res.status !== 200 || !res.data?.success) {
      throw new Error(`Scheduler failed: status=${res.status} body=${JSON.stringify(res.data)}`);
    }
    const r = res.data;
    log(`✅ Done: processed=${r.processed} success=${r.successful} failed=${r.failed} skipped=${r.skipped}`);
  } catch (e) {
    log(`❌ Tick error: ${e.message}`);
  } finally {
    running = false;
  }
}

log('🎯 Node cron started (every 5 minutes). ENV:');
log(`BASE_URL=${BASE_URL}, LIMIT=${LIMIT}, INTERVAL_MS=${INTERVAL_MS}`);

// Immediate run, then interval
tick();
const handle = setInterval(tick, INTERVAL_MS);

process.on('SIGINT', () => {
  log('🛑 Stopping cron...');
  clearInterval(handle);
  process.exit(0);
});


