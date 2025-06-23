/**
 * index.js - JavaScript for the Nostr-based Pastebin application
 * 
 * This file provides a complete pastebin application with cloud storage
 * capabilities via nosdav, decentralized authentication, and syntax highlighting.
 * Features include paste creation, editing, sharing, and export functionality.
 * 
 * Referenced by: index.html
 */

/* ---------------------------------------------------------------- */
/* -                      IMPORTS & SETUP                         - */
/* ---------------------------------------------------------------- */
import {
  h,
  render,
  Component
} from 'https://unpkg.com/preact@10.13.1/dist/preact.module.js'
import htm from 'https://unpkg.com/htm@3.1.1/dist/htm.module.js'
import Navbar from './navbar.js'
import StorageConfig from './storage-config.js'
import './nosdav-shim.js'
import * as secp256k1 from 'https://cdn.jsdelivr.net/npm/@noble/secp256k1@1.7.1/+esm'

// Make secp256k1 available globally (required by nosdav-shim.js)
window.secp256k1 = secp256k1

// Initialize HTM with Preact for JSX-like syntax
const html = htm.bind(h)

// Programming language options for syntax highlighting
const LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'docker', label: 'Dockerfile' }
]

/* ---------------------------------------------------------------- */
/* -                    MAIN PASTEBIN APP COMPONENT               - */
/* ---------------------------------------------------------------- */
class PastebinApp extends Component {
  constructor () {
    super()
    this.state = {
      pastes: [],              // Array of paste items
      currentPaste: {          // Currently editing paste
        id: null,
        title: '',
        content: '',
        language: 'text',
        created: null,
        updated: null
      },
      isEditing: false,        // Whether we're editing an existing paste
      viewMode: 'edit',        // 'edit', 'list', 'view'
      viewingPaste: null,      // Paste being viewed
      saveError: null,         // Error state for save operations
      isLoading: false,        // Loading state
      searchTerm: '',          // Search filter for pastes
    }
  }

  /* -------------------- LIFECYCLE & INITIALIZATION -------------------- */
  componentDidMount () {
    // Add a small delay to ensure any URL hash login completes first
    setTimeout(async () => {
      await this.loadPastes()
      this.checkUrlParams()
      this.debugStorageSetup()
    }, 200)

    // Initialize syntax highlighting
    if (window.hljs) {
      window.hljs.highlightAll()
    }
  }

  debugStorageSetup = async () => {
    const pubkey = localStorage.getItem('pubkey')
    if (pubkey) {
      console.log('🔍 Storage Debug Info:')
      console.log('📋 Pubkey:', pubkey.substring(0, 8) + '...')

      try {
        const storageRoot = await StorageConfig.getStorageRoot()
        const isCustom = StorageConfig.isCustomStorage()
        const pasteUrl = await StorageConfig.buildUrl('pastes.json')

        console.log('🏠 Storage Root:', storageRoot)
        console.log('🔧 Custom Storage:', isCustom)
        console.log('📄 Pastes URL:', pasteUrl)
        console.log('🔮 Nosdav shim active:', !!window.fetch.toString().includes('authorization'))
      } catch (error) {
        console.error('❌ Storage setup error:', error)
      }
    }
  }

  /* -------------------- URL HANDLING -------------------- */
  checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const pasteId = urlParams.get('paste')
    const mode = urlParams.get('mode')

    if (pasteId) {
      const paste = this.state.pastes.find(p => p.id === pasteId)
      if (paste) {
        this.setState({
          viewingPaste: paste,
          viewMode: 'view'
        })
      }
    } else if (mode === 'list') {
      this.setState({ viewMode: 'list' })
    }
  }

  /* -------------------- STORAGE OPERATIONS -------------------- */
  async loadPastes () {
    try {
      this.setState({ isLoading: true, saveError: null })
      const pubkey = localStorage.getItem('pubkey')

      if (!pubkey) {
        console.log('No pubkey found, checking localStorage fallback')
        // Try to load from localStorage as fallback
        const localPastes = localStorage.getItem('pastes')
        if (localPastes) {
          try {
            const parsed = JSON.parse(localPastes)
            this.setState({ pastes: parsed, isLoading: false })
            console.log(`Loaded ${parsed.length} pastes from localStorage`)
            return
          } catch (e) {
            console.error('Error parsing localStorage pastes:', e)
          }
        }
        this.setState({ pastes: [], isLoading: false })
        return
      }

      const pastesUrl = await StorageConfig.buildUrl('pastes.json')
      console.log('📡 Loading pastes from nosdav:', pastesUrl)

      const response = await fetch(pastesUrl)

      if (response.status === 404) {
        console.log('📭 No pastes.json found on nosdav, checking localStorage fallback')
        // Try localStorage fallback
        const localPastes = localStorage.getItem('pastes')
        if (localPastes) {
          try {
            const parsed = JSON.parse(localPastes)
            this.setState({ pastes: parsed, isLoading: false })
            console.log(`📱 Loaded ${parsed.length} pastes from localStorage fallback`)
            return
          } catch (e) {
            console.error('Error parsing localStorage pastes:', e)
          }
        }
        this.setState({ pastes: [], isLoading: false })
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const pastes = Array.isArray(data.pastes) ? data.pastes : []

      // Sort by updated date, most recent first
      pastes.sort((a, b) => new Date(b.updated || b.created) - new Date(a.updated || a.created))

      // Save to localStorage as backup
      localStorage.setItem('pastes', JSON.stringify(pastes))

      this.setState({ pastes, isLoading: false })
      console.log(`✅ Loaded ${pastes.length} pastes from nosdav and cached locally`)
    } catch (error) {
      console.error('❌ Error loading from nosdav:', error)

      // Try localStorage fallback
      const localPastes = localStorage.getItem('pastes')
      if (localPastes) {
        try {
          const parsed = JSON.parse(localPastes)
          this.setState({
            pastes: parsed,
            isLoading: false,
            saveError: 'Using local backup (nosdav connection failed)'
          })
          console.log(`📱 Fallback: Loaded ${parsed.length} pastes from localStorage`)
          return
        } catch (e) {
          console.error('Error parsing localStorage backup:', e)
        }
      }

      this.setState({
        saveError: `Failed to load pastes: ${error.message}`,
        isLoading: false,
        pastes: []
      })
    }
  }

  async savePastes (pastes) {
    try {
      this.setState({ saveError: null })
      const pubkey = localStorage.getItem('pubkey')

      // Always save to localStorage as backup
      localStorage.setItem('pastes', JSON.stringify(pastes))
      console.log('💾 Saved to localStorage backup')

      if (!pubkey) {
        console.log('⚠️ No authentication - using localStorage only')
        this.setState({ saveError: 'Saved locally only (not logged in)' })
        return true
      }

      const pastesUrl = await StorageConfig.buildUrl('pastes.json')
      console.log('📡 Saving pastes to nosdav:', pastesUrl)

      const data = {
        '@context': {
          'Paste': 'https://schema.org/CreativeWork',
          'title': 'https://schema.org/name',
          'content': 'https://schema.org/text'
        },
        '@type': 'PasteCollection',
        '@id': '#this',
        pastes: pastes,
        updated: new Date().toISOString()
      }

      // Check if we're using custom storage or default nosdav
      const isCustomStorage = StorageConfig.isCustomStorage()
      console.log(`🔧 Storage type: ${isCustomStorage ? 'Custom DID' : 'Default nosdav'}`)

      const response = await fetch(pastesUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data, null, 2)
      })

      if (!response.ok) {
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Authentication failed - check your Nostr credentials')
        } else if (response.status === 403) {
          throw new Error('Access denied - you may need storage permissions')
        } else if (response.status === 404) {
          throw new Error('Storage endpoint not found')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }

      console.log('✅ Pastes saved successfully to nosdav')
      this.setState({ saveError: null })
      return true
    } catch (error) {
      console.error('❌ Error saving to nosdav:', error)

      // Data is already saved to localStorage, so partially successful
      this.setState({
        saveError: `Saved locally only: ${error.message}`
      })

      // Return true since we have localStorage backup
      return true
    }
  }

  /* -------------------- PASTE OPERATIONS -------------------- */
  createNewPaste = () => {
    this.setState({
      currentPaste: {
        id: null,
        title: '',
        content: '',
        language: 'text',
        created: null,
        updated: null
      },
      isEditing: false,
      viewMode: 'edit'
    })
    this.updateUrl()
  }

  editPaste = (paste) => {
    this.setState({
      currentPaste: { ...paste },
      isEditing: true,
      viewMode: 'edit'
    })
    this.updateUrl()
  }

  savePaste = async () => {
    const { currentPaste, pastes, isEditing } = this.state

    if (!currentPaste.title.trim() || !currentPaste.content.trim()) {
      this.setState({ saveError: 'Title and content are required' })
      return
    }

    const now = new Date().toISOString()
    const pasteToSave = {
      ...currentPaste,
      id: currentPaste.id || this.generateId(),
      created: currentPaste.created || now,
      updated: now
    }

    let updatedPastes
    if (isEditing) {
      updatedPastes = pastes.map(p => p.id === pasteToSave.id ? pasteToSave : p)
    } else {
      updatedPastes = [pasteToSave, ...pastes]
    }

    // Sort by updated date
    updatedPastes.sort((a, b) => new Date(b.updated || b.created) - new Date(a.updated || a.created))

    const success = await this.savePastes(updatedPastes)
    if (success) {
      this.setState({
        pastes: updatedPastes,
        currentPaste: pasteToSave,
        saveError: null
      })
    }
  }

  deletePaste = async (pasteId) => {
    if (!confirm('Are you sure you want to delete this paste?')) {
      return
    }

    const updatedPastes = this.state.pastes.filter(p => p.id !== pasteId)
    const success = await this.savePastes(updatedPastes)

    if (success) {
      this.setState({
        pastes: updatedPastes,
        saveError: null
      })

      // If we're viewing this paste, go back to list
      if (this.state.viewingPaste?.id === pasteId) {
        this.showPasteList()
      }
    }
  }

  viewPaste = (paste) => {
    this.setState({
      viewingPaste: paste,
      viewMode: 'view'
    })
    this.updateUrl(paste.id)

    // Apply syntax highlighting after render
    setTimeout(() => {
      if (window.hljs) {
        window.hljs.highlightAll()
      }
    }, 100)
  }

  showPasteList = () => {
    this.setState({ viewMode: 'list' })
    this.updateUrl(null, 'list')
  }

  /* -------------------- UTILITY FUNCTIONS -------------------- */
  generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  updateUrl = (pasteId = null, mode = null) => {
    const url = new URL(window.location)
    url.search = ''

    if (pasteId) {
      url.searchParams.set('paste', pasteId)
    } else if (mode) {
      url.searchParams.set('mode', mode)
    }

    window.history.replaceState(null, null, url.toString())
  }

  copyPasteUrl = (paste) => {
    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('paste', paste.id)

    navigator.clipboard.writeText(url.toString()).then(() => {
      // Show success feedback
      const originalText = event.target.textContent
      event.target.textContent = 'Copied!'
      setTimeout(() => {
        event.target.textContent = originalText
      }, 2000)
    }).catch(() => {
      // Fallback for older browsers
      prompt('Copy this URL:', url.toString())
    })
  }

  exportPaste = (paste) => {
    const blob = new Blob([paste.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${paste.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  /* -------------------- EVENT HANDLERS -------------------- */
  handleInputChange = (field) => (e) => {
    this.setState({
      currentPaste: {
        ...this.state.currentPaste,
        [field]: e.target.value
      }
    })
  }

  handleSearchChange = (e) => {
    this.setState({ searchTerm: e.target.value })
  }

  handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      this.savePaste()
    }
  }

  handleLogout = () => {
    // Clear storage cache when user logs out
    StorageConfig.clearCache()

    // Reset app state
    this.setState({
      pastes: [],
      currentPaste: {
        id: null,
        title: '',
        content: '',
        language: 'text',
        created: null,
        updated: null
      },
      isEditing: false,
      viewMode: 'edit',
      viewingPaste: null,
      saveError: null,
      isLoading: false,
      searchTerm: ''
    })

    console.log('🧹 App state cleared on logout')
  }

  /* -------------------- RENDER METHODS -------------------- */
  renderStorageStatus () {
    const pubkey = localStorage.getItem('pubkey')
    const isCustomStorage = StorageConfig.isCustomStorage()
    const cachedRoot = StorageConfig.getCachedStorageRoot()

    if (!pubkey) {
      return html`
        <div className="text-sm text-gray-500 flex items-center mt-1">
          <span className="mr-1">💾</span>
          Local storage only
        </div>
      `
    }

    const storageType = isCustomStorage ? 'Custom Storage' : 'Nosdav'
    const storageIcon = isCustomStorage ? '🏛️' : '🔮'

    return html`
      <div className="text-sm text-gray-500 flex items-center mt-1">
        <span className="mr-1">${storageIcon}</span>
        Connected to ${storageType}
        ${cachedRoot && html`
          <span className="ml-2 text-xs opacity-75" title="Storage endpoint">
            (${isCustomStorage ? new URL(cachedRoot).hostname : 'nosdav.net'})
          </span>
        `}
      </div>
    `
  }
  renderEditView () {
    const { currentPaste, isEditing, saveError } = this.state

    return html`
      <div className="paste-container p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            ${isEditing ? 'Edit Paste' : 'Create New Paste'}
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick=${this.showPasteList}
              className="btn-secondary text-sm w-full sm:w-auto"
            >
              ← Back to List
            </button>
          </div>
        </div>

        ${saveError && html`
          <div className=${saveError.includes('locally only') ?
          "bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4" :
          "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4"}>
            <div className="flex items-center">
              <span className="mr-2">${saveError.includes('locally only') ? '⚠️' : '❌'}</span>
              ${saveError}
            </div>
          </div>
        `}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value=${currentPaste.title}
              onChange=${this.handleInputChange('title')}
              placeholder="Enter paste title..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value=${currentPaste.language}
              onChange=${this.handleInputChange('language')}
              className="language-selector"
            >
              ${LANGUAGES.map(lang => html`
                <option key=${lang.value} value=${lang.value}>
                  ${lang.label}
                </option>
              `)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value=${currentPaste.content}
              onChange=${this.handleInputChange('content')}
              onKeyDown=${this.handleKeyDown}
              placeholder="Paste or type your content here..."
              className="paste-textarea w-full"
              rows="20"
            ></textarea>
            <p className="text-sm text-gray-500 mt-2">
              Tip: Press Ctrl+S (Cmd+S on Mac) to save
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick=${this.savePaste}
              className="btn-primary w-full sm:w-auto"
            >
              ${isEditing ? 'Update Paste' : 'Save Paste'}
            </button>
            <button
              onClick=${this.createNewPaste}
              className="btn-secondary w-full sm:w-auto"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    `
  }

  renderListView () {
    const { pastes, searchTerm, isLoading } = this.state

    const filteredPastes = pastes.filter(paste =>
      paste.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paste.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return html`
      <div className="paste-container p-4 sm:p-6 mb-6">
         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
           <div className="flex-1 min-w-0">
             <h2 className="text-xl font-bold text-gray-800">My Pastes</h2>
             ${this.renderStorageStatus()}
           </div>
           <button
             onClick=${this.createNewPaste}
             className="btn-primary w-full sm:w-auto"
           >
             + New Paste
           </button>
         </div>

        <div className="mb-4">
          <input
            type="text"
            value=${searchTerm}
            onChange=${this.handleSearchChange}
            placeholder="Search pastes..."
            className="w-full max-w-md"
          />
        </div>

        ${isLoading && html`
          <div className="text-center py-8">
            <div className="text-gray-500">Loading pastes...</div>
          </div>
        `}

        ${!isLoading && filteredPastes.length === 0 && html`
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              ${pastes.length === 0 ? 'No pastes yet' : 'No pastes match your search'}
            </div>
            ${pastes.length === 0 && html`
              <button
                onClick=${this.createNewPaste}
                className="btn-primary"
              >
                Create your first paste
              </button>
            `}
          </div>
        `}

        <div className="space-y-3">
          ${filteredPastes.map(paste => html`
            <div key=${paste.id} className="paste-item p-4 bg-white">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1 break-words">
                    ${paste.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs">
                      ${LANGUAGES.find(l => l.value === paste.language)?.label || paste.language}
                    </span>
                    <span>${this.formatDate(paste.updated || paste.created)}</span>
                    <span>${paste.content.length} chars</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 break-words">
                    ${paste.content.substring(0, 150)}${paste.content.length > 150 ? '...' : ''}
                  </p>
                </div>
                
                <!-- Desktop button layout -->
                <div className="hidden lg:flex gap-2 flex-shrink-0">
                  <button
                    onClick=${() => this.viewPaste(paste)}
                    className="px-3 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-sm transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick=${() => this.editPaste(paste)}
                    className="px-3 py-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick=${() => this.copyPasteUrl(paste)}
                    className="px-3 py-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded text-sm transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick=${() => this.exportPaste(paste)}
                    className="px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded text-sm transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick=${() => this.deletePaste(paste.id)}
                    className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
                
                <!-- Mobile button layout -->
                <div className="lg:hidden">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick=${() => this.viewPaste(paste)}
                      className="flex-1 min-w-0 px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick=${() => this.editPaste(paste)}
                      className="flex-1 min-w-0 px-3 py-2 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick=${() => this.copyPasteUrl(paste)}
                      className="flex-1 min-w-0 px-3 py-2 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600 transition-colors"
                    >
                      Share
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick=${() => this.exportPaste(paste)}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      Export
                    </button>
                    <button
                      onClick=${() => this.deletePaste(paste.id)}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `
  }

  renderViewMode () {
    const { viewingPaste } = this.state

    if (!viewingPaste) {
      return html`<div>Paste not found</div>`
    }

    return html`
      <div className="paste-container p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 mb-2 break-words">
              ${viewingPaste.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs">
                ${LANGUAGES.find(l => l.value === viewingPaste.language)?.label || viewingPaste.language}
              </span>
              <span>${this.formatDate(viewingPaste.updated || viewingPaste.created)}</span>
              <span>${viewingPaste.content.length} characters</span>
            </div>
          </div>
          
          <!-- Desktop button layout -->
          <div className="hidden lg:flex gap-2 flex-shrink-0">
            <button
              onClick=${() => this.editPaste(viewingPaste)}
              className="btn-secondary text-sm"
            >
              Edit
            </button>
            <button
              onClick=${() => this.copyPasteUrl(viewingPaste)}
              className="btn-secondary text-sm"
            >
              Share
            </button>
            <button
              onClick=${() => this.exportPaste(viewingPaste)}
              className="btn-secondary text-sm"
            >
              Export
            </button>
            <button
              onClick=${this.showPasteList}
              className="btn-primary text-sm"
            >
              ← Back
            </button>
          </div>
          
          <!-- Mobile button layout -->
          <div className="lg:hidden w-full">
            <div className="flex gap-2 mb-2">
              <button
                onClick=${() => this.editPaste(viewingPaste)}
                className="flex-1 py-2 px-3 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick=${() => this.copyPasteUrl(viewingPaste)}
                className="flex-1 py-2 px-3 bg-purple-500 text-white rounded text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                Share
              </button>
              <button
                onClick=${() => this.exportPaste(viewingPaste)}
                className="flex-1 py-2 px-3 bg-gray-500 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Export
              </button>
            </div>
            <button
              onClick=${this.showPasteList}
              className="w-full py-2 px-3 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              ← Back to List
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <pre className="m-0"><code className="language-${viewingPaste.language} text-sm leading-relaxed">${viewingPaste.content}</code></pre>
        </div>
      </div>
    `
  }

  render () {
    const { viewMode } = this.state
    const pubkey = localStorage.getItem('pubkey')
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true'

    return html`
       <div className="min-h-screen">
         <${Navbar} onLogout=${this.handleLogout} />
         
         <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl">
          ${!isLoggedIn && html`
            <div className="paste-container p-4 sm:p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to Decentralized Pastebin
              </h2>
              <p className="text-gray-600 mb-6">
                A privacy-focused pastebin built on the Nostr protocol. 
                Your pastes are stored securely and you own your data.
              </p>
              <p className="text-gray-500">
                Please sign in to create and manage your pastes.
              </p>
            </div>
          `}

          ${isLoggedIn && viewMode === 'edit' && this.renderEditView()}
          ${isLoggedIn && viewMode === 'list' && this.renderListView()}
          ${isLoggedIn && viewMode === 'view' && this.renderViewMode()}
        </main>
      </div>
    `
  }
}

/* ---------------------------------------------------------------- */
/* -                    RENDER TO DOM                             - */
/* ---------------------------------------------------------------- */
render(html`<${PastebinApp} />`, document.getElementById('app'))
