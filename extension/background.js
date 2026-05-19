// Scholr Focus Blocker — background worker
// Polls API for blocklist + active focus session, then dynamically updates declarativeNetRequest rules.

const DEFAULT_API = 'http://localhost:5000/api';

async function getConfig() {
  const c = await chrome.storage.sync.get(['scholr_token', 'scholr_api']);
  return { token: c.scholr_token, api: c.scholr_api || DEFAULT_API };
}

async function fetchBlocklist() {
  const { token, api } = await getConfig();
  if (!token) return [];
  try {
    const res = await fetch(`${api}/focus/blocked-sites`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.sites || []).filter((s) => s.enabled).map((s) => s.domain);
  } catch (e) { console.warn('[scholr] fetchBlocklist failed', e); return []; }
}

async function fetchActiveSession() {
  const { token, api } = await getConfig();
  if (!token) return null;
  try {
    const res = await fetch(`${api}/focus/sessions`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.sessions || []).find((s) => s.status === 'ACTIVE') || null;
  } catch { return null; }
}

async function updateRules() {
  const session = await fetchActiveSession();
  const enabled = !!session;
  const list = enabled ? await fetchBlocklist() : [];
  // Clear current rules
  const old = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: old.map((r) => r.id) });
  if (!list.length) return;
  const rules = list.map((domain, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
    condition: { urlFilter: `||${domain}^`, resourceTypes: ['main_frame'] },
  }));
  await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
  console.log(`[scholr] blocking ${rules.length} domains`);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('scholr-sync', { periodInMinutes: 1 });
  updateRules();
});
chrome.alarms.onAlarm.addListener(updateRules);
chrome.runtime.onMessage.addListener((msg, _s, send) => {
  if (msg?.type === 'scholr-sync') updateRules().then(() => send({ ok: true }));
  return true;
});
