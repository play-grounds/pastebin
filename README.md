# 📋 Decentralized Pastebin

A modern, privacy-focused pastebin application built on the **Nostr protocol** with advanced cloud storage capabilities. Share code snippets, text, and documents with complete data ownership and privacy, featuring seamless synchronization across devices through decentralized storage providers.

![Pastebin Preview](https://img.shields.io/badge/Built%20with-Nostr-purple?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)

## ✨ Key Features

### 🔐 **Decentralized Authentication**

- **Nostr Extension Support**: Compatible with browser extensions like nos2x and Alby
- **Private Key Login**: Direct private key authentication for advanced users
- **URL Hash Login**: Quick access via URL fragment for testing and development

### ☁️ **Advanced Storage Architecture**

- **DID Document Discovery**: Automatically discovers custom storage endpoints from nostr.social
- **Smart Fallbacks**: Gracefully degrades from custom storage → nosdav.net → localStorage
- **JSON-LD Schema**: Semantic paste structure with proper metadata

### 📝 **Rich Text Management**

- **Syntax Highlighting**: Support for 20+ programming languages with highlight.js
- **Multi-Language Support**: JavaScript, Python, Java, C++, HTML, CSS, SQL, and more
- **Live Preview**: Real-time syntax highlighting in view mode
- **Search & Filter**: Find pastes by title or content

### 🔗 **Sharing & Export**

- **URL Sharing**: Generate shareable links for any paste
- **File Export**: Download pastes as text files
- **Copy to Clipboard**: One-click URL copying
- **Persistent Links**: Pastes remain accessible via direct URLs

### 🎨 **Modern UI/UX**

- **Clean Interface**: Minimalist design focused on content
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Code Themes**: GitHub-style syntax highlighting
- **Intuitive Navigation**: Easy switching between create, edit, and list views

## 🚀 Quick Start

### Option 1: Direct Browser Usage

1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. Login with your Nostr extension or private key
4. Start creating and sharing your pastes!

### Option 2: GitHub Pages (Live Demo)

Visit the live demo: [Pastebin Demo](https://your-username.github.io/pastebin)

### Option 3: Custom Storage Location

Access with specific storage URI:

```
pastebin.html?paste=your-paste-id
```

## 🔧 Technology Stack

- **Frontend Framework**: Vanilla JavaScript with Preact components
- **UI Library**: Preact 10.13.1 with HTM for JSX-like syntax
- **Styling**: TailwindCSS with custom CSS variables
- **Syntax Highlighting**: Highlight.js with GitHub theme
- **Storage Protocol**: Nosdav (Nostr-based WebDAV)
- **Authentication**: Nostr protocol with secp256k1 cryptography
- **Dependencies**: All loaded from CDN (no build process required)

## 🏗️ Architecture Overview

### Storage Layer

```
DID Discovery → Custom Storage → nosdav.net → localStorage
```

1. **DID Document Fetching**: Queries nostr.social for custom storage endpoints
2. **Smart URL Building**: Constructs storage URLs with proper authentication
3. **Graceful Fallbacks**: Multiple fallback levels ensure data availability

### Authentication Flow

```
URL Hash → Nostr Extension → Private Key Input → Storage Access
```

### Component Structure

- `index.js`: Main PastebinApp component with state management
- `navbar.js`: Authentication and navigation component
- `storage-config.js`: Centralized storage configuration with DID discovery
- `nosdav-shim.js`: Fetch interceptor for Nostr authentication headers

## 📁 File Structure

```
pastebin/
├── index.html             # Main entry point with styling
├── index.js               # Core application logic
├── navbar.js              # Navigation and authentication
├── storage-config.js      # Storage discovery and URL building
├── nosdav-shim.js         # Fetch interceptor for Nostr auth
├── package.json           # Package configuration
├── LICENSE                # MIT License
└── README.md              # This file
```

## 🔐 Authentication Methods

### 1. Nostr Browser Extension

The recommended method for regular users:

- Install a Nostr extension (nos2x, Alby, etc.)
- Click "Sign In"
- Grant permission for the app to access your identity

### 2. Private Key Login

For advanced users who manage their own keys:

- Enter your 64-character hex private key
- Key is stored locally and used for authentication
- **Warning**: Only use on trusted devices

### 3. URL Hash Login (Testing)

Quick access for development and testing:

```
pastebin.html#your-64-character-private-key-here
```

The hash is automatically removed from the URL for privacy.

## 🗄️ Storage Configuration

### DID-Based Storage Discovery

The app automatically discovers your custom storage provider:

1. Fetches your DID document from `nostr.social/.well-known/did/nostr/{pubkey}.json`
2. Looks for `Storage` service type in the service array
3. Uses the `serviceEndpoint` as your storage root
4. Falls back to `nosdav.net` if no custom storage is found

## 📊 Data Format

### Paste Structure

```json
{
  "@context": {
    "Paste": "https://schema.org/CreativeWork",
    "title": "https://schema.org/name",
    "content": "https://schema.org/text"
  },
  "@type": "Paste",
  "@id": "paste-123",
  "title": "Example Code Snippet",
  "content": "console.log('Hello, World!');",
  "language": "javascript",
  "created": "2025-01-27T10:30:00Z",
  "updated": "2025-01-27T10:35:00Z"
}
```

### Collection Metadata

```json
{
  "@context": {
    "Paste": "https://schema.org/CreativeWork",
    "title": "https://schema.org/name",
    "content": "https://schema.org/text"
  },
  "@type": "PasteCollection",
  "@id": "#this",
  "pastes": [...],
  "updated": "2025-01-27T10:30:00Z"
}
```

## 🎯 Usage Guide

### Creating Pastes

1. Click "New Paste" or start typing
2. Add a descriptive title
3. Select the appropriate language for syntax highlighting
4. Paste or type your content
5. Press Ctrl+S (Cmd+S on Mac) or click "Save Paste"

### Managing Pastes

- **View All**: Click "My Pastes" to see all saved pastes
- **Search**: Use the search box to filter by title or content
- **Edit**: Click "Edit" on any paste to modify it
- **Share**: Click "Share" to copy the paste URL
- **Export**: Click "Export" to download as a text file
- **Delete**: Click "Delete" to remove a paste permanently

### Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S`: Save current paste
- `Escape`: Cancel editing
- `Enter`: Confirm title changes

## 🔄 Development Workflow

### No Build Process Required

- Open `index.html` directly in browser
- All dependencies loaded from CDN
- Changes are immediately visible on refresh

### Storage Debugging

Check browser console for detailed logs:

- DID document fetching
- Storage provider selection
- Save/load operations

### Adding New Features

Follow the existing patterns:

- Use Preact with HTM for components
- Add state to the main PastebinApp component
- Include proper error handling and fallbacks
- Update collection metadata when appropriate

## 🛠️ Troubleshooting

### Storage Issues

- **Error saving**: Check your Nostr extension connection
- **Data not syncing**: Verify your storage provider is accessible
- **Pastes not loading**: Check browser console for error messages

### Authentication Problems

- **Extension not detected**: Install a compatible Nostr extension
- **Private key errors**: Ensure key is exactly 64 hex characters
- **Login fails**: Clear browser cache and try again

### Performance Optimization

- **Slow loading**: DID documents are cached for 5 days
- **Storage timeouts**: Falls back to localStorage automatically
- **Large pastes**: Content is efficiently handled and indexed

## 🤝 Contributing

This project welcomes contributions! Areas for improvement:

- Additional programming language support
- Enhanced UI/UX features
- Mobile responsiveness improvements
- Additional export formats
- Integration with other Nostr applications
- Themes and customization options

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Nostr Protocol](https://nostr.com)
- [Nostr Extensions](https://nostrapps.github.io/extensions/)
- [nosdav Storage](https://nosdav.net)
- [Preact Framework](https://preactjs.com)
- [Highlight.js](https://highlightjs.org/)

---

**Built with ❤️ on the decentralized web using Nostr protocol**
