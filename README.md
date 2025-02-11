# VWO Account Impersonator Chrome Extension

A Chrome extension to easily manage and switch between VWO account impersonations.

## Features

- Quick impersonation by entering Account ID and Testapp identifier
- Save frequently used account configurations
- Add notes to saved configurations for better organization
- One-click impersonation from saved configurations
- Persistent storage of configurations across browser sessions

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files

## Usage

1. Click the extension icon in your Chrome toolbar
2. To impersonate a new account:
   - Enter the Account ID
   - Enter the Testapp identifier
   - (Optional) Add a note to remember what this account is for
   - Click "Impersonate" to directly access the account
   - Click "Save Configuration" to save it for future use
3. For saved configurations:
   - Click "Use" to impersonate that account
   - Click "Delete" to remove the configuration

## Development

The extension is built using vanilla JavaScript and uses Chrome's Storage API to persist configurations.

Files:
- `manifest.json`: Extension configuration
- `popup.html`: Extension popup UI
- `popup.js`: Main extension logic
- `styles.css`: UI styling 