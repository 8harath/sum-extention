// Global variables
let pageContent = ""
let currentAnswer = ""
let currentHighlightedText = ""

// DOM elements
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI elements
  const generateSummaryBtn = document.getElementById("generateSummary")
  const summaryLengthSelect = document.getElementById("summaryLength")
  const summaryResult = document.getElementById("summaryResult")
  const questionInput = document.getElementById("questionInput")
  const submitQuestionBtn = document.getElementById("submitQuestion")
  const answerResult = document.getElementById("answerResult")
  const locateOnPageBtn = document.getElementById("locateOnPage")
  const followupContainer = document.getElementById("followupContainer")
  const followupQuestions = document.getElementById("followupQuestions")
  const statusElement = document.getElementById("status")
  const settingsButton = document.getElementById("settingsButton")
  const settingsModal = document.getElementById("settingsModal")
  const closeModalBtn = document.querySelector(".close")
  const saveApiKeyBtn = document.getElementById("saveApiKey")
  const apiKeyInput = document.getElementById("apiKey")
  const toggleThemeBtn = document.getElementById("toggleTheme")
  const lightThemeBtn = document.getElementById("lightTheme")
  const darkThemeBtn = document.getElementById("darkTheme")
  const systemThemeBtn = document.getElementById("systemTheme")

  // Load saved API key and theme
  loadSettings()

  // Get the current tab's content
  getCurrentTabContent()

  // Event listeners
  generateSummaryBtn.addEventListener("click", generateSummary)
  submitQuestionBtn.addEventListener("click", submitQuestion)
  questionInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitQuestion()
    }
  })
  locateOnPageBtn.addEventListener("click", locateOnPage)

  // Settings modal
  settingsButton.addEventListener("click", () => {
    settingsModal.style.display = "block"
  })

  closeModalBtn.addEventListener("click", () => {
    settingsModal.style.display = "none"
  })

  window.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none"
    }
  })

  saveApiKeyBtn.addEventListener("click", saveApiKey)

  // Theme controls
  toggleThemeBtn.addEventListener("click", toggleTheme)
  lightThemeBtn.addEventListener("click", () => setTheme("light"))
  darkThemeBtn.addEventListener("click", () => setTheme("dark"))
  systemThemeBtn.addEventListener("click", () => setTheme("system"))

  // Functions
  function getCurrentTabContent() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setStatus("Extracting page content...")
      chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response) => {
        if (response && response.content) {
          pageContent = response.content
          setStatus("Ready")
        } else {
          setStatus("Error: Could not extract page content")
        }
      })
    })
  }

  async function generateSummary() {
    if (!pageContent) {
      setStatus("Error: No page content available")
      return
    }

    const apiKey = await getApiKey()
    if (!apiKey) {
      showApiKeyPrompt()
      return
    }

    const summaryLength = summaryLengthSelect.value
    setStatus("Generating summary...")
    summaryResult.innerHTML = "<p>Generating summary...</p>"

    try {
      const response = await callGeminiAPI(
        apiKey,
        `Summarize the following webpage content in ${summaryLength} words: ${pageContent}`,
      )
      summaryResult.innerHTML = `<p>${response}</p>`
      setStatus("Summary generated")
    } catch (error) {
      summaryResult.innerHTML = `<p class="error">Error generating summary: ${error.message}</p>`
      setStatus("Error")
    }
  }

  async function submitQuestion() {
    const question = questionInput.value.trim()
    if (!question) {
      return
    }

    if (!pageContent) {
      setStatus("Error: No page content available")
      return
    }

    const apiKey = await getApiKey()
    if (!apiKey) {
      showApiKeyPrompt()
      return
    }

    setStatus("Generating answer...")
    answerResult.innerHTML = "<p>Thinking...</p>"
    locateOnPageBtn.style.display = "none"
    followupContainer.style.display = "none"

    try {
      // First, get the answer
      const prompt = `
        Based on the following webpage content, answer the question: "${question}"
        
        Webpage content: ${pageContent}
        
        Provide a concise answer and also identify the exact text snippet from the webpage that contains this information.
        Format your response as:
        ANSWER: [Your answer here]
        SOURCE_TEXT: [Exact text from the webpage that contains this information]
      `

      const response = await callGeminiAPI(apiKey, prompt)

      // Parse the response to extract answer and source text
      const answerMatch = response.match(/ANSWER:(.*?)(?=SOURCE_TEXT:|$)/s)
      const sourceMatch = response.match(/SOURCE_TEXT:(.*?)$/s)

      const answer = answerMatch ? answerMatch[1].trim() : response
      const sourceText = sourceMatch ? sourceMatch[1].trim() : ""

      currentAnswer = answer
      currentHighlightedText = sourceText

      answerResult.innerHTML = `<p>${answer}</p>`

      if (sourceText) {
        locateOnPageBtn.style.display = "block"
      }

      // Generate follow-up questions
      generateFollowUpQuestions(question, answer, apiKey)

      setStatus("Ready")
    } catch (error) {
      answerResult.innerHTML = `<p class="error">Error: ${error.message}</p>`
      setStatus("Error")
    }
  }

  async function generateFollowUpQuestions(question, answer, apiKey) {
    try {
      const prompt = `
        Based on the webpage content about: "${pageContent.substring(0, 200)}..."
        
        And the question: "${question}"
        
        With the answer: "${answer}"
        
        Generate 3 relevant follow-up questions that the user might want to ask next.
        Format your response as a simple list with one question per line, no numbering or bullet points.
      `

      const response = await callGeminiAPI(apiKey, prompt)

      // Parse the response to get individual questions
      const questions = response.split("\n").filter((q) => q.trim().length > 0)

      if (questions.length > 0) {
        followupQuestions.innerHTML = ""
        questions.forEach((q) => {
          const li = document.createElement("li")
          li.textContent = q
          li.addEventListener("click", () => {
            questionInput.value = q
            submitQuestion()
          })
          followupQuestions.appendChild(li)
        })

        followupContainer.style.display = "block"
      }
    } catch (error) {
      console.error("Error generating follow-up questions:", error)
    }
  }

  function locateOnPage() {
    if (!currentHighlightedText) {
      return
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "highlightText",
        text: currentHighlightedText,
      })
    })
  }

  async function callGeminiAPI(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "API request failed")
    }

    const data = await response.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from API")
    }

    return data.candidates[0].content.parts[0].text
  }

  function setStatus(message) {
    statusElement.textContent = message
  }

  function showApiKeyPrompt() {
    settingsModal.style.display = "block"
    apiKeyInput.focus()
    setStatus("API key required")
  }

  async function saveApiKey() {
    const apiKey = apiKeyInput.value.trim()
    if (apiKey) {
      await chrome.storage.sync.set({ geminiApiKey: apiKey })
      settingsModal.style.display = "none"
      setStatus("API key saved")
    }
  }

  async function getApiKey() {
    const result = await chrome.storage.sync.get("geminiApiKey")
    return result.geminiApiKey
  }

  function toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme")
    const newTheme = currentTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  function setTheme(theme) {
    // Update active button
    ;[lightThemeBtn, darkThemeBtn, systemThemeBtn].forEach((btn) => {
      btn.classList.remove("active")
    })

    let appliedTheme = theme

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      appliedTheme = prefersDark ? "dark" : "light"
      systemThemeBtn.classList.add("active")
    } else if (theme === "dark") {
      darkThemeBtn.classList.add("active")
    } else {
      lightThemeBtn.classList.add("active")
    }

    document.body.setAttribute("data-theme", appliedTheme)
    chrome.storage.sync.set({ theme: theme })
  }

  async function loadSettings() {
    const settings = await chrome.storage.sync.get(["geminiApiKey", "theme"])

    if (settings.geminiApiKey) {
      apiKeyInput.value = settings.geminiApiKey
    } else {
      // Pre-populate with the provided API key
      const defaultApiKey = "AIzaSyAuCdW-NLtqH6gyhXYUtQ6_EAex69vgI_I"
      apiKeyInput.value = defaultApiKey
      await chrome.storage.sync.set({ geminiApiKey: defaultApiKey })
    }

    if (settings.theme) {
      setTheme(settings.theme)
    } else {
      // Default to system theme
      setTheme("system")
    }
  }
})
