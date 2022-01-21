// Saves options to chrome.storage
async function saveOptions() {
  const mainWindowId = document.getElementById('main-window').value;
  const pinnedOnly = document.getElementById('pinned-only').checked;
  chrome.storage.sync.set(
    {
      mainWindowId: Number(mainWindowId),
      pinnedOnly,
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restoreOptions() {
  const windows = await chrome.windows.getAll();
  const tabs = await Promise.all(
    windows.map((win) => chrome.tabs.query({ windowId: win.id }))
  );
  const options = tabs.map((tab) => ({
    id: tab[0].windowId,
    title: `Window ID ${tab[0].windowId} (First Tab: ${tab[0].title})`,
  }));

  const select = document.getElementById('main-window');
  options.forEach(({ id, title }) => {
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = title;
    select.appendChild(opt);
  });

  // Get stored value, no promise support
  chrome.storage.sync.get(
    {
      mainWindowId: '0',
      pinnedOnly: false,
    },
    ({ mainWindowId, pinnedOnly }) => {
      document.getElementById('main-window').value = mainWindowId;
      document.getElementById('pinned-only').checked = pinnedOnly;
    }
  );
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
