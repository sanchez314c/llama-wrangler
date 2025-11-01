const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
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

  // Event listeners
  onServerLog: callback => {
    ipcRenderer.on('server-log', (event, data) => callback(data));
  },

  onServerStopped: callback => {
    ipcRenderer.on('server-stopped', (event, code) => callback(code));
  },

  onDownloadProgress: callback => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },

  onDownloadPercentage: callback => {
    ipcRenderer.on('download-percentage', (event, percentage) => callback(percentage));
  },

  onDownloadError: callback => {
    ipcRenderer.on('download-error', (event, error) => callback(error));
  },
});
