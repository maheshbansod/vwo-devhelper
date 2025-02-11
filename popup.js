document.addEventListener('DOMContentLoaded', () => {
    // Load saved configurations
    loadSavedConfigs();

    // Add event listeners
    document.getElementById('impersonate').addEventListener('click', handleImpersonation);
    document.getElementById('saveConfig').addEventListener('click', saveConfiguration);
});

// Load saved configurations from storage
function loadSavedConfigs() {
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        const container = document.getElementById('savedConfigs');
        container.innerHTML = '';

        configs.forEach((config, index) => {
            const configElement = createConfigElement(config, index);
            container.appendChild(configElement);
        });
    });
}

// Create HTML element for a saved configuration
function createConfigElement(config, index) {
    const div = document.createElement('div');
    div.className = 'saved-config';
    div.innerHTML = `
        <div class="config-info">
            <div class="config-title">${config.testapp}.vwo.com - Account ${config.accountId}</div>
            ${config.note ? `<div class="config-note">${config.note}</div>` : ''}
        </div>
        <div class="config-actions">
            <button onclick="impersonateSaved(${index})">Use</button>
            <button class="delete-btn" onclick="deleteConfig(${index})">Delete</button>
        </div>
    `;
    return div;
}

// Handle new impersonation
function handleImpersonation() {
    const accountId = document.getElementById('accountId').value.trim();
    const testapp = document.getElementById('testapp').value.trim();
    
    if (!accountId || !testapp) {
        alert('Please enter both Account ID and Testapp identifier');
        return;
    }

    impersonate(testapp, accountId);
}

// Impersonate function
function impersonate(testapp, accountId) {
    const url = `https://${testapp}.vwo.com/access?accountId=${accountId}`;
    chrome.tabs.create({ url });
}

// Save new configuration
function saveConfiguration() {
    const accountId = document.getElementById('accountId').value.trim();
    const testapp = document.getElementById('testapp').value.trim();
    const note = document.getElementById('note').value.trim();

    if (!accountId || !testapp) {
        alert('Please enter both Account ID and Testapp identifier');
        return;
    }

    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        configs.push({ accountId, testapp, note });
        
        chrome.storage.sync.set({ configs }, () => {
            loadSavedConfigs();
            // Clear input fields
            document.getElementById('accountId').value = '';
            document.getElementById('testapp').value = '';
            document.getElementById('note').value = '';
        });
    });
}

// Impersonate using saved configuration
window.impersonateSaved = function(index) {
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        const config = configs[index];
        if (config) {
            impersonate(config.testapp, config.accountId);
        }
    });
}

// Delete saved configuration
window.deleteConfig = function(index) {
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        configs.splice(index, 1);
        chrome.storage.sync.set({ configs }, loadSavedConfigs);
    });
} 