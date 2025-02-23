const currentVersion = '1.0';
const versionCheckUrl = 'https://maheshbansod.github.io/vwo-devhelper/version.json';

document.addEventListener('DOMContentLoaded', () => {
    // Load saved configurations
    loadSavedConfigs();

    // Add version check with 5 second delay
    setTimeout(checkVersion, 5000);

    // Add event listener for impersonate button
    document.getElementById('impersonate').addEventListener('click', handleImpersonation);

    // Set initial tab state
    document.getElementById('savedTab').style.display = 'block';
    document.getElementById('newTab').style.display = 'none';

    // Add tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });

            // Add active class to clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId + 'Tab');
            tabContent.style.display = 'block';

            // Reset form if switching to new tab
            if (tabId === 'new') {
                document.getElementById('accountId').value = '';
                document.getElementById('note').value = '';
                
                // Try to read from clipboard and fill accountId if it's a number
                navigator.clipboard.readText()
                    .then(text => {
                        const trimmedText = text.trim();
                        if (/^\d+$/.test(trimmedText)) {
                            document.getElementById('accountId').value = trimmedText;
                        }
                    })
                    .catch((e) => {
                        console.error('Error reading clipboard:', e);
                    });

                // Prefill testapp from current URL if on vwo.com domain
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    const currentTab = tabs[0];
                    if (currentTab.url) {
                        try {
                            const currentUrl = new URL(currentTab.url);
                            if (currentUrl.hostname.endsWith('.vwo.com')) {
                                const subdomain = currentUrl.hostname.split('.')[0];
                                document.getElementById('testapp').value = subdomain;
                            } else {
                                document.getElementById('testapp').value = '';
                            }
                        } catch (e) {
                            document.getElementById('testapp').value = '';
                        }
                    }
                });
                
                const impersonateBtn = document.getElementById('impersonate');
                impersonateBtn.textContent = 'Impersonate';
                delete impersonateBtn.dataset.editIndex;
                impersonateBtn.onclick = handleImpersonation;
            }
        });
    });

    // Add search functionality
    document.getElementById('searchConfigs').addEventListener('input', filterConfigs);
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

        // Switch to new tab if no configs exist
        if (configs.length === 0) {
            document.querySelector('[data-tab="new"]').click();
        }
    });
}

// Create HTML element for a saved configuration
function createConfigElement(config, index) {
    const configElement = document.createElement('div');
    configElement.className = 'saved-config';

    const leftSection = document.createElement('div');
    leftSection.className = 'left-section';

    const accountId = document.createElement('div');
    accountId.className = 'account-id';
    accountId.textContent = config.accountId;

    leftSection.appendChild(accountId);

    if (config.note) {
        const note = document.createElement('div');
        note.className = 'config-note';
        note.textContent = config.note;
        leftSection.appendChild(note);
    }

    const rightSection = document.createElement('div');
    rightSection.className = 'right-section';

    const testappBadge = document.createElement('div');
    testappBadge.className = 'testapp-badge';
    testappBadge.textContent = config.testapp;

    const actions = document.createElement('div');
    actions.className = 'config-actions';

    const useButton = document.createElement('button');
    useButton.innerHTML = '<i class="fas fa-play"></i>';
    useButton.className = 'icon-button';
    useButton.title = 'Use';
    useButton.onclick = () => impersonateSaved(index);

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.className = 'icon-button edit-btn';
    editButton.title = 'Edit';
    editButton.onclick = () => editConfig(index);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.className = 'icon-button delete-btn';
    deleteButton.title = 'Delete';
    deleteButton.onclick = () => deleteConfig(index);

    actions.appendChild(useButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    rightSection.appendChild(testappBadge);
    rightSection.appendChild(actions);

    configElement.appendChild(leftSection);
    configElement.appendChild(rightSection);

    return configElement;
}

// Handle new impersonation
function handleImpersonation() {
    const accountId = document.getElementById('accountId').value.trim();
    const testapp = document.getElementById('testapp').value.trim();
    const note = document.getElementById('note').value.trim();
    
    if (!accountId || !testapp) {
        alert('Please enter both Account ID and Testapp identifier');
        return;
    }

    // Save configuration before impersonating
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        
        // Check if this configuration already exists
        const existingIndex = configs.findIndex(config => 
            config.accountId === accountId && config.testapp === testapp
        );

        if (existingIndex !== -1) {
            // If exists, update timestamp and move to top
            configs.splice(existingIndex, 1);
        }
        
        // Add new config at the beginning with timestamp
        configs.unshift({ 
            accountId, 
            testapp, 
            note, 
            timestamp: Date.now() 
        });

        chrome.storage.sync.set({ configs }, () => {
            loadSavedConfigs();
            // Clear input fields
            document.getElementById('accountId').value = '';
            document.getElementById('testapp').value = '';
            document.getElementById('note').value = '';
        });

        // Perform impersonation
        impersonate(testapp, accountId);
    });
}

// Impersonate function
function impersonate(testapp, accountId) {
    // Get the current active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // Determine the domain and port to use
        let domain = testapp;
        let port = '';
        
        if (currentTab.url) {
            try {
                const currentUrl = new URL(currentTab.url);
                if (currentUrl.hostname === 'local.vwo.com') {
                    domain = 'local';
                    port = currentUrl.port ? `:${currentUrl.port}` : '';
                }
            } catch (e) {
                console.error('Invalid URL:', e);
            }
        }
        
        const url = `https://${domain}.vwo.com${port}/access?accountId=${accountId}`;
        
        // Check if current tab is on a VWO domain
        if (currentTab.url && new URL(currentTab.url).hostname.endsWith('.vwo.com')) {
            // Update the current tab's URL
            chrome.tabs.update(currentTab.id, { url: url });
        } else {
            // Create a new tab if not on VWO domain
            chrome.tabs.create({ url });
        }
    });
}

// Impersonate using saved configuration
window.impersonateSaved = function(index) {
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        const config = configs[index];
        if (config) {
            // Remove the config from its current position
            configs.splice(index, 1);
            // Update timestamp and add to the beginning
            config.timestamp = Date.now();
            configs.unshift(config);
            
            // Save the updated configs and reload the list
            chrome.storage.sync.set({ configs }, loadSavedConfigs);
            
            // Perform the impersonation
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

// Add this new function
function filterConfigs(e) {
    const searchTerm = e.target.value.toLowerCase();
    const configs = document.querySelectorAll('.saved-config');
    
    configs.forEach(config => {
        const accountId = config.querySelector('.account-id').textContent.toLowerCase();
        const testapp = config.querySelector('.testapp-badge').textContent.toLowerCase();
        const note = config.querySelector('.config-note')?.textContent.toLowerCase() || '';
        
        const matches = accountId.includes(searchTerm) || 
                       testapp.includes(searchTerm) || 
                       note.includes(searchTerm);
        
        config.classList.toggle('hidden', !matches);
    });
}

// Add new edit configuration function
function editConfig(index) {
    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        const config = configs[index];
        
        // Switch to new impersonation tab
        const newTabBtn = document.querySelector('[data-tab="new"]');
        newTabBtn.click();
        
        // Fill in the form with existing values
        document.getElementById('accountId').value = config.accountId;
        document.getElementById('testapp').value = config.testapp;
        document.getElementById('note').value = config.note || '';
        
        // Change the impersonate button to update
        const impersonateBtn = document.getElementById('impersonate');
        impersonateBtn.textContent = 'Update and impersonate';
        impersonateBtn.dataset.editIndex = index;
        
        // Update the handler
        impersonateBtn.onclick = () => handleUpdate(index);
    });
}

// Add new update handler function
function handleUpdate(index) {
    const accountId = document.getElementById('accountId').value.trim();
    const testapp = document.getElementById('testapp').value.trim();
    const note = document.getElementById('note').value.trim();
    
    if (!accountId || !testapp) {
        alert('Please enter both Account ID and Testapp identifier');
        return;
    }

    chrome.storage.sync.get(['configs'], (result) => {
        const configs = result.configs || [];
        // Remove the old config
        configs.splice(index, 1);
        // Add updated config at the beginning
        configs.unshift({ 
            accountId, 
            testapp, 
            note, 
            timestamp: Date.now() 
        });
        
        chrome.storage.sync.set({ configs }, () => {
            // Reset the form
            document.getElementById('accountId').value = '';
            document.getElementById('testapp').value = '';
            document.getElementById('note').value = '';
            
            // Reset the button
            const impersonateBtn = document.getElementById('impersonate');
            impersonateBtn.textContent = 'Impersonate';
            delete impersonateBtn.dataset.editIndex;
            impersonateBtn.onclick = handleImpersonation;
            
            // Switch back to saved tab and reload configs
            document.querySelector('[data-tab="saved"]').click();
            loadSavedConfigs();
        });
    });
}

// Add new version check function
function checkVersion() {
    fetch(versionCheckUrl)
        .then(response => response.json())
        .then(data => {
            if (data.version && data.version !== currentVersion) {
                document.getElementById('update-available-message').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error checking version:', error);
        });
} 