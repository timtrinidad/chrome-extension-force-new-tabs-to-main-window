// only update only the mainWindowIdOld and the mainWindowId
function updateIcons(mainWindowId, mainWindowIdOld = null) {
  // highlight the mainWindow
  chrome.tabs.query({ windowId: mainWindowId }, (tabs) => {
    tabs.forEach((tab) => {
      // for all the mainWindow tabs
      chrome.action.setIcon({
        path: 'src/icon_highlighted.png', // set the icon for only for MainWindow
        tabId: tab.id,
      });
    });
  });

  // un-highlight the previous window
  if (mainWindowIdOld !== null) {
    chrome.tabs.query({ windowId: mainWindowIdOld }, (tabs) => {
      tabs.forEach((tab) => {
        // for all the mainWindow tabs
        chrome.action.setIcon({
          path: 'src/icon.png', // set the icon for only for MainWindow
          tabId: tab.id,
        });
      });
    });
  }
}

// upon startup, update the icons
chrome.storage.sync.get(
  // run this to update the icon when the extension is installed
  {
    mainWindowId: 0,
  },
  ({ mainWindowId }) => {
    updateIcons(mainWindowId);
  }
);

// main icon was clicked, so toggle the mainWindow
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      const newWindowId =
        mainWindowId === 0 || mainWindowId !== tab.windowId ? tab.windowId : 0;
      updateIcons(newWindowId, mainWindowId);

      chrome.storage.sync.set({
        mainWindowId: newWindowId, // toggle it if they click the same window again
      });
    }
  );
});

// it's detached, therefore this is a new window, therefore, we know it's not the mainWindow
chrome.tabs.onDetached.addListener(async (tabId, { oldWindowId }) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      if (oldWindowId === mainWindowId) {
        chrome.action.setIcon({
          path: 'src/icon.png', // set it as NOT the mainWindow
          tabId,
        });
      }
    }
  );
});

// it's attached, therefore check is it needs the mainWindowIcon
chrome.tabs.onAttached.addListener(async (tabId, { newWindowId }) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      if (newWindowId === mainWindowId) {
        chrome.action.setIcon({
          path: 'src/icon_highlighted.png', // set the icon for only for MainWindow
          tabId,
        });
      }
    }
  );
});

// this is necessary because we must wait for the tab to load before setting the icon
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.storage.sync.get(
      {
        mainWindowId: 0,
      },
      ({ mainWindowId }) => {
        chrome.action.setIcon({
          path:
            tab.windowId === mainWindowId
              ? 'src/icon_highlighted.png'
              : 'src/icon.png', // set the icon for only for MainWindow
          tabId,
        });
      }
    );
  }
});

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
        // note: we WANT TO update the icon here, but CANNOT, because we must wait for the tab to load, which is handled by *onUpdated*
      } catch (e) {
        // do nothing
      }
    }
  );
});
