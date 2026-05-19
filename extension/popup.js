const $ = (id) => document.getElementById(id);

(async () => {
  const c = await chrome.storage.sync.get(['scholr_token', 'scholr_api']);
  $('api').value = c.scholr_api || 'http://localhost:5000/api';
  $('token').value = c.scholr_token || '';
})();

$('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({ scholr_token: $('token').value.trim(), scholr_api: $('api').value.trim() });
  $('status').textContent = 'Syncing…';
  chrome.runtime.sendMessage({ type: 'scholr-sync' }, (r) => {
    $('status').textContent = r?.ok ? 'Synced. Blocking active when a focus session is on.' : 'Saved.';
  });
});
