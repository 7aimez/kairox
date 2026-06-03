<div align="center">
  <img width="200px" height="200px" alt="kairox-logo" src="static/logo.png" />
  <h1>
    Kairox AI - v1.3.7
  </h1>
  <b>Robust API Manager</b>
  <hr /><br />
</div>


## Welcome to Kairox 👋

Kairox is a streamlined, open-source AI API interface designed for speed and flexibility. By connecting your own API key (Groq API by default), you unlock access to ultra-fast inference models without the bloat of traditional AI wrappers. [**Get started ◹**](https://kairox-ai.onrender.com)


## Screenshot

<img width="1918" height="904" alt="image" src="https://github.com/user-attachments/assets/e778676e-d1e1-40d5-8337-4e2521499e16" />


## Get Started

1. Open [kairox-ai.onrender.com](https://kairox-ai.onrender.com) in your browser.
2. Click **Create Account**. Guest access is available via **Sign in as Guest** (skips to step 6).
3. Populate the required profile fields.
4. Authenticate your Groq API integration:
   * Log in or sign up at [console.groq.com](https://console.groq.com).
   * Generate a new token in the **API Keys** dashboard.
   * Input the token into the **Groq API Key** field within the Kairox interface.
5. Submit the registration form by clicking **Create Account**.
6. Setup is complete; Kairox is ready for operation.

You can access settings by clicking on your profile icon in the top right corner.


## Available Models

- Llama 3.3 70B Versatile (recommended)
- Llama 3.1 8B Instant
- Llama 3 70B
- Mixtral 8x7B
- Gemma 2 9B

## Dev Notes

**Change API provider**
In order to change your API provider, you must fork the repo and edit line 2 of `public/scripts/state.js`, to match the API url of your provider.

**API key rotation**
The API key found in the commit history has been deleted and rotated. It is completely inactive.
