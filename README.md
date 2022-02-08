# Chrome Extension: Force New Tabs to Main Window

[![CircleCI](https://circleci.com/gh/timtrinidad/chrome-extension-force-new-tabs-to-main-window.svg?style=svg)](https://circleci.com/gh/timtrinidad/chrome-extension-force-new-tabs-to-main-window)

This is a simple chrome extension that allows you to designate
a single main window to which new tabs are opened.

For example, you may want one window to only be your mail client (e.g. gmail),
but still want your main browsing window to handle any new tabs opened from an email.

* [Chrome Web Store Application Profile](https://chrome.google.com/webstore/detail/force-new-tabs-to-main-wi/kgojjafnbajjomijiceiefakpphcicen?hl=en&authuser=0)
* [Chrome Web Store Dev Console](https://chrome.google.com/webstore/devconsole/a1eb0e00-3f17-40ec-9c52-fd5f24338591/kgojjafnbajjomijiceiefakpphcicen/edit/package)

## Usage
1. Install the extension
2. Open the extension options
3. Choose a window in which all new tabs should be opened.

## Publishing to Chrome Store
1. Update manifest.json for new version
2. Update [CHANGELOG.md](CHANGELOG.md)
3. Tag release

      git tag [version]

4. Run `yarn package`
5. Push to github

      git push
      git push --tags

6. Run CircleCI approval to upload and publish to Chrome Web Store

If there is an error at the publish step, the refresh token may need to be renewed (especially if it has been >6mo since its last use).
1. In the browser, go to https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fchromewebstore&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&access_type=offline&approval_prompt=force&client_id=YOUR_CLIENT_ID_HERE
2. Copy the `code`
3. Run the following:

     curl "https://accounts.google.com/o/oauth2/token" -d "client_id=YOUR_CLIENT_ID_HERE&client_secret=YOUR_CLIENT_SECRET_HERE&code=THE_CODE_FROM_STEP_2_HERE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"

4. Copy the returned refresh token into CircleCI's environment variables for `GOOGLE_CIRCLECI_REFRESH_TOKEN`
