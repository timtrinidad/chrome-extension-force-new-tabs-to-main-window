chrome.tabs.onCreated.addListener(async (tab) => {
  // Get value from storage, no promise support
  chrome.storage.sync.get({
    mainWindowId: 0,
  }, async ({mainWindowId}) => {
    try {
      // Throws if window ID does not exist
      const window = await chrome.windows.get(mainWindowId);

      // Do nothing if tab is already in main window
      if(tab.windowId == mainWindowId) {
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
