chrome.tabs.onCreated.addListener(async (tab) => {
  // Get value from storage, no promise support
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
      pinnedOnly: false,
    },
    async ({ mainWindowId, pinnedOnly }) => {
      try {
        // Throws if window ID does not exist
        await chrome.windows.get(mainWindowId);

        // If no source tab, but url is populated, this is likely
        // the user restoring an existing tab. Don't move it.
        if (!tab.openerTabId && tab.url) {
          return;
        }

        // If option enabled, only move new tabs created from pinned tabs
        if (pinnedOnly && tab.openerTabId) {
          const openerTab = await chrome.tabs.get(tab.openerTabId);
          if (!openerTab.pinned) {
            return;
          }
        }

        // Don't do anything if this is an entirely new window
        if (tab.index === 0) {
          return;
        }

        // Do nothing if tab is already in main window
        if (tab.windowId === mainWindowId) {
          return;
        }

        // Ignore incognito tabs
        if (tab.incognito) {
          return;
        }

        // Ignore if a new tab was explicitly requested in a given window
        if (tab.pendingUrl === 'chrome://newtab/') {
          return;
        }

        // Move tab and focus
        await chrome.tabs.move(tab.id, { windowId: mainWindowId, index: -1 });
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(mainWindowId, { focused: true });
      } catch (e) {
        // do nothing
      }
    }
  );
});
