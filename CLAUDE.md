# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **decentralized pastebin application** built on the Nostr protocol. It features:

- **Frontend**: Vanilla JavaScript with Preact components loaded from CDN
- **Storage**: Decentralized storage via nosdav with DID document discovery
- **Authentication**: Nostr extension or private key login
- **Architecture**: Client-side only application with no backend
- **Purpose**: Share code snippets, text, and documents with complete data ownership

## Development Environment

Since this is a client-side only application, development is straightforward:

- Open `index.html` in a web browser to run the application
- No build process or bundling required
- All dependencies are loaded from CDN
- Use `npm start` to serve via Python HTTP server on port 8000

## Core Architecture

### Storage System

The application uses a sophisticated storage layer with multiple fallback mechanisms:

1. **DID Discovery**: Fetches DID documents from `nostr.social` to find custom storage endpoints
2. **Nosdav Integration**: Uses nostr-based WebDAV protocol for decentralized storage
3. **Fallback Chain**: Custom storage → nosdav.net → localStorage
4. **JSON-LD Schema**: Semantic paste structure with proper metadata

Key files:

- `storage-config.js`: Centralized storage configuration with DID discovery
- `nosdav-shim.js`: Intercepts fetch requests to add Nostr authentication headers

### Authentication Flow

The application supports three authentication methods:

1. **Nostr Extension**: Uses browser extensions like nos2x or Alby (recommended)
2. **Private Key**: Direct input of 64-character hex private key
3. **URL Hash Login**: Accepts private key in URL fragment for quick testing

Authentication state is managed in `navbar.js` and persisted in localStorage.

### Component Structure

- `index.js`: Main PastebinApp component with state management and business logic
- `navbar.js`: Reusable navigation component with authentication
- `index.html`: Entry point with styling and app container

### Data Model

The application uses JSON-LD structured data for pastes:

- **Paste items**: Individual pastes with `@type: 'Paste'` and semantic properties
- **Collection metadata**: Container with `@type: 'PasteCollection'` and `@id: '#this'`
- **Schema.org context**: Uses `https://schema.org/CreativeWork` as base type

## Key Features

### Syntax Highlighting

- Supports 20+ programming languages via highlight.js
- Languages include: JavaScript, Python, Java, C++, HTML, CSS, SQL, JSON, etc.
- GitHub-style syntax highlighting theme
- Real-time preview in view mode

### Paste Management

- Create, edit, delete, and view pastes
- Search and filter functionality
- Persistent URLs for sharing
- Copy-to-clipboard functionality
- File export capabilities

### Multi-View Interface

- **Edit Mode**: Create or modify pastes with live syntax highlighting
- **List Mode**: Browse all saved pastes with search functionality
- **View Mode**: Display pastes with formatted syntax highlighting
- **URL routing**: Support for direct paste links via query parameters

### Error Handling

- Graceful degradation when cloud storage fails
- User-friendly error messages for authentication issues
- Automatic fallback to localStorage
- Storage debug information in console

## URL Parameters

### Direct Paste Access

```
index.html?paste=paste-id
```

### View Mode Selection

```
index.html?mode=list
```

### Quick Testing with Private Key

```
index.html#64-character-hex-private-key
```

## Common Tasks

### Testing Authentication

Use the URL hash method for quick testing:

```
index.html#<64-character-hex-private-key>
```

The hash is automatically removed for privacy after authentication.

### Storage Debugging

Check browser console for detailed storage operation logs including:

- DID document fetching
- Storage provider selection
- Save/load operations
- Fallback mechanisms

### Adding New Programming Languages

Modify the `LANGUAGES` array in `index.js`:

```javascript
const LANGUAGES = [
  { value: 'newlang', label: 'New Language' }
  // ... existing languages
]
```

### Creating New Pastes

Follow the existing data structure:

```javascript
{
  id: 'unique-id',
  title: 'Paste Title',
  content: 'Paste content here',
  language: 'javascript',
  created: new Date().toISOString(),
  updated: new Date().toISOString()
}
```

## Dependencies

All dependencies are loaded from CDN:

- **Preact 10.13.1**: Component framework
- **HTM 3.1.1**: JSX-like template syntax
- **Highlight.js 11.9.0**: Syntax highlighting
- **Noble secp256k1 1.7.1**: Cryptographic operations
- **TailwindCSS**: Utility-first CSS framework

## File Structure

- `index.html`: Main entry point with styling and layout
- `index.js`: Core application logic and PastebinApp component
- `navbar.js`: Navigation and authentication component
- `storage-config.js`: Storage discovery and URL building utilities
- `nosdav-shim.js`: Fetch interceptor for Nostr authentication
- `package.json`: Project configuration and metadata

## Data Storage

### Local Structure

Pastes are stored in `pastes.json` with this structure:

```json
{
  "@context": {
    "Paste": "https://schema.org/CreativeWork",
    "title": "https://schema.org/name",
    "content": "https://schema.org/text"
  },
  "@type": "PasteCollection",
  "@id": "#this",
  "pastes": [
    {
      "@type": "Paste",
      "@id": "paste-123",
      "title": "Example Code",
      "content": "console.log('Hello');",
      "language": "javascript",
      "created": "2025-01-27T10:30:00Z",
      "updated": "2025-01-27T10:30:00Z"
    }
  ],
  "updated": "2025-01-27T10:30:00Z"
}
```

### Storage Locations

1. **Primary**: Custom nosdav endpoint (via DID discovery)
2. **Fallback**: `nosdav.net` public storage
3. **Local**: Browser localStorage as final fallback

## Security Considerations

- Private keys are stored in localStorage (client-side only)
- No server-side processing or storage
- Nostr protocol ensures cryptographic security
- DID-based storage discovery for decentralized hosting
- Hash-based login automatically clears URL for privacy
