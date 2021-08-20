// Saves options to chrome.storage
async function save_options() {
  var mainWindowId = document.getElementById('main-window').value;
  chrome.storage.sync.set({
    mainWindowId: Number(mainWindowId)
  }, () => {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restore_options() {
  const windows = await chrome.windows.getAll();
  const options = [];
  for (win of windows) {
    const tabs = await chrome.tabs.query({windowId: win.id});
    options.push({id: win.id, title: `Window ID ${win.id} (First Tab: ${tabs[0].title})`})
  }

  const select = document.getElementById('main-window');
  options.map(({id, title}) => {
    const opt = document.createElement('option');
    opt.value = String(id);
    opt.textContent = title;
    select.appendChild(opt);
  })

  // Get stored value, no promise support
  chrome.storage.sync.get({
    mainWindowId: "0",
  }, ({mainWindowId}) => {
    document.getElementById('main-window').value = mainWindowId;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
  save_options);

console.log('options');
