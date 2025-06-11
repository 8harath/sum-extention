# Sum Extension

Sum Extension is a browser extension designed to enhance your web navigation and content consumption by allowing you to quickly summarize, query, and interactively explore the content of any web page using advanced AI models. It leverages the Gemini API for generating summaries, answering questions, and suggesting follow-up queries, making it an essential productivity tool for research, learning, and quick content understanding.

---

## Features

- **Page Content Extraction:** Automatically extracts and cleans up the main content of the current web page, removing navigation, ads, scripts, and other distractions.
- **Summarization:** Generate concise summaries of web pages at the click of a button.
- **Question Answering:** Ask questions about the current page and receive AI-powered answers, along with the exact text snippet that supports the answer.
- **Follow-up Suggestions:** Get suggested follow-up questions based on your queries and the page content for deeper exploration.
- **Highlight on Page:** Locate and highlight the exact text within the page that answers your question.
- **Theme Support:** Toggle between Light, Dark, and System themes for comfortable viewing.
- **API Key Management:** Securely store and manage your Gemini API key within the extension settings.

---

## How It Works

1. **Extracting Content:**  
   The extension injects a script (`content.js`) that extracts the main textual content of the currently open page, using heuristics to find the most relevant sections (like `<main>`, `<article>`, etc.), and cleans it for further processing.

2. **User Interface:**  
   The popup UI (implemented in `popup.js`) allows users to:
   - Generate a summary of the page.
   - Ask free-form questions about the page.
   - See answers and the supporting source text.
   - Click follow-up questions to continue the conversation.
   - Highlight the answer directly on the page.

3. **AI Integration:**  
   The extension sends prompts to the Gemini API, using your provided API key, to generate answers and follow-up questions. All communication with the API is handled securely and locally.

---

## Installation

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/8harath/sum-extention.git
   ```

2. **Build/Prepare the Extension:**
   - Install dependencies if there is a `package.json` (not shown here).
   - Ensure all TypeScript is compiled to JavaScript if you are developing.

3. **Load as Unpacked Extension:**
   - Go to `chrome://extensions/` (or your browser's extensions page).
   - Enable "Developer Mode".
   - Click "Load unpacked" and select the root directory of this project.
   - The Sum Extension icon should appear in your browser's toolbar.

---

## Usage

1. **Open any web page you wish to summarize or explore.**
2. **Click the Sum Extension icon** in your browser toolbar.
3. **On first use, enter your Gemini API Key** in the settings modal (click the gear/settings icon).
4. Use the provided buttons and input fields to:
   - Generate a summary of the page.
   - Ask questions about the content.
   - Click on follow-up questions for more exploration.
   - Highlight the answer in the context of the original page.

### Keyboard Shortcuts

- Press `Enter` in the question input to quickly submit your query.

---

## Configuration

- **API Key:**  
  The extension requires your personal Gemini API key. This is stored securely in your local browser storage and is never sent elsewhere.
- **Themes:**  
  Toggle between Light, Dark, and System themes using the theme controls in the popup.

---

## File Structure Overview

- `popup.js` — Main logic for popup UI, user interactions, and communication with the content script.
- `content.js` — Injected into web pages to extract and clean up main content and handle highlighting.
- `components/ui/` — Reusable UI components (React/TypeScript, for advanced popup UIs).
- `lib/utils.ts` — Utility functions.
- `next.config.mjs` — Configuration for Next.js (if using as a web project).

---

## Development

1. **Install dependencies** (if present).
2. **Edit TypeScript/JavaScript/HTML/CSS files** as needed.
3. **Reload the extension** in your browser after each change.

---

## Troubleshooting

- **No Answer Returned:**  
  Ensure your Gemini API key is valid and has sufficient quota.
- **Highlighting Does Not Work:**  
  Some pages with heavy dynamic content or strong CSP may not support content script injection.

---

## License

[MIT](LICENSE)

---

## Acknowledgements

- Utilizes [Gemini API](https://ai.google.dev/gemini-api/docs) for AI-powered summaries and answers.
- Built with [TypeScript](https://www.typescriptlang.org/) and [Next.js](https://nextjs.org/).

---

## Contributing

Pull requests and issues are welcome! Please follow standard GitHub practices.
