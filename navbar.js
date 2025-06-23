// Import Preact and HTM from CDN
import { h, Component } from 'https://unpkg.com/preact@10.13.1/dist/preact.module.js';
import htm from 'https://unpkg.com/htm@3.1.1/dist/htm.module.js';
// Import SweetAlert and secp256k1 libraries
import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11/+esm';
import * as secp256k1 from 'https://cdn.jsdelivr.net/npm/@noble/secp256k1@1.7.1/+esm';

// Initialize htm with Preact
const html = htm.bind(h);

// Add CSS variables to match index.html
const styleElement = document.createElement('style');
styleElement.textContent = `
  :root {
    --primary: #2563eb;
    --primary-dark: #1d4ed8;
    --primary-light: #dbeafe;
    --secondary: #64748b;
    --accent: #10b981;
    --text-light: #ffffff;
    --text-dark: #1e293b;
    --card-bg: #f8fafc;
    --body-bg: #f1f5f9;
    --sidebar-width: 230px;
    --header-height: 60px;
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
    --radius-sm: 6px;
    --radius-md: 12px;
  }
  
  .header {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: var(--text-light);
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 25px;
    position: relative;
    z-index: 100;
    box-shadow: var(--shadow-sm);
    width: 100%;
  }

  .logo {
    font-size: 26px;
    font-weight: bold;
    display: flex;
    align-items: center;
    letter-spacing: -0.5px;
    color: var(--text-light);
    text-decoration: none;
  }

  .logo-icon {
    color: var(--accent);
    font-size: 28px;
    margin-right: 8px;
  }

  .theme-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .auth-button {
    background-color: rgba(255, 255, 255, 0.15);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    outline: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
  }

  .auth-button:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }

  .auth-button.login {
    background-color: var(--accent);
    border-color: var(--accent);
  }

  .auth-button.login:hover {
    background-color: #0f9d76;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  .pubkey-display {
    font-family: monospace;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .nav-links {
    display: flex;
    gap: 20px;
  }

  .nav-link {
    color: var(--text-light);
    text-decoration: none;
    font-weight: 500;
    opacity: 0.9;
    transition: all 0.2s ease;
    padding: 5px 0;
    position: relative;
    font-size: 14px;
  }

  .nav-link:hover {
    opacity: 1;
  }

  .nav-link:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: var(--accent);
    transition: width 0.2s ease;
  }

  .nav-link:hover:after {
    width: 100%;
  }

  .nav-link.active:after {
    width: 100%;
  }

  @media (max-width: 768px) {
    .nav-links {
      display: none;
    }
    
    .pubkey-display {
      display: none;
    }
    
    .header {
      padding: 0 15px;
    }
    
    .logo {
      font-size: 22px;
    }
  }
`;
document.head.appendChild(styleElement);

// Navbar component
class Navbar extends Component {
  constructor (props) {
    super(props);
    this.state = {
      isLoggedIn: localStorage.getItem('loggedIn') === 'true',
      pubkey: localStorage.getItem('pubkey') || null,
      privkey: localStorage.getItem('nostr:privkey') || null
    };
  }

  componentDidMount () {
    // Check if user is already logged in
    if (window.nostr && localStorage.getItem('pubkey')) {
      this.setState({
        isLoggedIn: true,
        pubkey: localStorage.getItem('pubkey')
      });
    }

    // Check for private key in URL hash
    const hash = window.location.hash.substring(1); // Remove the # character
    if (hash && hash.length === 64 && /^[0-9a-fA-F]+$/.test(hash)) {
      // Valid private key in hash, use it to login
      this.loginWithPrivkey(hash);

      // Clean URL by removing the hash to protect privacy
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }

  handleLogin = async () => {
    try {
      const { value: loginMethod } = await Swal.fire({
        title: 'Sign in to Pastebin',
        html: `
          <button id="extensionLogin" class="swal2-confirm swal2-styled" style="display:block; width:100%; margin:10px auto; background-color: var(--primary);">Sign in with Nostr extension</button>
          <input id="privkeyInput" type="password" placeholder="Or enter your 64-character hex private key" class="swal2-input" style="display:block; width:100%; margin:10px auto;">
          <p style="margin-top: 10px; font-size: 0.9em;"><a href="https://nostrapps.github.io/extensions/" target="_blank">What is a Nostr extension?</a></p>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        focusConfirm: false,
        allowOutsideClick: true,
        customClass: {
          container: 'nostr-login-modal',
          popup: 'nostr-login-popup',
        },
        didOpen: () => {
          const extensionButton = Swal.getPopup().querySelector('#extensionLogin');
          const privkeyInput = Swal.getPopup().querySelector('#privkeyInput');

          // Clipboard auto-paste logic
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(text => {
              if (
                text &&
                text.length === 64 &&
                /^[0-9a-fA-F]+$/.test(text)
              ) {
                privkeyInput.value = text;
                // Auto-submit the form
                Swal.clickConfirm();
              }
            }).catch(() => { });
          }

          extensionButton.addEventListener('click', () => {
            Swal.clickConfirm();
            return { loginMethod: 'extension' };
          });

          privkeyInput.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
              Swal.clickConfirm();
              return { loginMethod: 'privkey', privkey: privkeyInput.value };
            }
          });

          // Add paste event listener
          privkeyInput.addEventListener('paste', e => {
            setTimeout(() => {
              if (
                privkeyInput.value.length === 64 &&
                /^[0-9a-fA-F]+$/.test(privkeyInput.value)
              ) {
                Swal.clickConfirm();
                return { loginMethod: 'privkey', privkey: privkeyInput.value };
              }
            }, 10);
          });
        },
        preConfirm: () => {
          const privkey = Swal.getPopup().querySelector('#privkeyInput').value;
          if (
            privkey &&
            (privkey.length !== 64 || !/^[0-9a-fA-F]+$/.test(privkey))
          ) {
            Swal.showValidationMessage(
              'Invalid private key format. Please enter a 64-character hex string.'
            );
            return false;
          }

          return {
            loginMethod: privkey ? 'privkey' : 'extension',
            privkey
          };
        }
      });

      if (loginMethod) {
        if (loginMethod.loginMethod === 'privkey') {
          await this.loginWithPrivkey(loginMethod.privkey);
        } else {
          // Check for localStorage privkey first
          const storedPrivkey = localStorage.getItem('nostr:privkey');
          if (storedPrivkey) {
            await this.loginWithPrivkey(storedPrivkey);
          } else {
            await this.loginWithExtension();
          }
        }
      }
    } catch (error) {
      console.error('Login dialog error:', error);
    }
  }

  loginWithExtension = async () => {
    if (window.nostr) {
      try {
        // First check if we can access the Nostr object
        if (typeof window.nostr.getPublicKey !== 'function') {
          throw new Error('Nostr extension API not available');
        }

        const pubkey = await window.nostr.getPublicKey();

        // Validate pubkey is a hex string of correct length
        if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
          throw new Error('Invalid public key format returned from extension');
        }

        this.setState({ isLoggedIn: true, pubkey }, () => {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('pubkey', pubkey);

          Swal.fire({
            title: 'Logged in!',
            text: 'You have successfully logged in with your Nostr extension.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            if (this.props.onLogin) this.props.onLogin(pubkey);
            const entry = document.querySelector('textarea, input[type="text"]');
            if (entry) entry.focus();
          });
        });
      } catch (error) {
        console.error('Login failed:', error);
        Swal.fire({
          title: 'Login Failed',
          text: 'There was an error logging in with your Nostr extension. ' + error.message,
          icon: 'error',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } else {
      Swal.fire({
        title: 'Extension Not Found',
        text: 'Nostr extension not found. Please install a Nostr browser extension like nos2x or Alby.',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: true
      });
    }
  }

  loginWithPrivkey = async privkey => {
    if (privkey) {
      try {
        // Ensure secp256k1 is available
        if (!window.secp256k1) {
          console.error('secp256k1 library not available');
          Swal.fire({
            title: 'Login Failed',
            text: 'Required cryptographic library not available.',
            icon: 'error',
            timer: 2000,
            showConfirmButton: false
          });
          return;
        }

        // Convert private key to public key
        const pubkey = secp256k1.utils.bytesToHex(
          secp256k1.schnorr.getPublicKey(privkey)
        );

        // Update state safely
        this.setState({
          isLoggedIn: true,
          pubkey: pubkey,
          privkey: privkey
        }, () => {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('pubkey', pubkey);
          localStorage.setItem('nostr:privkey', privkey);

          Swal.fire({
            title: 'Logged in!',
            text: 'You have successfully logged in with your private key.',
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
          }).then(() => {
            if (this.props.onLogin) this.props.onLogin(pubkey);
            const entry = document.querySelector('textarea, input[type="text"]');
            if (entry) entry.focus();
          });
        });
      } catch (error) {
        console.error('Login failed:', error);
        Swal.fire({
          title: 'Login Failed',
          text: 'There was an error generating the public key from the provided private key.',
          icon: 'error',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }
  }

  handleLogout = () => {
    this.setState({ isLoggedIn: false, pubkey: null, privkey: null });
    localStorage.setItem('loggedIn', 'false');
    localStorage.removeItem('pubkey');
    localStorage.removeItem('nostr:privkey');

    // Clear the textarea if it exists
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
    }

    Swal.fire({
      title: 'Logged out!',
      text: 'You have successfully logged out.',
      icon: 'success',
      timer: 1000,
      showConfirmButton: false
    });

    // Call the onLogout prop if provided
    if (this.props.onLogout) this.props.onLogout();
  }

  render () {
    const { isLoggedIn, pubkey } = this.state;
    const displayText = pubkey ? pubkey.substring(0, 8) : 'Login';

    return html`
      <header className="header">
        <div className="logo">
          <span className="logo-icon">📋</span>
          Pastebin
        </div>
        
        <div className="theme-container">
          ${isLoggedIn ? html`
            <div className="user-info">
              <span className="pubkey-display">${displayText}...</span>
              <button
                onClick=${this.handleLogout}
                className="auth-button"
              >
                Logout
              </button>
            </div>
          ` : html`
            <button
              onClick=${this.handleLogin}
              className="auth-button login"
            >
              Sign In
            </button>
          `}
        </div>
      </header>
    `;
  }
}

export default Navbar; 