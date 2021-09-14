# Chrome Extension: Force New Tabs to Main Window

[![CircleCI](https://circleci.com/gh/timtrinidad/chrome-extension-force-new-tabs-to-main-window.svg?style=svg)](https://circleci.com/gh/timtrinidad/chrome-extension-force-new-tabs-to-main-window)

This is a simple chrome extension that allows you to designate
a single main window to which new tabs are opened.

For example, you may want one window to only be your mail client (e.g. gmail),
but still want your main browsing window to handle any new tabs opened from an email.

## Usage
1. Install the extension
2. Open the extension options
3. Choose a window in which all new tabs should be opened.

## Publishing to Chrome Store
* TODO: automate
* Update manifest.json for new version
* Update [CHANGELOG.md](changelog.md)
* Tag release

      git tag [version]

* Run `yarn package`
* Push to github

      git push
      git push --tags

* Upload to [Chrome Web Store](https://chrome.google.com/webstore/devconsole/a1eb0e00-3f17-40ec-9c52-fd5f24338591/kgojjafnbajjomijiceiefakpphcicen/edit/package)
