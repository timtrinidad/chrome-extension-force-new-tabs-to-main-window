chrome.tabs.onCreated.addListener(async (tab) => {
  // Get value from storage, no promise support
  chrome.storage.sync.get({
    mainWindowId: 0,
  }, async ({mainWindowId}) => {
    try {
      // Throws if window ID does not exist
      const window = await chrome.windows.get(mainWindowId);

      // Don't do anything if this is an entirely new window
      if (tab.index == 0) {
        return;
      }

      // Do nothing if tab is already in main window
      if (tab.windowId == mainWindowId) {
        return;
      }

      // Ignore incognito tabs
      if(tab.incognito) {
        return;
      }

      // Ignore if a new tab was explicitly requested in a given window
      if (tab.pendingUrl == 'chrome://newtab/') {
        return;
      }

      // Move tab and focus
      await chrome.tabs.move(tab.id, {windowId: mainWindowId, index: -1});
      await chrome.tabs.update(tab.id, {active: true});
    } catch(e) {
      // do nothing
    }
  });
})
