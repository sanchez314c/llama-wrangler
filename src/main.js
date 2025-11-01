const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const os = require('os');
const Store = require('electron-store').default || require('electron-store');

const store = new Store();

let mainWindow;
let activeServerProcess = null;
const activeDownloadProcesses = new Set(); // Track all active downloads

// Configuration - now properly user-agnostic
const CONFIG = {
  modelsDir: path.join(os.homedir(), '.llama-wrangler', 'models'),
  llamaCppDir: store.get('llamaCppPath', path.join(os.homedir(), '.llama-wrangler', 'llama.cpp')),
  metalLlamaDir: path.join(os.homedir(), '.METALlama.cpp'), // User-agnostic path
  port: store.get('port', 7070),
  defaultQuant: store.get('defaultQuant', 'Q4_K_M'),
};

// Update llama.cpp path in CONFIG when changed
function updateLlamaCppPath(newPath) {
  store.set('llamaCppPath', newPath);
  CONFIG.llamaCppDir = newPath;
}

// Ensure directories exist
async function ensureDirectories() {
  await fs.mkdir(CONFIG.modelsDir, { recursive: true });
  await fs.mkdir(path.dirname(CONFIG.llamaCppDir), { recursive: true });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
    backgroundColor: '#0f0f0f',
    icon: path.join(__dirname, '..', 'resources', 'icons', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Clean up on window close
  mainWindow.on('closed', () => {
    // Clean up all active processes
    cleanupAllProcesses();
    mainWindow = null;
  });

  // Better webview crash handling
  mainWindow.webContents.on('crashed', (event, killed) => {
    if (!killed && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  // Remove the unresponsive dialog that can destroy the window
  mainWindow.webContents.on('unresponsive', () => {
    logError(new Error('Main window became unresponsive'));
    // Don't show dialog, just log
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Cleanup all processes
function cleanupAllProcesses() {
  // Kill server process
  if (activeServerProcess && !activeServerProcess.killed) {
    try {
      activeServerProcess.kill('SIGTERM');
      setTimeout(() => {
        if (activeServerProcess && !activeServerProcess.killed) {
          activeServerProcess.kill('SIGKILL');
        }
      }, 1000);
    } catch (e) {
      logError(e);
    }
  }

  // Kill all download processes
  for (const proc of activeDownloadProcesses) {
    try {
      if (!proc.killed) {
        proc.kill('SIGTERM');
      }
    } catch (e) {
      logError(e);
    }
  }
  activeDownloadProcesses.clear();
}

app.whenReady().then(async () => {
  await ensureDirectories();
  createWindow();
});

// Simple error logging
function logError(error) {
  try {
    const errorLog = path.join(__dirname, 'error.log');
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${error.stack || error.toString()}\n`;
    fsSync.appendFileSync(errorLog, errorMessage);
  } catch (e) {
    // Even logging failed, ignore
  }
}

// Better error handling - don't return true
process.on('uncaughtException', error => {
  logError(error);

  // Send error to renderer if possible
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('app-error', error.message);
    } catch (e) {
      // Ignore send errors
    }
  }

  // Don't exit the process unless it's critical
  if (error.message.includes('EADDRINUSE') || error.message.includes('FATAL')) {
    app.quit();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(`Unhandled rejection: ${reason}`));

  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('app-error', reason.toString());
    } catch (e) {
      // Ignore send errors
    }
  }
});

// Proper app lifecycle
app.on('window-all-closed', () => {
  cleanupAllProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupAllProcesses();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers with better error handling

ipcMain.handle('get-models', async () => {
  try {
    const models = [];

    const metalLlamaModelsDir = path.join(CONFIG.metalLlamaDir, 'models');
    const modelDirs = [
      metalLlamaModelsDir,
      CONFIG.modelsDir,
      path.join(CONFIG.llamaCppDir, 'models'),
      CONFIG.llamaCppDir,
    ];

    for (const dir of modelDirs) {
      try {
        // Check if directory exists before trying to read
        await fs.access(dir);
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.gguf') && !file.includes('ggml-vocab')) {
            const fullPath = path.join(dir, file);

            if (models.some(m => m.path === fullPath)) continue;

            try {
              // Double-check file exists before trying to stat
              await fs.access(fullPath);
              const stats = await fs.stat(fullPath);
              const size = (stats.size / (1024 * 1024 * 1024)).toFixed(2);

              // Extract quantization type from filename
              const quantMatch = file.match(/[QF]\d+_[A-Z0-9_]+/);
              const quantType = quantMatch ? quantMatch[0] : 'GGUF';

              models.push({
                name: file,
                path: fullPath,
                size: `${size} GB`,
                type: quantType,
                location:
                  dir === metalLlamaModelsDir
                    ? 'MetalLlama'
                    : dir === CONFIG.modelsDir
                      ? 'Wrangler'
                      : 'llama.cpp',
                canSwitch: true,
              });
            } catch (statError) {
              // File doesn't exist or can't be accessed - skip silently
              console.log(`Skipping inaccessible file: ${fullPath}`);
              continue;
            }
          }
        }
      } catch (err) {
        // Directory doesn't exist or can't be read - this is normal
        console.log(`Skipping inaccessible directory: ${dir}`);
      }
    }

    models.sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, models };
  } catch (error) {
    // Don't show errors to UI for model scanning - just log them
    console.error('Model scanning error:', error);
    return { success: true, models: [] }; // Return empty array instead of error
  }
});

ipcMain.handle('get-current-model', async () => {
  return new Promise(resolve => {
    exec(`lsof -ti:${CONFIG.port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ success: true, model: null });
        return;
      }

      const pid = stdout.trim();
      exec(`ps aux | grep ${pid} | grep -E "llama-server.*-m"`, (error, stdout) => {
        if (error) {
          resolve({ success: true, model: null });
          return;
        }

        const match = stdout.match(/-m\s+([^\s]+)/);
        if (match) {
          const modelPath = match[1];
          const modelName = path.basename(modelPath);
          resolve({ success: true, model: modelName });
        } else {
          resolve({ success: true, model: null });
        }
      });
    });
  });
});

// Check if LaunchAgent exists (macOS only)
async function hasLaunchAgent() {
  if (process.platform !== 'darwin') return false;

  try {
    await fs.access(path.join(os.homedir(), 'Library/LaunchAgents/com.llama.mps.server.plist'));
    return true;
  } catch {
    return false;
  }
}

ipcMain.handle('switch-model', async (event, modelPath) => {
  try {
    // Check if using LaunchAgent
    const usingLaunchAgent = await hasLaunchAgent();

    if (usingLaunchAgent) {
      // Use LaunchAgent method
      const modelName = path.basename(modelPath);
      const metalLlamaModelsDir = path.join(CONFIG.metalLlamaDir, 'models');
      const targetPath = path.join(metalLlamaModelsDir, modelName);

      // Ensure model exists in MetalLlama directory
      if (modelPath !== targetPath) {
        try {
          await fs.access(targetPath);
        } catch {
          // Copy model to MetalLlama directory
          await fs.mkdir(metalLlamaModelsDir, { recursive: true });
          await fs.copyFile(modelPath, targetPath);
        }
      }

      // Update preference file
      const preferenceFile = path.join(os.homedir(), '.config/llama_mps_server/preferred_model');
      await fs.mkdir(path.dirname(preferenceFile), { recursive: true });
      await fs.writeFile(preferenceFile, modelName);

      // Restart LaunchAgent
      return new Promise((resolve, reject) => {
        exec(
          'launchctl kickstart -k gui/$(id -u)/com.llama.mps.server',
          (error, stdout, stderr) => {
            if (error) {
              // Fallback to stop/start
              exec(
                'launchctl stop com.llama.mps.server && sleep 2 && launchctl start com.llama.mps.server',
                error2 => {
                  if (error2) {
                    reject(new Error('Failed to restart LaunchAgent'));
                  } else {
                    setTimeout(() => resolve({ success: true }), 3000);
                  }
                }
              );
            } else {
              setTimeout(() => resolve({ success: true }), 3000);
            }
          }
        );
      });
    }

    // Standard method - stop current server if running
    if (activeServerProcess && !activeServerProcess.killed) {
      activeServerProcess.kill();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Find llama-server executable
    const possiblePaths = [
      path.join(CONFIG.llamaCppDir, 'build/bin/llama-server'),
      path.join(CONFIG.llamaCppDir, 'build/bin/server'),
      path.join(CONFIG.llamaCppDir, 'llama-server'),
      path.join(CONFIG.llamaCppDir, 'server'),
      path.join(CONFIG.metalLlamaDir, 'build/bin/llama-server'),
      path.join(CONFIG.metalLlamaDir, 'build/bin/server'),
    ];

    let serverPath = null;
    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        serverPath = p;
        break;
      } catch {}
    }

    if (!serverPath) {
      throw new Error(
        'llama-server executable not found. Please ensure llama.cpp is built properly.'
      );
    }

    // Start new server
    const args = [
      '-m',
      modelPath,
      '--port',
      CONFIG.port.toString(),
      '--host',
      '0.0.0.0',
      '-c',
      '8192',
    ];

    // Add GPU layers based on platform
    if (process.platform === 'darwin') {
      args.push('-ngl', '999'); // Use Metal on macOS
    } else if (process.platform === 'linux') {
      // Check for CUDA
      try {
        await fs.access('/usr/local/cuda/bin/nvcc');
        args.push('-ngl', '999'); // Use CUDA if available
      } catch {
        // CPU only
      }
    }

    activeServerProcess = spawn(serverPath, args);

    activeServerProcess.stdout.on('data', data => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('server-log', data.toString());
        } catch (e) {
          // Ignore send errors
        }
      }
    });

    activeServerProcess.stderr.on('data', data => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('server-log', data.toString());
        } catch (e) {
          // Ignore send errors
        }
      }
    });

    activeServerProcess.on('error', error => {
      logError(error);
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('server-error', error.message);
        } catch (e) {
          // Ignore send errors
        }
      }
    });

    activeServerProcess.on('close', code => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        try {
          mainWindow.webContents.send('server-stopped', code);
        } catch (e) {
          // Ignore send errors
        }
      }
      activeServerProcess = null;
    });

    // Wait for server to be ready
    let serverReady = false;
    const maxAttempts = 30;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const http = require('http');
        const testReady = await new Promise(resolve => {
          const req = http.get(`http://localhost:${CONFIG.port}/v1/models`, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                resolve(json && (json.object === 'list' || json.data));
              } catch {
                resolve(false);
              }
            });
          });
          req.on('error', () => resolve(false));
          req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
          });
        });

        if (testReady) {
          serverReady = true;
          break;
        }
      } catch {
        // Keep trying
      }
    }

    if (!serverReady) {
      throw new Error('Server failed to start. Check the console for error messages.');
    }

    return { success: true };
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-huggingface', async (event, url) => {
  try {
    const cleanUrl = url.split('?')[0];
    const modelId = cleanUrl.replace('https://huggingface.co/', '');

    return new Promise((resolve, reject) => {
      // In production, scripts are in the resources folder
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'download_hf.py')
        : path.join(__dirname, '..', 'scripts', 'download_hf.py');

      const downloadProcess = spawn('python3', [
        scriptPath,
        modelId,
        CONFIG.modelsDir,
        CONFIG.defaultQuant,
      ]);

      // Track this process
      activeDownloadProcesses.add(downloadProcess);

      let errorBuffer = '';

      downloadProcess.stdout.on('data', data => {
        const message = data.toString();
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('download-progress', message);
          } catch (e) {
            // Ignore send errors
          }
        }

        if (message.includes('Error:')) {
          errorBuffer += message;
        }

        const progressMatch = message.match(/(\d+)%/);
        if (progressMatch && mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('download-percentage', parseInt(progressMatch[1]));
          } catch (e) {
            // Ignore send errors
          }
        }
      });

      downloadProcess.stderr.on('data', data => {
        const errorMsg = data.toString();
        errorBuffer += errorMsg;

        if (
          errorMsg.includes('Error:') ||
          errorMsg.includes('Exception:') ||
          errorMsg.includes('Failed:')
        ) {
          const cleanError = errorMsg
            .replace(/.*Error:\s*/g, '')
            .replace(/.*Exception:\s*/g, '')
            .replace(/.*Failed:\s*/g, '')
            .split('\n')[0]
            .trim();

          if (cleanError && mainWindow && !mainWindow.isDestroyed()) {
            try {
              mainWindow.webContents.send('download-error', cleanError);
            } catch (e) {
              // Ignore send errors
            }
          }
        }
      });

      downloadProcess.on('close', async code => {
        // Remove from tracking
        activeDownloadProcesses.delete(downloadProcess);

        if (code === 0) {
          resolve({ success: true });
        } else {
          let errorMessage = `Download failed (exit code ${code})`;

          if (errorBuffer.includes('llama.cpp not found')) {
            errorMessage =
              'llama.cpp installation not found. Please ensure llama.cpp is installed at the configured path.';
          } else if (errorBuffer.includes('No compatible GGUF files')) {
            errorMessage =
              'No compatible pre-quantized GGUF files found. The app will download and convert the base model locally.';
          } else if (errorBuffer.includes('pip install')) {
            errorMessage =
              'Python dependencies are missing. Please install: pip install huggingface-hub tqdm';
          } else if (errorBuffer.includes('No such file or directory')) {
            errorMessage = 'Script not found. Please ensure the download script exists.';
          } else if (errorBuffer) {
            // Include the actual error buffer content for debugging
            errorMessage = `Download failed: ${errorBuffer.slice(0, 200)}`;
          }

          resolve({ success: false, error: errorMessage });
        }
      });

      downloadProcess.on('error', error => {
        activeDownloadProcesses.delete(downloadProcess);
        resolve({ success: false, error: `Failed to start download: ${error.message}` });
      });
    });
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-ollama', async (event, modelName) => {
  try {
    return new Promise((resolve, reject) => {
      // In production, scripts are in the resources folder
      const scriptPath = app.isPackaged
        ? path.join(process.resourcesPath, 'scripts', 'download_ollama.py')
        : path.join(__dirname, '..', 'scripts', 'download_ollama.py');

      const downloadProcess = spawn('python3', [
        scriptPath,
        modelName,
        CONFIG.modelsDir,
        CONFIG.defaultQuant,
      ]);

      // Track this process
      activeDownloadProcesses.add(downloadProcess);

      let errorBuffer = '';

      downloadProcess.stdout.on('data', data => {
        const message = data.toString();
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('download-progress', message);
          } catch (e) {
            // Ignore send errors
          }
        }

        if (message.includes('Error:')) {
          errorBuffer += message;
        }

        const progressMatch = message.match(/(\d+)%/);
        if (progressMatch && mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('download-percentage', parseInt(progressMatch[1]));
          } catch (e) {
            // Ignore send errors
          }
        }
      });

      downloadProcess.stderr.on('data', data => {
        const errorMsg = data.toString();
        errorBuffer += errorMsg;
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('download-error', errorMsg);
          } catch (e) {
            // Ignore send errors
          }
        }
      });

      downloadProcess.on('close', async code => {
        // Remove from tracking
        activeDownloadProcesses.delete(downloadProcess);

        if (code === 0) {
          resolve({ success: true });
        } else {
          let errorMessage = `Download failed (exit code ${code})`;

          if (errorBuffer.includes('not found')) {
            errorMessage = `Model '${modelName}' not found in Ollama registry. Please check the model name.`;
          } else if (errorBuffer.includes('pip install')) {
            errorMessage = 'Python dependencies are missing. Please install: pip install requests';
          }

          resolve({ success: false, error: errorMessage });
        }
      });

      downloadProcess.on('error', error => {
        activeDownloadProcesses.delete(downloadProcess);
        resolve({ success: false, error: `Failed to start download: ${error.message}` });
      });
    });
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    shell.openExternal(url);
  } catch (error) {
    logError(error);
  }
});

ipcMain.handle('check-dependencies', async () => {
  try {
    const checks = {
      llamaCpp: false,
      llamaCppPath: CONFIG.llamaCppDir,
      ollama: false,
      python: false,
    };

    // Check llama.cpp at various paths
    const possiblePaths = [
      CONFIG.llamaCppDir,
      CONFIG.metalLlamaDir,
      path.join(os.homedir(), 'llama.cpp'),
      '/usr/local/llama.cpp',
    ];

    for (const checkPath of possiblePaths) {
      try {
        await fs.access(path.join(checkPath, 'build', 'bin', 'llama-server'));
        checks.llamaCpp = true;
        checks.llamaCppPath = checkPath;
        break;
      } catch {
        // Try next path
      }
    }

    // Ollama is optional
    checks.ollama = true;

    // Check Python
    await new Promise(resolve => {
      exec('which python3', error => {
        checks.python = !error;
        resolve();
      });
    });

    return { success: true, checks };
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-llamacpp-path', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select llama.cpp Directory',
      message: 'Select the directory containing llama.cpp',
      buttonLabel: 'Select Directory',
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];

      // Verify it's a valid llama.cpp directory
      const possibleServerPaths = [
        path.join(selectedPath, 'build', 'bin', 'llama-server'),
        path.join(selectedPath, 'build', 'bin', 'server'),
        path.join(selectedPath, 'llama-server'),
        path.join(selectedPath, 'server'),
      ];

      let foundServer = false;
      for (const serverPath of possibleServerPaths) {
        try {
          await fs.access(serverPath);
          foundServer = true;
          break;
        } catch {
          // Try next
        }
      }

      if (foundServer) {
        updateLlamaCppPath(selectedPath);
        return { success: true, path: selectedPath };
      } else {
        return {
          success: false,
          error: 'Selected directory does not contain a built llama.cpp installation.',
        };
      }
    }

    return { success: false, error: 'No directory selected' };
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-llamacpp-path', async () => {
  return { success: true, path: CONFIG.llamaCppDir };
});

ipcMain.handle('install-llamacpp', async () => {
  try {
    return new Promise((resolve, reject) => {
      const installDir = path.dirname(CONFIG.llamaCppDir);
      const script =
        process.platform === 'win32'
          ? `cd ${installDir} && git clone https://github.com/ggerganov/llama.cpp.git && cd llama.cpp && cmake -B build && cmake --build build --config Release`
          : `cd ${installDir} && git clone https://github.com/ggerganov/llama.cpp.git && cd llama.cpp && make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)`;

      exec(script, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          reject({ success: false, error: stderr || error.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-model', async (event, modelPath) => {
  try {
    await fs.access(modelPath);
    await fs.unlink(modelPath);
    return { success: true };
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('quantize-model', async (event, modelPath, quantization) => {
  try {
    // Find quantize executable
    const possiblePaths = [
      path.join(CONFIG.llamaCppDir, 'build', 'bin', 'llama-quantize'),
      path.join(CONFIG.llamaCppDir, 'llama-quantize'),
      path.join(CONFIG.llamaCppDir, 'quantize'),
      path.join(CONFIG.metalLlamaDir, 'build', 'bin', 'llama-quantize'),
      path.join(CONFIG.metalLlamaDir, 'llama-quantize'),
    ];

    let quantizePath = null;
    for (const p of possiblePaths) {
      try {
        await fs.access(p);
        quantizePath = p;
        break;
      } catch {}
    }

    if (!quantizePath) {
      return {
        success: false,
        error: 'llama-quantize not found. Please ensure llama.cpp is properly installed.',
      };
    }

    const modelDir = path.dirname(modelPath);
    const modelName = path.basename(modelPath, '.gguf');
    const cleanName = modelName.replace(/-[QF]\d+_[A-Z0-9_]+$/, '');
    const outputPath = path.join(modelDir, `${cleanName}-${quantization}.gguf`);

    try {
      await fs.access(outputPath);
      return { success: false, error: `Model with ${quantization} quantization already exists` };
    } catch {
      // Good, output doesn't exist
    }

    return new Promise(resolve => {
      const args = [modelPath, outputPath, quantization];

      const env = Object.assign({}, process.env);
      if (process.platform === 'darwin') {
        env.DYLD_LIBRARY_PATH = path.join(path.dirname(quantizePath), '..');
      } else if (process.platform === 'linux') {
        env.LD_LIBRARY_PATH = path.join(path.dirname(quantizePath), '..');
      }

      const quantizeProcess = spawn(quantizePath, args, { env });

      // Track this process
      activeDownloadProcesses.add(quantizeProcess);

      let output = '';
      let errorOutput = '';

      quantizeProcess.stdout.on('data', data => {
        output += data.toString();
      });

      quantizeProcess.stderr.on('data', data => {
        errorOutput += data.toString();
      });

      quantizeProcess.on('close', async code => {
        // Remove from tracking
        activeDownloadProcesses.delete(quantizeProcess);

        if (code === 0) {
          try {
            await fs.access(outputPath);
            // Optionally delete the original
            const deleteOriginal = store.get('deleteOriginalAfterQuantize', false);
            if (deleteOriginal) {
              await fs.unlink(modelPath);
            }
            resolve({ success: true });
          } catch (error) {
            resolve({ success: false, error: 'Quantization completed but output file not found' });
          }
        } else {
          const errorMsg = errorOutput || output || 'Unknown error';
          resolve({ success: false, error: `Quantization failed: ${errorMsg}` });
        }
      });

      quantizeProcess.on('error', error => {
        activeDownloadProcesses.delete(quantizeProcess);
        resolve({ success: false, error: `Failed to start quantization: ${error.message}` });
      });
    });
  } catch (error) {
    logError(error);
    return { success: false, error: error.message };
  }
});
