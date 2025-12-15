console.log('🔹 Auth Tab Script executing...');

const chrome = (globalThis as any).chrome;

// ⚠️ IMPORTANT: REPLACE THIS WITH YOUR "WEB CLIENT ID" FROM FIREBASE CONSOLE
// Go to Firebase Console -> Project Settings -> General -> Your apps -> Web app
// It won't work without this!
const GOOGLE_CLIENT_ID = '425369676942-n1n1e5ov61o4fjo5hd86l33g9j0c9edg.apps.googleusercontent.com'; // e.g., "123456...apps.googleusercontent.com"

window.onerror = function (msg, src, line, col, error) {
  console.error(`🔹 Auth Script Error: ${msg} at ${src}:${line}:${col}`, error);
  chrome.runtime?.sendMessage({ type: 'AUTH_ERROR', error: `Startup crash: ${msg}` }).catch(() => { });
};

async function performAuth(config: any) {
  console.log('🔹 performAuth starting...');
  try {
    console.log('🔹 Importing Firebase...');
    const { initializeApp } = await import('firebase/app');
    // Back to standard auth, but only using signInWithCredential (no CSP issues)
    const { getAuth, GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');

    const app = initializeApp(config);
    const auth = getAuth(app);
    auth.useDeviceLanguage();

    // 1. Check for Client ID
    let clientId = GOOGLE_CLIENT_ID;
    // Try to find client ID in config if user didn't set constant
    // Firebase config usually has 'appId', 'apiKey', but 'clientId' is not standard in the web config object
    // However, sometimes it is passed in valid configs. We'll check headers or just rely on user setting it.
    // For Google Sign In specifically, we often need the OAuth 2.0 Client ID.

    // If the user hasn't set the constant, let's try to extract it from a guess or throw error
    if (config.clientId) {
      clientId = config.clientId;
    }

    // Logic to extract client ID from appId if possible? No.

    // If still placeholder, check if we can parse it from authDomain or just ask user
    if (!clientId || clientId === 'PLACEHOLDER_CLIENT_ID') {
      // Fallback: If the user passed the standard firebase config, maybe we can just try to proceed 
      // if they set it. If not, UI will show error.
    }

    console.log('🔹 Starting Chrome Identity LaunchWebAuthFlow...');

    const redirectUri = chrome.identity.getRedirectURL();
    console.log('🔹 Redirect URI (Add this to Google Cloud Console!):', redirectUri);

    if (!clientId || clientId === 'PLACEHOLDER_CLIENT_ID') {
      throw new Error(`MISSING CLIENT ID: You must open 'entrypoints/connect/index.ts' and set 'GOOGLE_CLIENT_ID' to your Firebase Web Client ID.`);
    }

    // 2. Construct Auth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('nonce', Math.random().toString(36).substring(2)); // Prevent replay attacks
    authUrl.searchParams.set('prompt', 'select_account'); // Force account selection

    console.log('🔹 Launching Web Auth Flow with URL:', authUrl.toString());

    // 3. Launch Auth Window
    const redirectUrl = await new Promise<string>((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true
      }, (response: string | undefined) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response || '');
        }
      });
    });

    if (!redirectUrl) throw new Error('Auth flow failed (no redirect URL received)');
    console.log('🔹 Got Redirect URL');

    // 4. Parse ID Token from URL hash
    // Redirect URL looks like: https://<ext-id>.chromiumapp.org/index.html#id_token=...&...
    const hashParams = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
    const idToken = hashParams.get('id_token');
    if (!idToken) throw new Error('No ID token found in redirect URL');

    // 5. Exchange for Firebase Credential
    console.log('🔹 Exchanging token for Firebase Credential...');
    const credential = GoogleAuthProvider.credential(idToken);
    const cred = await signInWithCredential(auth, credential);

    console.log('🔹 signInWithCredential success');
    const firebaseIdToken = await cred.user.getIdToken(true);

    await chrome.runtime.sendMessage({
      type: 'AUTH_SUCCESS',
      user: {
        uid: cred.user.uid,
        displayName: cred.user.displayName,
        email: cred.user.email,
        photoURL: cred.user.photoURL,
      },
      idToken: firebaseIdToken,
    });

    document.body.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 400px; margin: 50px auto;">
           <h1 style="color: #10b981; margin: 0 0 10px;">✅ Connected!</h1>
           <p style="color: #6b7280; font-family: sans-serif;">You can close this tab now.</p>
        </div>`;
    document.body.style.backgroundColor = '#f3f4f6';

    setTimeout(() => window.close(), 2000);

  } catch (error: any) {
    console.error('Auth failed:', error);

    // Don't close window on error, so user can read it
    await chrome.runtime.sendMessage({
      type: 'AUTH_ERROR',
      error: error.message
    });

    const redirectUri = chrome.identity.getRedirectURL();

    document.body.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 600px; margin: 50px auto;">
           <h3 style="color: #ef4444; margin: 0 0 10px;">Authentication Failed</h3>
           <p style="color: #6b7280; font-family: sans-serif; word-break: break-all; margin-bottom:20px;">${error.message}</p>
           
           <div style="text-align: left; font-size: 14px; background: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #fecdd3;">
             <strong style="color: #991b1b;">REQUIRED ACTION:</strong>
             <ol style="margin: 10px 0; padding-left: 20px; color: #7f1d1d;">
               <li style="margin-bottom:8px;">Open <code>entrypoints/connect/index.ts</code> and paste your <strong>Google Web Client ID</strong> into <code>GOOGLE_CLIENT_ID</code>.</li>
               <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console > Credentials</a>.</li>
               <li>Find your <strong>OAuth 2.0 Web Client</strong>.</li>
               <li>Add this URI to <strong>"Authorized redirect URIs"</strong>: <br>
                   <code style="display:block; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #fca5a5; margin-top:5px; word-break: break-all;">${redirectUri}</code>
               </li>
               <li>Save and try again.</li>
             </ol>
           </div>
        </div>`;
    document.body.style.backgroundColor = '#f3f4f6';
  }
}

// Global Message Listener
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'AUTH_INIT') {
    performAuth(message.config);
  }
});

// Signal ready
chrome.runtime.sendMessage({ type: 'AUTH_WINDOW_READY' });
