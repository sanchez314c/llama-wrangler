# 📚 Llama Wrangler Documentation Index

Welcome to the comprehensive documentation for Llama Wrangler, the universal LLM model manager.

## 🚀 Quick Start

### New Users
- [**README.md**](../README.md) - Project overview, installation, and basic usage
- [**Installation Guide**](../README.md#-installation) - Step-by-step setup instructions
- [**Quick Start Tutorial**](../README.md#-quick-start-one-command-build--run) - Get started in minutes

### Developers
- [**DEVELOPMENT.md**](DEVELOPMENT.md) - Complete development setup and architecture guide
- [**CLAUDE.md**](../CLAUDE.md) - AI assistant development guidance

## 📖 Core Documentation

### User Documentation

#### **[README.md](../README.md)**
- 🦙 Project introduction and features
- 🚀 Installation and quick start
- 📸 Screenshots and visual guide
- 🔧 Configuration and troubleshooting
- 📁 Project structure overview

#### **[CONTRIBUTING.md](../CONTRIBUTING.md)**
- 🤝 Contribution guidelines
- 📋 Development workflow
- 🔍 Code review process
- 📧 Getting help

#### **[SECURITY.md](../SECURITY.md)**
- 🔒 Security policy
- 🐛 Vulnerability reporting
- 🛡️ Security best practices
- 📢 Security announcements

#### **[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)**
- 📜 Community guidelines
- 😊 Expected behavior
- ⚖️ Enforcement policy
- 📞 Contact information

### Developer Documentation

#### **[DEVELOPMENT.md](DEVELOPMENT.md)**
- 🏗️ Architecture overview
- 🧪 Testing strategies
- 🐛 Debugging guide
- 🔧 Configuration options
- 📦 Build process details
- 🎨 UI development
- 🔌 Plugin system
- 📊 Performance optimization

#### **[CLAUDE.md](../CLAUDE.md)**
- 🤖 AI assistant development guide
- 🎯 Project-specific instructions
- 🔧 Development commands reference
- 🏗️ Architecture patterns
- 🔒 Security considerations
- 📋 Quick reference

### Technical Documentation

#### **[TECHSTACK.md](../techstack.md)**
- 🛠️ Technology stack overview
- 📦 Dependencies and versions
- 🔧 Development tools
- 🏗️ Build system details

#### **[CHANGELOG.md](../CHANGELOG.md)**
- 📋 Version history
- ✅ New features
- 🐛 Bug fixes
- 💥 Breaking changes
- 🔄 Migration guides

## 🔧 API Reference

### Main Process API
- **Application Lifecycle** - Window management, startup, shutdown
- **Model Management** - Loading, unloading, switching models
- **Server Management** - llama.cpp server control
- **File Operations** - Download, conversion, cleanup
- **IPC Communication** - Main-renderer messaging

### Renderer Process API
- **UI Components** - Model library, download interface
- **Event Handling** - User interactions, state management
- **WebView Integration** - Browser control, URL extraction
- **Progress Tracking** - Download and conversion progress

### Python Scripts API
- **HuggingFace Downloader** - Model download and conversion
- **Ollama Manager** - Ollama model operations
- **Format Conversion** - GGUF conversion utilities

## 🎯 Use Case Guides

### For Users
- **[Beginner's Guide](../README.md#-usage)** - First-time setup and basic model management
- **[Model Download Guide](../README.md#-downloading-models)** - Downloading from HuggingFace and Ollama
- **[Troubleshooting Guide](../README.md#-troubleshooting)** - Common issues and solutions
- **[Configuration Guide](../README.md#-configuration)** - Customizing settings and directories

### For Developers
- **[Development Setup](DEVELOPMENT.md#-development-environment-setup)** - Getting started with development
- **[Architecture Guide](DEVELOPMENT.md#-architecture-overview)** - Understanding the codebase structure
- **[Testing Guide](DEVELOPMENT.md#-testing)** - Writing and running tests
- **[Debugging Guide](DEVELOPMENT.md#-debugging)** - Troubleshooting development issues

### For Advanced Users
- **[Performance Optimization](DEVELOPMENT.md#-performance-optimization)** - Maximizing efficiency
- **[Security Configuration](DEVELOPMENT.md#-security-considerations)** - Hardening your installation
- **[Custom Builds](DEVELOPMENT.md#-build-process)** - Building for specific platforms

## 🏗️ Architecture Documentation

### System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Llama Wrangler                          │
├─────────────────────────────────────────────────────────────┤
│  Main Process (Node.js/Electron)                           │
│  ├── Application Lifecycle                                 │
│  ├── Window Management                                     │
│  ├── IPC Communication                                     │
│  ├── llama.cpp Server Management                           │
│  └── Python Script Execution                               │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (Browser Context)                        │
│  ├── UI Components (HTML/CSS/JS)                           │
│  ├── Model Library Interface                               │
│  ├── Download Management                                   │
│  └── WebView Integration                                   │
├─────────────────────────────────────────────────────────────┤
│  Python Scripts (Model Management)                         │
│  ├── HuggingFace Downloader                                │
│  ├── Ollama Model Manager                                  │
│  └── Format Conversion Utilities                           │
├─────────────────────────────────────────────────────────────┤
│  External Dependencies                                     │
│  ├── llama.cpp (Inference Engine)                          │
│  ├── HuggingFace Hub (Model Repository)                    │
│  └── Ollama (Model Distribution)                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow
1. **User Interaction** → Renderer Process
2. **Model Selection** → IPC Communication → Main Process
3. **Download Request** → Python Script → External API
4. **Model Conversion** → Python Script → llama.cpp
5. **Server Management** → Main Process → llama.cpp Server
6. **Model Loading** → Main Process → Renderer Process

## 🔍 Platform-Specific Documentation

### macOS
- **Installation**: DMG installer or manual build
- **Requirements**: macOS 10.15+, 4GB+ RAM
- **GPU Support**: Metal acceleration (Apple Silicon preferred)
- **Build Requirements**: Xcode Command Line Tools

### Windows
- **Installation**: MSI/EXE installer or manual build
- **Requirements**: Windows 10/11, 4GB+ RAM
- **GPU Support**: CUDA (NVIDIA) or CPU fallback
- **Build Requirements**: Visual Studio Build Tools

### Linux
- **Installation**: AppImage/DEB/RPM packages or source build
- **Requirements**: Modern Linux distribution, 4GB+ RAM
- **GPU Support**: CUDA (NVIDIA) or CPU fallback
- **Build Requirements**: GCC/Clang, development libraries

## 🧪 Testing Documentation

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: Component interaction testing
- **End-to-End Tests**: Complete workflow testing
- **Performance Tests**: Resource usage and timing
- **Security Tests**: Vulnerability scanning

### Test Environment Setup
```bash
# Install development dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## 📚 External Resources

### Official Documentation
- [Electron Documentation](https://www.electronjs.org/docs) - Cross-platform desktop framework
- [llama.cpp Repository](https://github.com/ggerganov/llama.cpp) - LLM inference engine
- [HuggingFace Documentation](https://huggingface.co/docs) - Model repository and APIs
- [Ollama Documentation](https://ollama.ai/docs) - Model distribution platform

### Community Resources
- [GitHub Issues](https://github.com/llamawrangler/llama-wrangler/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/llamawrangler/llama-wrangler/discussions) - Community discussions
- [Project Wiki](https://github.com/llamawrangler/llama-wrangler/wiki) - Community-maintained documentation

### Development Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) - Node.js development guidelines
- [Electron Security Checklist](https://www.electronjs.org/docs/tutorial/security) - Security best practices
- [Chrome DevTools](https://developer.chrome.com/docs/devtools) - Debugging and profiling tools

## 🔍 Finding Information

### By Role
- **End User**: Start with README.md → Installation → Usage → Troubleshooting
- **Developer**: Start with DEVELOPMENT.md → Architecture → Testing → Debugging
- **Contributor**: Start with CONTRIBUTING.md → Development Setup → Code Review → Security

### By Topic
- **Installation**: README.md → Platform-specific instructions
- **Development**: DEVELOPMENT.md → Architecture → API Reference
- **Troubleshooting**: README.md → Troubleshooting → SECURITY.md
- **Building**: DEVELOPMENT.md → Build Process → Performance

### By Issue Type
- **Bug Report**: Use GitHub Issue Template → Include environment details
- **Feature Request**: Use GitHub Issue Template → Describe use case
- **Security Issue**: Follow SECURITY.md → Private disclosure
- **Documentation**: Improve existing docs → Submit PR

## 📝 Contributing to Documentation

### Documentation Style
- **Clear and Concise**: Use simple language, avoid jargon
- **Well-Structured**: Use headings, lists, and code blocks
- **Examples**: Provide practical examples and code samples
- **Visual Aids**: Include diagrams, screenshots, and tables
- **Consistent**: Follow established formatting conventions

### How to Contribute
1. **Identify Improvement**: Find outdated or missing documentation
2. **Create Issue**: Open an issue describing the improvement needed
3. **Make Changes**: Update documentation following style guidelines
4. **Test Changes**: Verify instructions work correctly
5. **Submit PR**: Use pull request template for documentation changes

### Documentation Review
- **Accuracy**: Verify all information is correct
- **Completeness**: Ensure all necessary information is included
- **Clarity**: Check that explanations are easy to understand
- **Consistency**: Maintain consistent formatting and terminology
- **Accessibility**: Use alt text for images and proper heading structure

---

## 📞 Getting Help

If you can't find the information you need:

1. **Search Documentation**: Use this index to locate relevant sections
2. **Check GitHub Issues**: Look for similar questions or problems
3. **Start a Discussion**: Ask questions in GitHub Discussions
4. **Report Issues**: Use the issue templates for bugs or feature requests
5. **Contact Team**: Refer to SECURITY.md for security-related concerns

---

**Last Updated**: October 29, 2025
**Documentation Version**: 1.0.0
**Maintainers**: Llama Wrangler Team