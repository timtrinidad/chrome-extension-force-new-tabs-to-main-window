/**
 * A note about our icon management:
 *
 * we must manage the icon by-tabId due to the fact that Chrome does not allow the developer to set an icon by window, it
 * only allows either a global icon, or we can also set it by-tabId, so this code will allow us to set the icon by windowId
 * which will act as if the icon is changed for just that window.  Therefore, when we highlight a window, our icon will be
 * highlighted for that entire window (including each tab), and if tabs are removed or added to that window, they will get
 * the appropriate icon.
 *
 * <Begin window icon management>
 */

/**
 * sets the icon for the tab based on tabId
 * @param {number} tabId tabId of the tab to change the icon for
 * @param {boolean} highlight true if tab should be highlighted, false otherwise
 */
function setIcon(tabId, highlight) {
  chrome.action.setIcon({
    path: highlight ? 'src/icon_highlighted.png' : 'src/icon.png', // set the icon for only for MainWindow
    tabId,
  });
}

/**
 * updates all the previous mainWindow's tabs to be normal, and updates all the new mainWindow tabs to be highlighted
 * @param {number} mainWindowId id of the new mainWindow's windowId
 * @param {number | null} mainWindowIdOld id of the previous mainWindow's windowId
 */
function updateIcons(mainWindowId, mainWindowIdOld = null) {
  // highlight the tabs on the mainWindow
  chrome.tabs.query({ windowId: mainWindowId }, (tabs) => {
    tabs.forEach((tab) => {
      // for all the mainWindow tabs
      setIcon(tab.id, true); // set the icon to highlighted
    });
  });

  // un-highlight the previous tabs on the window
  if (mainWindowIdOld !== null) {
    chrome.tabs.query({ windowId: mainWindowIdOld }, (tabs) => {
      tabs.forEach((tab) => {
        // for all the mainWindow tabs
        setIcon(tab.id, false); // set the icon to normal, since it's no longer the mainWindow
      });
    });
  }
}

/**
 * upon startup, highlight all the tabs for the mainWindow
 */
chrome.storage.sync.get(
  // run this to update the icon when the extension is installed
  {
    mainWindowId: 0,
  },
  ({ mainWindowId }) => {
    updateIcons(mainWindowId);
  }
);

/**
 * add listener for when tab is detached, therefore this is a new window, therefore, we know it's not the mainWindow, so set it to the normal icon
 */
chrome.tabs.onDetached.addListener(async (tabId, { oldWindowId }) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      if (oldWindowId === mainWindowId) {
        setIcon(tabId, false); // set the icon to normal, since it's no longer the mainWindow
      }
    }
  );
});

/**
 * add listener for when tab is attached to a window, therefore, if the new windowId is the mainWindow, we can highlight it
 */
chrome.tabs.onAttached.addListener(async (tabId, { newWindowId }) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      if (newWindowId === mainWindowId) {
        setIcon(tabId, true); // set the icon for only for MainWindow
      }
    }
  );
});

/**
 * add a listener so when a tab starts or finishes loading, the icon gets set
 * this is necessary because we must wait for the tab to load before setting the icon
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.status === 'loading') {
    chrome.storage.sync.get(
      {
        mainWindowId: 0,
      },
      ({ mainWindowId }) => {
        /**
         * set the icon for only for MainWindow
         * otherwise set it to the default icon
         */
        setIcon(tabId, tab.windowId === mainWindowId);
      }
    );
  }
});

/**
 * </End window icon management>
 */

/**
 * add click listener to the main icon, so if clicked, it toggles this window as the mainWindow
 */
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.sync.get(
    {
      mainWindowId: 0,
    },
    ({ mainWindowId }) => {
      const newWindowId =
        mainWindowId === 0 || mainWindowId !== tab.windowId ? tab.windowId : 0; // toggle it if they click the same window again
      updateIcons(newWindowId, mainWindowId);

      chrome.storage.sync.set({
        mainWindowId: newWindowId,
      });
    }
  );
});

/**
 * add a listener to tab creation so if the tab should get moved to the mainWindow then it will
 */
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
