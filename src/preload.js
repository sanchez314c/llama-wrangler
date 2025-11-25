const { contextBridge, ipcRenderer } = require('electron');

// FIX: Helper that registers a one-time-cleanup IPC listener.
// Calling the returned function removes the listener, preventing accumulation
// when the renderer hot-reloads or registers multiple times.
function makeListener(channel, callback) {
  const handler = (event, ...args) => callback(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Model management
  getModels: () => ipcRenderer.invoke('get-models'),
  getCurrentModel: () => ipcRenderer.invoke('get-current-model'),
  switchModel: modelPath => ipcRenderer.invoke('switch-model', modelPath),
  deleteModel: modelPath => ipcRenderer.invoke('delete-model', modelPath),
  quantizeModel: (modelPath, quantization) =>
    ipcRenderer.invoke('quantize-model', modelPath, quantization),

  // Downloads
  downloadHuggingFace: url => ipcRenderer.invoke('download-huggingface', url),
  downloadOllama: modelName => ipcRenderer.invoke('download-ollama', modelName),

  // System
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  installLlamaCpp: () => ipcRenderer.invoke('install-llamacpp'),
  selectLlamaCppPath: () => ipcRenderer.invoke('select-llamacpp-path'),
  getLlamaCppPath: () => ipcRenderer.invoke('get-llamacpp-path'),
  openExternal: url => ipcRenderer.invoke('open-external', url),

  // Event listeners — returns cleanup function to remove listener
  onServerLog: callback => makeListener('server-log', callback),
  onServerStopped: callback => makeListener('server-stopped', callback),
  onDownloadProgress: callback => makeListener('download-progress', callback),
  onDownloadPercentage: callback => makeListener('download-percentage', callback),
  onDownloadError: callback => makeListener('download-error', callback),
  onAppError: callback => makeListener('app-error', callback),
  onServerError: callback => makeListener('server-error', callback),
});
