// on startup, create a table of every window's active tab
chrome.tabs.query(
  {
    active: true,
  },
  (tabs) => {
    const newTabFocusTable = {}; // start fresh
    tabs.forEach((tab) => {
      newTabFocusTable[tab.windowId] = tab.id;
    });

    chrome.storage.sync.set({
      tabFocusTable: newTabFocusTable,
    });
  }
);

// on activated, add it to the index
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  chrome.storage.sync.get(
    {
      tabFocusTable: {},
    },
    ({ tabFocusTable }) => {
      const newTabFocusTable = tabFocusTable;
      newTabFocusTable[windowId] = tabId;

      chrome.storage.sync.set({
        tabFocusTable: newTabFocusTable,
      });
    }
  );
});

// loads our index, removes the window from it, and saves
function removeWindow(windowId) {
  chrome.storage.sync.get(
    {
      tabFocusTable: {},
    },
    ({ tabFocusTable }) => {
      const newTabFocusTable = tabFocusTable;
      delete newTabFocusTable[windowId];

      chrome.storage.sync.set({
        tabFocusTable: newTabFocusTable,
      });
    }
  );
}

// on tab closed, remove it, if it's there
chrome.tabs.onRemoved.addListener((tabId, { windowId }) => {
  removeWindow(windowId);
});

// on window closed, remove it from the index
chrome.windows.onRemoved.addListener((windowId) => {
  removeWindow(windowId);
});

chrome.tabs.onCreated.addListener(async (tab) => {
  // Get value from storage, no promise support
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
      pinnedOnly: false,
      tabFocusTable: {},
    },
    async ({ mainWindowId, pinnedOnly, tabFocusTable }) => {
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

        // restore focus for source window
        const previousTabId = tabFocusTable[tab.windowId];
        if (previousTabId !== undefined) {
          await chrome.tabs.update(previousTabId, { active: true });
        }

        // Move tab
        await chrome.tabs.move(tab.id, { windowId: mainWindowId, index: -1 });
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(mainWindowId, { focused: true });
      } catch (e) {
        // do nothing
      }
    }
  );
});
