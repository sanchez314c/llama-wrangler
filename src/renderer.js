let currentModel = null;
let models = [];
let activeTab = 'huggingface';
let isShuttingDown = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkDependencies();
    await refreshModels();

    // Setup webview listeners
    setupWebviewListeners();

    // Listen for server logs
    window.electronAPI.onServerLog(log => {
      // Server log - silently handle
    });

    // Listen for download progress
    window.electronAPI.onDownloadProgress(message => {
      if (!isShuttingDown) {
        updateLoadingText(message);
      }
    });

    window.electronAPI.onDownloadPercentage(percentage => {
      if (!isShuttingDown) {
        updateProgress(percentage);
      }
    });

    window.electronAPI.onDownloadError(error => {
      if (!isShuttingDown) {
        hideLoading();
        showError('Download failed: ' + error);
      }
    });
  } catch (error) {
    console.error('Initialization error:', error);
    // Don't show initialization errors to user unless critical
  }
});

// Handle window unload
window.addEventListener('beforeunload', () => {
  isShuttingDown = true;
});

// Check dependencies
async function checkDependencies() {
  try {
    const result = await window.electronAPI.checkDependencies();
    if (result.success) {
      const { checks } = result;
      if (!checks.llamaCpp) {
        // Show a custom dialog with options
        showLlamaCppDialog();
      }
    }
  } catch (error) {
    console.error('Dependency check error:', error);
  }
}

// Show llama.cpp setup dialog
function showLlamaCppDialog() {
  const existingDialog = document.getElementById('llamacpp-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('div');
  dialog.id = 'llamacpp-dialog';
  dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 30px;
        z-index: 1000;
        max-width: 500px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

  dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #fff;">llama.cpp Not Found</h2>
        <p style="color: #888; margin-bottom: 20px;">
            llama.cpp is required to run models. You can either select an existing installation 
            or install it automatically.
        </p>
        <div style="display: flex; gap: 10px; flex-direction: column;">
            <button onclick="selectLlamaCppPath()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">
                Select Existing llama.cpp Directory
            </button>
            <button onclick="installLlamaCpp()" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">
                Install llama.cpp Automatically
            </button>
            <button onclick="closeLlamaCppDialog()" style="
                background: #666;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">
                Cancel
            </button>
        </div>
        <div id="current-path" style="margin-top: 20px; color: #666; font-size: 12px;"></div>
    `;

  document.body.appendChild(dialog);

  // Show current path
  updateCurrentPath();
}

// Close llama.cpp dialog
function closeLlamaCppDialog() {
  const dialog = document.getElementById('llamacpp-dialog');
  if (dialog) {
    dialog.remove();
  }
}

// Select llama.cpp path
async function selectLlamaCppPath() {
  try {
    const result = await window.electronAPI.selectLlamaCppPath();
    if (result.success) {
      closeLlamaCppDialog();
      showSuccess('llama.cpp path updated successfully!');
      await refreshModels();
    } else if (result.error && result.error !== 'No directory selected') {
      showError(result.error);
    }
  } catch (error) {
    console.error('Select path error:', error);
  }
}

// Install llama.cpp
async function installLlamaCpp() {
  try {
    closeLlamaCppDialog();
    showLoading('Installing llama.cpp...', 'This may take a few minutes');
    const installResult = await window.electronAPI.installLlamaCpp();
    hideLoading();
    if (installResult.success) {
      showSuccess('llama.cpp installed successfully!');
      await refreshModels();
    } else {
      showError('Failed to install llama.cpp: ' + installResult.error);
    }
  } catch (error) {
    hideLoading();
    showError('Installation error: ' + error.message);
  }
}

// Update current path display
async function updateCurrentPath() {
  try {
    const pathDiv = document.getElementById('current-path');
    if (pathDiv) {
      const result = await window.electronAPI.getLlamaCppPath();
      if (result.success) {
        pathDiv.innerHTML = `Current path: <code style="background: #333; padding: 2px 6px; border-radius: 3px;">${result.path}</code>`;
      }
    }
  } catch (error) {
    console.error('Update path error:', error);
  }
}

// Show quantize dialog
function showQuantizeDialog(modelPath, modelName) {
  // Available quantization options for llama.cpp
  const quantOptions = [
    { value: 'Q2_K', name: 'Q2_K - smallest, significant quality loss', size: '~30%' },
    { value: 'Q3_K_S', name: 'Q3_K_S - very small, high quality loss', size: '~35%' },
    { value: 'Q3_K_M', name: 'Q3_K_M - very small, high quality loss', size: '~40%' },
    { value: 'Q3_K_L', name: 'Q3_K_L - small, substantial quality loss', size: '~45%' },
    { value: 'Q4_0', name: 'Q4_0 - legacy, small, significant quality loss', size: '~50%' },
    { value: 'Q4_K_S', name: 'Q4_K_S - small, greater quality loss', size: '~50%' },
    { value: 'Q4_K_M', name: 'Q4_K_M - medium, balanced quality (recommended)', size: '~55%' },
    { value: 'Q5_0', name: 'Q5_0 - legacy, medium, balanced quality', size: '~60%' },
    { value: 'Q5_K_S', name: 'Q5_K_S - large, low quality loss', size: '~60%' },
    { value: 'Q5_K_M', name: 'Q5_K_M - large, very low quality loss', size: '~65%' },
    { value: 'Q6_K', name: 'Q6_K - very large, extremely low quality loss', size: '~75%' },
    { value: 'Q8_0', name: 'Q8_0 - very large, extremely low quality loss', size: '~95%' },
  ];

  const dialog = document.createElement('div');
  dialog.id = 'quantize-dialog';
  dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

  const content = document.createElement('div');
  content.style.cssText = `
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

  content.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #fff;">Quantize Model</h2>
        <p style="color: #888; margin-bottom: 10px;">Model: <strong style="color: #fff;">${modelName}</strong></p>
        <p style="color: #888; margin-bottom: 20px;">Select quantization level. Lower quality = smaller file size.</p>
        <div id="quant-options" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            ${quantOptions
              .map(
                opt => `
                <label style="display: flex; align-items: center; padding: 10px; background: #2a2a2a; border-radius: 8px; cursor: pointer; hover: background: #333;">
                    <input type="radio" name="quantization" value="${opt.value}" ${opt.value === 'Q4_K_M' ? 'checked' : ''} style="margin-right: 10px;">
                    <div style="flex: 1;">
                        <div style="color: #fff; font-weight: 500;">${opt.name}</div>
                        <div style="color: #666; font-size: 12px;">Size: ${opt.size} of original</div>
                    </div>
                </label>
            `
              )
              .join('')}
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="closeQuantizeDialog()" style="
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Cancel</button>
            <button onclick="startQuantization('${modelPath.replace(/'/g, "\\'")}', '${modelName.replace(/'/g, "\\\\'")}')" style="
                background: #3B82F6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">Start Quantization</button>
        </div>
    `;

  dialog.appendChild(content);
  document.body.appendChild(dialog);
}

// Close quantize dialog
function closeQuantizeDialog() {
  const dialog = document.getElementById('quantize-dialog');
  if (dialog) {
    dialog.remove();
  }
}

// Start quantization
async function startQuantization(modelPath, modelName) {
  const selectedQuant = document.querySelector('input[name="quantization"]:checked').value;
  closeQuantizeDialog();

  showLoading(`Quantizing ${modelName} to ${selectedQuant}...`, 'This may take several minutes');

  try {
    const result = await window.electronAPI.quantizeModel(modelPath, selectedQuant);
    if (result.success) {
      hideLoading();
      showSuccess(`Model quantized successfully to ${selectedQuant}!`);
      await refreshModels();
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoading();
    showError('Quantization failed: ' + error.message);
  }
}

// Refresh model list
async function refreshModels() {
  try {
    const result = await window.electronAPI.getModels();
    if (result.success) {
      models = result.models || [];
      displayModels();

      // Check current model only if we don't already have one set
      if (!currentModel) {
        try {
          const currentResult = await window.electronAPI.getCurrentModel();
          if (currentResult && currentResult.success && currentResult.model) {
            currentModel = currentResult.model;
            updateStatus(true, `Running: ${currentModel}`);
          } else {
            updateStatus(false, 'No model loaded');
          }
        } catch (currentError) {
          // Failed to get current model - just show no model loaded
          updateStatus(false, 'No model loaded');
        }
      }
    } else {
      // Show empty model list on error
      models = [];
      displayModels();
      updateStatus(false, 'No model loaded');
    }
  } catch (error) {
    console.error('Refresh models error:', error);
    // Don't show error to user - just display empty list
    models = [];
    displayModels();
    updateStatus(false, 'No model loaded');
  }
}

// Display models in sidebar
function displayModels() {
  const modelList = document.getElementById('modelList');
  if (!modelList) return;

  if (models.length === 0) {
    modelList.innerHTML = `
            <div class="no-models">
                <div class="no-models-icon">📦</div>
                <p>No models installed yet</p>
                <p style="font-size: 12px; margin-top: 8px;">Browse and download models to get started</p>
            </div>
        `;
    return;
  }

  modelList.innerHTML = models
    .map(
      model => `
        <div class="model-item ${model.name === currentModel ? 'active' : ''}" 
             onclick="switchModel('${model.path.replace(/'/g, "\\'")}', '${model.name.replace(/'/g, "\\\\'")}')"}>
            <div class="model-name">${model.name}</div>
            <div class="model-info">
                <span>${model.type}</span>
                <span>${model.size}</span>
                ${model.location ? `<span style="color: #666;">[${model.location}]</span>` : ''}
            </div>
            ${
              model.name === currentModel
                ? '<div style="margin-top: 8px; color: #10b981; font-size: 12px;">✓ Currently Active</div>'
                : '<div style="margin-top: 8px; display: flex; gap: 8px;"><button onclick="event.stopPropagation(); switchModel(\'' +
                  model.path.replace(/'/g, "\\'") +
                  "', '" +
                  model.name.replace(/'/g, "\\'") +
                  '\')" style="background: #4CAF50; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Load Model</button><button onclick="event.stopPropagation(); showQuantizeDialog(\'' +
                  model.path.replace(/'/g, "\\'") +
                  "', '" +
                  model.name.replace(/'/g, "\\'") +
                  '\')" style="background: #3B82F6; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Quantize</button><button onclick="event.stopPropagation(); deleteModel(\'' +
                  model.path.replace(/'/g, "\\'") +
                  "', '" +
                  model.name.replace(/'/g, "\\'") +
                  '\')" style="background: #ef4444; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button></div>'
            }
        </div>
    `
    )
    .join('');
}

// Switch model
async function switchModel(modelPath, modelName) {
  if (modelName === currentModel) {
    showInfo('This model is already running!');
    return;
  }

  if (!confirm(`Switch to ${modelName}?`)) return;

  showLoading('Switching model...', 'Starting llama.cpp server');

  try {
    const result = await window.electronAPI.switchModel(modelPath);

    if (result.success) {
      // Set the model immediately for UI responsiveness
      currentModel = modelName;
      updateStatus(true, `Running: ${modelName}`);
      displayModels(); // Refresh the model list display immediately
      hideLoading();
      showSuccess('Model switched successfully!');

      // Verify in background after a delay
      setTimeout(async () => {
        if (isShuttingDown) return;

        try {
          // Check if window still exists before making IPC call
          if (window && window.electronAPI) {
            const currentResult = await window.electronAPI.getCurrentModel();
            if (currentResult && currentResult.success && currentResult.model) {
              const actualModel = currentResult.model;
              if (actualModel !== currentModel) {
                // Update if different
                currentModel = actualModel;
                updateStatus(true, `Running: ${actualModel}`);
                displayModels();
              }
            }
          }
        } catch (error) {
          // Background verification failed - ignore
        }
      }, 3000);
    } else {
      hideLoading();
      showError('Failed to switch model: ' + result.error);
    }
  } catch (error) {
    hideLoading();
    showError('Switch model error: ' + error.message);
  }
}

// Delete model
async function deleteModel(modelPath, modelName) {
  if (!confirm(`Are you sure you want to delete ${modelName}?\n\nThis action cannot be undone.`))
    return;

  try {
    const result = await window.electronAPI.deleteModel(modelPath);

    if (result.success) {
      showSuccess('Model deleted successfully!');
      await refreshModels(); // Refresh the model list
    } else {
      showError('Failed to delete model: ' + result.error);
    }
  } catch (error) {
    showError('Delete error: ' + error.message);
  }
}

// Download model
async function downloadModel() {
  const urlInput = document.getElementById('modelUrl');
  if (!urlInput) return;

  const url = urlInput.value.trim();

  if (!url) {
    showInfo('Please paste a model URL first');
    return;
  }

  // Smart detection: HuggingFace URLs vs Ollama model names
  if (url.includes('huggingface.co')) {
    // Full HuggingFace URL
    await downloadHuggingFaceModel(url);
  } else if (url.includes('http')) {
    // Other URL - show error
    showError('Only HuggingFace URLs and Ollama model names are supported');
  } else {
    // Treat as Ollama model name (no http/https = model name)
    await downloadOllamaModel(url.trim());
  }
}

// Download HuggingFace model
async function downloadHuggingFaceModel(url) {
  showLoading('Downloading from HuggingFace...', 'This may take several minutes');

  try {
    const result = await window.electronAPI.downloadHuggingFace(url);
    if (result.success) {
      hideLoading();
      showSuccess('Model downloaded and converted successfully!');
      await refreshModels();
      const urlInput = document.getElementById('modelUrl');
      if (urlInput) urlInput.value = '';
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoading();
    showError('Download failed: ' + error.message);
  }
}

// Download Ollama model
async function downloadOllamaModel(modelName) {
  showLoading(`Downloading ${modelName} from Ollama...`, 'Pulling model');

  try {
    const result = await window.electronAPI.downloadOllama(modelName);
    if (result.success) {
      hideLoading();
      showSuccess('Ollama model downloaded successfully!');
      await refreshModels();
      const urlInput = document.getElementById('modelUrl');
      if (urlInput) urlInput.value = '';
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    hideLoading();
    showError('Download failed: ' + error.message);
  }
}

// Tab switching
function switchTab(tab, event) {
  activeTab = tab;

  // Update tab styles
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  } else {
    // If called programmatically, find the correct tab by content
    document.querySelectorAll('.tab').forEach(t => {
      if (
        (tab === 'huggingface' && t.textContent.includes('HuggingFace')) ||
        (tab === 'ollama' && t.textContent.includes('Ollama'))
      ) {
        t.classList.add('active');
      }
    });
  }

  // Update content
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabContent = document.getElementById(tab);
  if (tabContent) {
    tabContent.classList.add('active');
  }
}

// Setup webview listeners
function setupWebviewListeners() {
  const hfWebview = document.getElementById('hfWebview');
  const ollamaWebview = document.getElementById('ollamaWebview');

  if (hfWebview) {
    // Add crash handler
    hfWebview.addEventListener('crashed', () => {
      if (!isShuttingDown && hfWebview) {
        hfWebview.reload();
      }
    });

    hfWebview.addEventListener('destroyed', () => {
      // Webview was destroyed, don't try to access it
      return;
    });

    // Block new windows - keep everything in the webview
    hfWebview.addEventListener('new-window', e => {
      e.preventDefault();
      if (!isShuttingDown && hfWebview) {
        hfWebview.src = e.url;
      }
    });

    // Update URL input when navigating to model pages
    hfWebview.addEventListener('did-navigate', e => {
      if (!isShuttingDown && e.url.includes('huggingface.co/') && e.url.includes('/models/')) {
        const urlInput = document.getElementById('modelUrl');
        if (urlInput) {
          urlInput.value = e.url;
          updateUrlDisplay(e.url);
        }
      }
    });

    // Also listen for in-page navigation
    hfWebview.addEventListener('did-navigate-in-page', e => {
      if (!isShuttingDown && e.url.includes('huggingface.co/') && e.url.includes('/models/')) {
        const urlInput = document.getElementById('modelUrl');
        if (urlInput) {
          urlInput.value = e.url;
          updateUrlDisplay(e.url);
        }
      }
    });
  }

  if (ollamaWebview) {
    // Add crash handler
    ollamaWebview.addEventListener('crashed', () => {
      if (!isShuttingDown && ollamaWebview) {
        ollamaWebview.reload();
      }
    });

    ollamaWebview.addEventListener('destroyed', () => {
      // Webview was destroyed, don't try to access it
      return;
    });

    // Block new windows - keep everything in the webview
    ollamaWebview.addEventListener('new-window', e => {
      e.preventDefault();
      if (!isShuttingDown && ollamaWebview) {
        ollamaWebview.src = e.url;
      }
    });

    // Force light mode for Ollama webview - AGGRESSIVE WHITE BACKGROUND
    ollamaWebview.addEventListener('dom-ready', () => {
      // Super aggressive CSS to override EVERYTHING
      const whiteBackgroundCSS = `
                /* NUCLEAR OPTION - FORCE WHITE EVERYWHERE */
                *, *::before, *::after {
                    background-color: white !important;
                    background-image: none !important;
                    background: white !important;
                    filter: none !important;
                    backdrop-filter: none !important;
                    -webkit-filter: none !important;
                    color-scheme: light !important;
                }
                
                /* Target every possible element */
                html, body, #root, #app, #__next, .app, .App,
                div, main, section, header, footer, nav, aside, article,
                [class*="container"], [class*="wrapper"], [class*="layout"],
                [class*="page"], [class*="content"], [class*="view"] {
                    background-color: white !important;
                    background: white !important;
                    color: black !important;
                }
                
                /* Override dark theme classes with maximum specificity */
                html[class*="dark"], body[class*="dark"],
                [class*="dark"], [class*="Dark"], [class*="DARK"],
                [class*="black"], [class*="Black"], [class*="BLACK"],
                [class*="bg-black"], [class*="bg-gray"], [class*="bg-slate"],
                [class*="bg-zinc"], [class*="bg-neutral"], [class*="bg-stone"],
                [data-theme="dark"], [data-mode="dark"], [data-color-mode="dark"] {
                    background-color: white !important;
                    background: white !important;
                    background-image: none !important;
                }
                
                /* Override inline styles */
                [style*="background: #"], [style*="background:#"],
                [style*="background-color: #"], [style*="background-color:#"],
                [style*="background: rgb"], [style*="background:rgb"] {
                    background-color: white !important;
                    background: white !important;
                }
                
                /* Force text to be black */
                body, body *,
                p, h1, h2, h3, h4, h5, h6, span, div, section, article,
                li, td, th, label, input, textarea, select, code, pre {
                    color: black !important;
                }
                
                /* Links blue for visibility */
                a, a:visited, a:hover, a:active {
                    color: #0066cc !important;
                }
                
                /* Buttons visible */
                button, .button, [role="button"] {
                    background-color: #f0f0f0 !important;
                    color: black !important;
                    border: 1px solid #999 !important;
                }
                
                /* Remove overlays */
                [class*="overlay"], [class*="modal-backdrop"] {
                    display: none !important;
                }
                
                /* CSS Variables override */
                :root {
                    --background: white !important;
                    --foreground: black !important;
                    --bg-color: white !important;
                    --text-color: black !important;
                    --primary-bg: white !important;
                    --primary-color: black !important;
                    --dark: white !important;
                    --light: black !important;
                }
            `;

      // Inject the CSS
      ollamaWebview.insertCSS(whiteBackgroundCSS);

      // Also inject via JavaScript for extra insurance
      ollamaWebview.executeJavaScript(`
                (function() {
                    // Remove dark theme classes
                    document.documentElement.className = document.documentElement.className.replace(/dark|Dark|DARK/g, '');
                    document.body.className = document.body.className.replace(/dark|Dark|DARK/g, '');
                    
                    // Force inline styles
                    document.documentElement.style.cssText = 'background-color: white !important; background: white !important; color: black !important;';
                    document.body.style.cssText = 'background-color: white !important; background: white !important; color: black !important;';
                    
                    // Inject style tag
                    const style = document.createElement('style');
                    style.innerHTML = \`${whiteBackgroundCSS}\`;
                    style.id = 'force-white-bg';
                    document.head.appendChild(style);
                    
                    // Also inject at body level
                    const bodyStyle = document.createElement('style');
                    bodyStyle.innerHTML = \`${whiteBackgroundCSS}\`;
                    document.body.appendChild(bodyStyle);
                    
                    // Override meta tags
                    let metaTheme = document.querySelector('meta[name="theme-color"]');
                    if (!metaTheme) {
                        metaTheme = document.createElement('meta');
                        metaTheme.name = 'theme-color';
                        document.head.appendChild(metaTheme);
                    }
                    metaTheme.content = '#ffffff';
                    
                    let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
                    if (!metaColorScheme) {
                        metaColorScheme = document.createElement('meta');
                        metaColorScheme.name = 'color-scheme';
                        document.head.appendChild(metaColorScheme);
                    }
                    metaColorScheme.content = 'light';
                })();
            `);
    });

    // For Ollama, extract model name from URL
    ollamaWebview.addEventListener('did-navigate', e => {
      if (!isShuttingDown && e.url.includes('ollama.com/') && e.url.includes('/library/')) {
        const modelName = e.url.split('/library/')[1];
        if (modelName && !modelName.includes('/')) {
          const urlInput = document.getElementById('modelUrl');
          if (urlInput) {
            urlInput.value = modelName;
            updateUrlDisplay(e.url);
          }
        }
      }
    });
  }
}

// Update URL display with copy button
function updateUrlDisplay(url) {
  if (isShuttingDown) return;

  // Add a small URL display area if it doesn't exist
  let urlDisplay = document.getElementById('urlDisplay');
  if (!urlDisplay) {
    const browserContent = document.querySelector('.browser-content');
    if (!browserContent) return;

    urlDisplay = document.createElement('div');
    urlDisplay.id = 'urlDisplay';
    urlDisplay.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
            align-items: center;
            gap: 10px;
        `;
    browserContent.appendChild(urlDisplay);
  }

  urlDisplay.innerHTML = `
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${url}</span>
        <button onclick="copyToClipboard('${url}')" 
                style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
            Copy
        </button>
    `;
  urlDisplay.style.display = 'flex';

  // Hide after 5 seconds
  setTimeout(() => {
    if (urlDisplay && !isShuttingDown) {
      urlDisplay.style.display = 'none';
    }
  }, 5000);
}

// Copy to clipboard function
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showSuccess('URL copied to clipboard!');
    })
    .catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('URL copied to clipboard!');
    });
}

// Add HuggingFace model from current page
async function addHuggingFaceModel() {
  const hfWebview = document.getElementById('hfWebview');
  if (!hfWebview) {
    showError('HuggingFace webview not found');
    return;
  }

  try {
    const currentUrl = hfWebview.getURL ? hfWebview.getURL() : hfWebview.src;

    // Check if we're on a model page (either /models/ or direct model repo)
    if (!currentUrl.includes('huggingface.co/')) {
      showError('Please navigate to a HuggingFace page first');
      return;
    }

    // Accept both /models/ pages and direct model repository pages
    const isModelPage =
      currentUrl.includes('/models/') ||
      (currentUrl.match(/huggingface\.co\/[^\/]+\/[^\/]+\/?$/) &&
        !currentUrl.includes('/datasets/') &&
        !currentUrl.includes('/spaces/'));

    if (!isModelPage) {
      showError('Please navigate to a specific model page on HuggingFace first');
      return;
    }

    // Auto-populate the URL field and trigger download
    const urlInput = document.getElementById('modelUrl');
    if (urlInput) {
      urlInput.value = currentUrl;
    }
    showSuccess('URL captured! Starting download...');

    // Switch to HuggingFace tab if not already there
    if (activeTab !== 'huggingface') {
      switchTab('huggingface');
    }

    // Trigger download
    await downloadHuggingFaceModel(currentUrl);
  } catch (error) {
    showError('Failed to get current URL: ' + error.message);
  }
}

// Add Ollama model from current page
async function addOllamaModel() {
  const ollamaWebview = document.getElementById('ollamaWebview');
  if (!ollamaWebview) {
    showError('Ollama webview not found');
    return;
  }

  try {
    const currentUrl = ollamaWebview.getURL ? ollamaWebview.getURL() : ollamaWebview.src;

    // Extract model name from Ollama URL
    let modelName = '';
    if (currentUrl.includes('ollama.com/') && currentUrl.includes('/library/')) {
      modelName = currentUrl.split('/library/')[1];
      // Remove any trailing slashes or query parameters
      if (modelName.includes('/')) {
        modelName = modelName.split('/')[0];
      }
      if (modelName.includes('?')) {
        modelName = modelName.split('?')[0];
      }
    }

    if (!modelName) {
      showError('Please navigate to a specific model page on Ollama first');
      return;
    }

    // Auto-populate the URL field with model name and trigger download
    const urlInput = document.getElementById('modelUrl');
    if (urlInput) {
      urlInput.value = modelName;
    }
    showSuccess(`Model name captured: ${modelName}! Starting download...`);

    // Switch to Ollama tab if not already there
    if (activeTab !== 'ollama') {
      switchTab('ollama');
    }

    // Trigger download
    await downloadOllamaModel(modelName);
  } catch (error) {
    showError('Failed to get current URL: ' + error.message);
  }
}

// UI Helper functions
function updateStatus(active, text) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  if (indicator) {
    indicator.classList.toggle('active', active);
  }
  if (statusText) {
    statusText.textContent = text;
  }
}

function showLoading(text, subtext = '') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  const loadingSubtext = document.getElementById('loadingSubtext');
  const progressBar = document.getElementById('progressBar');

  if (loadingText) loadingText.textContent = text;
  if (loadingSubtext) loadingSubtext.textContent = subtext;
  if (progressBar) progressBar.style.width = '0%';
  if (overlay) overlay.classList.add('active');
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

function updateLoadingText(text) {
  const loadingSubtext = document.getElementById('loadingSubtext');
  if (loadingSubtext) loadingSubtext.textContent = text;
}

function updateProgress(percentage) {
  const progressBar = document.getElementById('progressBar');
  if (progressBar) progressBar.style.width = percentage + '%';
}

// Better notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;

  // Set color based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b',
  };
  notification.style.backgroundColor = colors[type] || colors.info;

  // Add icon
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };
  notification.innerHTML = `${icons[type] || ''} ${message}`;

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  });

  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showInfo(message) {
  showNotification(message, 'info');
}

function showWarning(message) {
  showNotification(message, 'warning');
}

// Expose functions to window for onclick handlers
window.refreshModels = refreshModels;
window.addHuggingFaceModel = addHuggingFaceModel;
window.addOllamaModel = addOllamaModel;
window.downloadModel = downloadModel;
window.switchModel = switchModel;
window.deleteModel = deleteModel;
window.switchTab = switchTab;
window.selectLlamaCppPath = selectLlamaCppPath;
window.installLlamaCpp = installLlamaCpp;
window.closeLlamaCppDialog = closeLlamaCppDialog;
window.showQuantizeDialog = showQuantizeDialog;
window.closeQuantizeDialog = closeQuantizeDialog;
window.startQuantization = startQuantization;
window.copyToClipboard = copyToClipboard;
