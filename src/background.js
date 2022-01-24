// on startup, create a table of every window's active tab
const tabFocusTable = {}; // start fresh
chrome.tabs.query(
  {
    active: true,
  },
  (tabs) => {
    tabs.forEach((tab) => {
      tabFocusTable[tab.windowId] = tab.id;
    });
  }
);

// on activated, add it to the table
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  tabFocusTable[windowId] = tabId;
});

/** tab removed from window, so update the window's active tab */
function updateWindowActiveTab(windowId) {
  // get the new active tab from the window
  chrome.tabs.query(
    {
      active: true,
      windowId,
    },
    ([tab]) => {
      if (tab) {
        if (tab.id !== tabFocusTable[windowId]) {
          tabFocusTable[windowId] = tab.id; // update the window with newly active tab (since old tab was removed)
        }
      }
    }
  );
}

// on tab closed, update which tab is active on it's window
chrome.tabs.onRemoved.addListener((tabId, { windowId }) => {
  updateWindowActiveTab(windowId);
});

// on tab detached, update which tab is active on it's window
chrome.tabs.onDetached.addListener((tabId, { oldWindowId }) => {
  updateWindowActiveTab(oldWindowId);
});

// on window closed, remove it from the table
chrome.windows.onRemoved.addListener((windowId) => {
  delete tabFocusTable[windowId];
});

chrome.tabs.onCreated.addListener(async (tab) => {
  const previousTabId = tabFocusTable[tab.windowId]; // note: we get this before hitting storage to avoid a race condition between onActivated overwriting this
  // Get value from storage, no promise support
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
      pinnedOnly: false,
      externalOnly: false,
    },
    async ({ mainWindowId, pinnedOnly, externalOnly }) => {
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

        // Ignore if a new tab was opened from another program
        if (externalOnly && tab.openerTabId !== undefined) {
          return;
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

        // restore previous windows's focus
        if (previousTabId !== undefined) {
          await chrome.tabs.update(previousTabId, { active: true });
        }

        // Move tab
        await chrome.tabs.move(tab.id, { windowId: mainWindowId, index: -1 }); // move it to the mainWindow
        await chrome.tabs.update(tab.id, { active: true }); // make the window flip to that tab
        await chrome.windows.update(mainWindowId, { focused: true }); // focus that tab
      } catch (e) {
        // do nothing
      }
    }
  );
});
