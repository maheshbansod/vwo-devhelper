document.addEventListener('DOMContentLoaded', () => {
    // Load saved configurations
    loadSavedConfigs();

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
                document.getElementById('testapp').value = '';
                document.getElementById('note').value = '';
                
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
    });
}

// Create HTML element for a saved configuration
function createConfigElement(config, index) {
    const configElement = document.createElement('div');
    configElement.className = 'saved-config';

    const configInfo = document.createElement('div');
    configInfo.className = 'config-info';

    const title = document.createElement('div');
    title.className = 'config-title';
    title.textContent = `${config.testapp} - Account: ${config.accountId}`;

    const note = document.createElement('div');
    note.className = 'config-note';
    note.textContent = config.note || '';

    const actions = document.createElement('div');
    actions.className = 'config-actions';

    const useButton = document.createElement('button');
    useButton.textContent = 'Use';
    useButton.onclick = () => impersonateSaved(index);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-btn';
    editButton.onclick = () => editConfig(index);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-btn';
    deleteButton.onclick = () => deleteConfig(index);

    configInfo.appendChild(title);
    if (config.note) {
        configInfo.appendChild(note);
    }
    
    actions.appendChild(useButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    configElement.appendChild(configInfo);
    configElement.appendChild(actions);

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
        const exists = configs.some(config => 
            config.accountId === accountId && config.testapp === testapp
        );

        // Only save if it's a new configuration
        if (!exists) {
            configs.push({ accountId, testapp, note });
            chrome.storage.sync.set({ configs }, () => {
                loadSavedConfigs();
                // Clear input fields
                document.getElementById('accountId').value = '';
                document.getElementById('testapp').value = '';
                document.getElementById('note').value = '';
            });
        }

        // Perform impersonation
        impersonate(testapp, accountId);
    });
}

// Impersonate function
function impersonate(testapp, accountId) {
    const url = `https://${testapp}.vwo.com/access?accountId=${accountId}`;
    chrome.tabs.create({ url });
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

// Add this new function
function filterConfigs(e) {
    const searchTerm = e.target.value.toLowerCase();
    const configs = document.querySelectorAll('.saved-config');
    
    configs.forEach(config => {
        const accountId = config.querySelector('.config-title').textContent.toLowerCase();
        const testapp = config.querySelector('.config-title').textContent.toLowerCase();
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
        configs[index] = { accountId, testapp, note };
        
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