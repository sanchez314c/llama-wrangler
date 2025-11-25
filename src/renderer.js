let currentModel = null;
let models = [];
let activeTab = 'huggingface';
let isShuttingDown = false;

// FIX: Escape HTML to prevent XSS when inserting user-controlled strings into innerHTML
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// FIX: Store model data in a map keyed by index so onclick handlers use safe integer index
// instead of embedding raw file paths into HTML onclick attributes (avoids XSS / path injection)
const modelDataStore = new Map();

// Cleanup functions for IPC event listeners
const listenerCleanups = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkDependencies();
    await refreshModels();

    // Setup webview listeners
    setupWebviewListeners();

    // Listen for server logs (silently handled)
    const cleanServerLog = window.electronAPI.onServerLog(() => {});
    listenerCleanups.push(cleanServerLog);

    // Listen for download progress
    const cleanProgress = window.electronAPI.onDownloadProgress(message => {
      if (!isShuttingDown) {
        updateLoadingText(message);
      }
    });
    listenerCleanups.push(cleanProgress);

    const cleanPercentage = window.electronAPI.onDownloadPercentage(percentage => {
      if (!isShuttingDown) {
        updateProgress(percentage);
      }
    });
    listenerCleanups.push(cleanPercentage);

    const cleanDownloadError = window.electronAPI.onDownloadError(error => {
      if (!isShuttingDown) {
        hideLoading();
        showError('Download failed: ' + escapeHtml(String(error)));
      }
    });
    listenerCleanups.push(cleanDownloadError);

    const cleanAppError = window.electronAPI.onAppError && window.electronAPI.onAppError(msg => {
      console.error('App error from main process:', msg);
    });
    if (cleanAppError) listenerCleanups.push(cleanAppError);

  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Handle window unload — cleanup IPC listeners to prevent accumulation
window.addEventListener('beforeunload', () => {
  isShuttingDown = true;
  for (const cleanup of listenerCleanups) {
    try { cleanup(); } catch (e) { /* ignore */ }
  }
  listenerCleanups.length = 0;
});

// Check dependencies and update llama.cpp card
async function checkDependencies() {
  try {
    const result = await window.electronAPI.checkDependencies();
    const llamaStatusText = document.getElementById('llamaStatusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusTextWelcome = document.getElementById('statusText');
    const utilizationPercent = document.getElementById('utilizationPercent');

    if (result.success) {
      const { checks } = result;
      if (checks.llamaCpp) {
        if (llamaStatusText) llamaStatusText.textContent = 'Installed';
        if (statusIndicator) statusIndicator.classList.remove('error');
        if (statusTextWelcome) statusTextWelcome.textContent = 'Ready';
        if (utilizationPercent) utilizationPercent.textContent = 'Ready';
      } else {
        if (llamaStatusText) llamaStatusText.textContent = 'Not Found';
        if (statusIndicator) { statusIndicator.style.background = 'var(--error)'; statusIndicator.style.boxShadow = '0 0 8px var(--error)'; }
        if (statusTextWelcome) statusTextWelcome.textContent = 'Not Found';
        if (utilizationPercent) utilizationPercent.textContent = 'Missing';
        const warningBanner = document.getElementById('warningBanner');
        if (warningBanner) warningBanner.classList.add('visible');
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
        background: var(--gradient-card);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-card);
        padding: 30px;
        z-index: 1000;
        max-width: 500px;
        box-shadow: var(--shadow-xl);
        backdrop-filter: blur(var(--blur-glass));
    `;

  dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: var(--text-heading);">llama.cpp Not Found</h2>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            llama.cpp is required to run models. You can either select an existing installation
            or install it automatically.
        </p>
        <div style="display: flex; gap: 10px; flex-direction: column;">
            <button onclick="selectLlamaCppPath()" style="
                background: var(--success);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 14px;
            ">
                Select Existing llama.cpp Directory
            </button>
            <button onclick="installLlamaCpp()" style="
                background: var(--accent-blue);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 14px;
            ">
                Install llama.cpp Automatically
            </button>
            <button onclick="closeLlamaCppDialog()" style="
                background: var(--text-muted);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 14px;
            ">
                Cancel
            </button>
        </div>
        <div id="current-path" style="margin-top: 20px; color: var(--text-dim); font-size: 12px;"></div>
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
        pathDiv.innerHTML = `Current path: <code style="background: #333; padding: 2px 6px; border-radius: 3px;">${escapeHtml(result.path)}</code>`;
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
        background: var(--bg-modal);
        backdrop-filter: blur(var(--blur-glass-heavy));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

  const content = document.createElement('div');
  content.style.cssText = `
        background: var(--gradient-card);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-card);
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: var(--shadow-xl);
    `;

  content.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: var(--text-heading);">Quantize Model</h2>
        <p style="color: var(--text-secondary); margin-bottom: 10px;">Model: <strong style="color: var(--text-primary);">${escapeHtml(modelName)}</strong></p>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Select quantization level. Lower quality = smaller file size.</p>
        <div id="quant-options" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            ${quantOptions
              .map(
                opt => `
                <label style="display: flex; align-items: center; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer;">
                    <input type="radio" name="quantization" value="${opt.value}" ${opt.value === 'Q4_K_M' ? 'checked' : ''} style="margin-right: 10px;">
                    <div style="flex: 1;">
                        <div style="color: var(--text-primary); font-weight: 500;">${opt.name}</div>
                        <div style="color: var(--text-dim); font-size: 12px;">Size: ${opt.size} of original</div>
                    </div>
                </label>
            `
              )
              .join('')}
        </div>
    `;

  // FIX: Create action buttons with DOM APIs + closures instead of inline onclick
  // strings that embed raw modelPath (XSS risk)
  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `background: var(--text-muted); color: white; border: none;
    padding: 10px 20px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px;`;
  cancelBtn.addEventListener('click', closeQuantizeDialog);

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start Quantization';
  startBtn.style.cssText = `background: var(--accent-blue); color: white; border: none;
    padding: 10px 20px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px;`;
  // Capture modelPath/modelName via closure — safe, no string interpolation
  startBtn.addEventListener('click', () => startQuantization(modelPath, modelName));

  actionRow.appendChild(cancelBtn);
  actionRow.appendChild(startBtn);
  content.appendChild(actionRow);

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
  // FIX: Guard against null (no radio checked) before accessing .value
  const checkedInput = document.querySelector('input[name="quantization"]:checked');
  if (!checkedInput) {
    showError('Please select a quantization level');
    return;
  }
  const selectedQuant = checkedInput.value;
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

// Display models as glass cards in sidebar
// FIX: Use data-index attributes instead of embedding raw paths into onclick strings
// This prevents XSS via maliciously-named model files
function displayModels() {
  const modelList = document.getElementById('modelList');
  if (!modelList) return;

  // Rebuild the data store
  modelDataStore.clear();

  if (models.length === 0) {
    modelList.innerHTML = `
            <div class="no-models">
                <div class="no-models-icon">&#x1F999;</div>
                <p>No models installed</p>
            </div>
        `;
    updateStats();
    return;
  }

  // Build DOM nodes directly instead of innerHTML with interpolated user data
  const fragment = document.createDocumentFragment();
  models.forEach((model, index) => {
    modelDataStore.set(index, model);

    const isActive = model.name === currentModel;
    const shortName = model.name.length > 20 ? model.name.substring(0, 18) + '\u2026' : model.name;

    const item = document.createElement('div');
    item.className = `model-item${isActive ? ' active' : ''}`;
    item.dataset.index = index;
    item.addEventListener('click', () => {
      const m = modelDataStore.get(index);
      if (m) showModelActions(m.path, m.name, m.name === currentModel);
    });

    const dot = document.createElement('div');
    dot.className = 'model-dot';

    const inner = document.createElement('div');
    inner.style.cssText = 'flex:1;min-width:0;';

    const nameEl = document.createElement('div');
    nameEl.className = 'model-name-sidebar';
    nameEl.textContent = shortName; // textContent is safe

    const metaEl = document.createElement('div');
    metaEl.className = 'model-meta-sidebar';
    metaEl.textContent = model.size || '';

    inner.appendChild(nameEl);
    inner.appendChild(metaEl);
    item.appendChild(dot);
    item.appendChild(inner);
    fragment.appendChild(item);
  });

  modelList.innerHTML = '';
  modelList.appendChild(fragment);

  updateStats();
}

// Show model action dialog (click on model card)
// FIX: Build dialog with DOM APIs and event listeners instead of innerHTML with
// interpolated paths — prevents XSS via maliciously-named model files
function showModelActions(modelPath, modelName, isActive) {
  const existingDialog = document.getElementById('model-actions-dialog');
  if (existingDialog) existingDialog.remove();

  const dialog = document.createElement('div');
  dialog.id = 'model-actions-dialog';
  dialog.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: var(--bg-modal); backdrop-filter: blur(var(--blur-glass-heavy));
    display: flex; align-items: center; justify-content: center; z-index: 1000;
  `;
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.remove(); });

  const content = document.createElement('div');
  content.style.cssText = `
    background: var(--gradient-card); border: 1px solid var(--glass-border);
    border-radius: var(--radius-card); padding: 30px; min-width: 320px;
    box-shadow: var(--shadow-xl);
  `;

  const title = document.createElement('h3');
  title.style.cssText = 'color: var(--text-heading); margin-bottom: 8px;';
  title.textContent = modelName; // textContent — safe

  const subtitle = document.createElement('p');
  subtitle.style.cssText = 'color: var(--text-dim); font-size: 12px; margin-bottom: 20px;';
  subtitle.textContent = isActive ? '\u2713 Currently Active' : 'Select an action';

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  const btnStyle = `border: none; padding: 12px 20px; border-radius: var(--radius-sm);
    cursor: pointer; font-size: 14px; font-weight: 500;`;

  if (!isActive) {
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load Model';
    loadBtn.style.cssText = `background: var(--success); color: white; ${btnStyle}`;
    loadBtn.addEventListener('click', () => {
      dialog.remove();
      switchModel(modelPath, modelName);
    });
    btnContainer.appendChild(loadBtn);
  }

  const quantizeBtn = document.createElement('button');
  quantizeBtn.textContent = 'Quantize';
  quantizeBtn.style.cssText = `background: var(--accent-blue); color: white; ${btnStyle}`;
  quantizeBtn.addEventListener('click', () => {
    dialog.remove();
    showQuantizeDialog(modelPath, modelName);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.style.cssText = `background: var(--error); color: white; ${btnStyle}`;
  deleteBtn.addEventListener('click', () => {
    dialog.remove();
    deleteModel(modelPath, modelName);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `background: var(--bg-card); color: var(--text-secondary);
    border: 1px solid var(--border-subtle); padding: 12px 20px;
    border-radius: var(--radius-sm); cursor: pointer; font-size: 14px;`;
  cancelBtn.addEventListener('click', () => dialog.remove());

  btnContainer.appendChild(quantizeBtn);
  btnContainer.appendChild(deleteBtn);
  btnContainer.appendChild(cancelBtn);

  content.appendChild(title);
  content.appendChild(subtitle);
  content.appendChild(btnContainer);
  dialog.appendChild(content);
  document.body.appendChild(dialog);
}

// Update dashboard stat cards
function updateStats() {
  const modelCount = models.length;

  // Model count in welcome card
  const modelCountEl = document.getElementById('modelCount');
  if (modelCountEl) modelCountEl.textContent = modelCount + ' installed';

  // Model count gauge
  const modelCountGaugeEl = document.getElementById('modelCountGauge');
  if (modelCountGaugeEl) modelCountGaugeEl.textContent = modelCount;

  // Active model in welcome card
  const activeModelEl = document.getElementById('activeModel');
  if (activeModelEl) {
    activeModelEl.textContent = currentModel ? currentModel : 'None';
  }

  // Storage calculation
  let totalGB = 0;
  for (const model of models) {
    if (model.size) {
      const match = model.size.match(/([\d.]+)\s*(GB|MB|KB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === 'GB') totalGB += val;
        else if (unit === 'MB') totalGB += val / 1024;
        else if (unit === 'KB') totalGB += val / (1024 * 1024);
      }
    }
  }
  const storageTotalEl = document.getElementById('storageTotalText');
  const storageUsageEl = document.getElementById('storageUsageText');
  if (storageTotalEl) storageTotalEl.textContent = totalGB.toFixed(1) + ' GB used';
  if (storageUsageEl) storageUsageEl.textContent = totalGB.toFixed(1) + ' GB';
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

  // Update browser tab styles
  document.querySelectorAll('.browser-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.browser-tab').forEach(t => {
    if (
      (tab === 'huggingface' && t.textContent.includes('HuggingFace')) ||
      (tab === 'ollama' && t.textContent.includes('Ollama'))
    ) {
      t.classList.add('active');
    }
  });

  // Update nav item styles
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (event && event.target) {
    const navItem = event.target.closest('.nav-item');
    if (navItem) navItem.classList.add('active');
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

  // FIX: Build with DOM APIs instead of innerHTML with interpolated URL (XSS risk)
  urlDisplay.innerHTML = '';

  const urlSpan = document.createElement('span');
  urlSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
  urlSpan.textContent = url; // textContent — safe

  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.style.cssText = 'background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;';
  copyBtn.addEventListener('click', () => copyToClipboard(url));

  urlDisplay.appendChild(urlSpan);
  urlDisplay.appendChild(copyBtn);
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
        top: 32px;
        right: 32px;
        padding: 16px 24px;
        border-radius: var(--radius-card);
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        backdrop-filter: blur(var(--blur-glass));
        border: 1px solid var(--glass-border);
    `;

  // Set color based on type
  const colors = {
    success: 'linear-gradient(135deg, #10b981, #0d9488)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
  };
  notification.style.background = colors[type] || colors.info;

  // FIX: Use textContent instead of innerHTML to prevent XSS in notification messages
  const icons = {
    success: '\u2705',
    error: '\u274C',
    info: '\u2139\uFE0F',
    warning: '\u26A0\uFE0F',
  };
  const iconSpan = document.createElement('span');
  iconSpan.textContent = (icons[type] || '') + ' ';
  const msgSpan = document.createElement('span');
  msgSpan.textContent = message;
  notification.appendChild(iconSpan);
  notification.appendChild(msgSpan);

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

// ═══════════════════════════════════════════════════════════════
// ABOUT MODAL
// ═══════════════════════════════════════════════════════════════

function openAboutModal() {
  const overlay = document.getElementById('aboutOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeAboutModal() {
  const overlay = document.getElementById('aboutOverlay');
  if (overlay) overlay.classList.remove('active');
}

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAboutModal();
});

// Close on overlay click
document.getElementById('aboutOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAboutModal();
});

// GitHub badge — open in external browser with protocol validation
document.getElementById('aboutGithubLink')?.addEventListener('click', e => {
  e.preventDefault();
  const url = 'https://github.com/sanchez314c/llama-wrangler';
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
});

window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;

// ═══════════════════════════════════════════════════════════════
// STATUS BAR UPDATER
// ═══════════════════════════════════════════════════════════════

function updateStatusBar() {
  const dot = document.getElementById('statusBarDot');
  const text = document.getElementById('statusBarText');
  const items = document.getElementById('statusBarItems');
  const count = models ? models.length : 0;

  if (dot) dot.classList.toggle('offline', !currentModel && count === 0);
  if (text) text.textContent = currentModel ? `Status: Active` : 'Status: Ready';
  if (items) items.textContent = count + ' model' + (count !== 1 ? 's' : '');
}

// Patch updateStats to also update status bar
const _origUpdateStats = updateStats;
function updateStats() {
  _origUpdateStats();
  updateStatusBar();
}
window.updateStats = updateStats;
window.showModelActions = showModelActions;
