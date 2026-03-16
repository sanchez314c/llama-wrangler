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

            /* Themed scrollbar */
            * {
                scrollbar-width: thin;
                scrollbar-color: #2a2a32 transparent;
            }

            *::-webkit-scrollbar {
                width: 6px;
            }

            *::-webkit-scrollbar-track {
                background: transparent;
            }

            *::-webkit-scrollbar-thumb {
                background-color: #2a2a32;
                border-radius: 3px;
            }

            *::-webkit-scrollbar-thumb:hover {
                background-color: #3a3a44;
            }
        `;
  }
  document.head.appendChild(style);
});
