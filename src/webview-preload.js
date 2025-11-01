// Webview preload script for Llama Wrangler
// Handles navigation and security for embedded browsers

// Override window.open to prevent popups
window.open = url => {
  // Send to main process to open in default browser
  return null;
};

// Add custom CSS based on the site
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  const currentUrl = window.location.href;

  // Apply different styles based on the website
  if (currentUrl.includes('ollama.com')) {
    // Force white background for Ollama
    style.textContent = `
            /* Force white background for Ollama */
            body, html {
                background-color: white !important;
                background: white !important;
                filter: none !important;
            }
            
            /* Hide unnecessary elements */
            .signup-prompt-bg,
            .signup-wall,
            [data-testid="signup-wall"] {
                display: none !important;
            }
        `;
  } else {
    // Keep dark theme for HuggingFace
    style.textContent = `
            /* Dark theme adjustments for HuggingFace */
            body {
                filter: brightness(0.9);
            }
            
            /* Hide unnecessary elements */
            .signup-prompt-bg,
            .signup-wall,
            [data-testid="signup-wall"] {
                display: none !important;
            }
            
            /* Improve readability */
            * {
                scrollbar-width: thin;
                scrollbar-color: #4a4a4a #1a1a1a;
            }
            
            *::-webkit-scrollbar {
                width: 8px;
            }
            
            *::-webkit-scrollbar-track {
                background: #1a1a1a;
            }
            
            *::-webkit-scrollbar-thumb {
                background-color: #4a4a4a;
                border-radius: 4px;
            }
        `;
  }
  document.head.appendChild(style);
});

// Webview preload script loaded
