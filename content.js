// Global variables
let highlightedElement = null

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = extractPageContent()
    sendResponse({ content: content })
  } else if (request.action === "highlightText") {
    highlightText(request.text)
    sendResponse({ success: true })
  }
  return true // Keep the message channel open for async responses
})

// Extract the main content from the page
function extractPageContent() {
  // Remove script tags, style tags, and hidden elements
  const clonedBody = document.body.cloneNode(true)
  const scripts = clonedBody.querySelectorAll("script, style, [hidden], noscript, meta, link")
  scripts.forEach((script) => script.remove())

  // Try to find the main content
  let mainContent = ""

  // First, try to find article or main content elements
  const contentElements = clonedBody.querySelectorAll(
    'article, [role="main"], main, .main-content, #main-content, .content, #content',
  )

  if (contentElements.length > 0) {
    // Use the first content element found
    mainContent = contentElements[0].textContent
  } else {
    // Fallback: use the body text but try to exclude navigation, footer, etc.
    const excludeElements = clonedBody.querySelectorAll(
      'nav, footer, header, [role="navigation"], [role="banner"], [role="contentinfo"], aside, .sidebar, #sidebar',
    )
    excludeElements.forEach((el) => el.remove())

    mainContent = clonedBody.textContent
  }

  // Clean up the text
  return cleanText(mainContent)
}

// Clean up extracted text
function cleanText(text) {
  return text
    .replace(/\s+/g, " ") // Replace multiple whitespace with single space
    .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
    .trim()
}

// Highlight text on the page
function highlightText(text) {
  // Remove previous highlight if exists
  if (highlightedElement) {
    const parent = highlightedElement.parentNode
    if (parent) {
      // Replace the highlight span with its original content
      parent.replaceChild(document.createTextNode(highlightedElement.textContent), highlightedElement)
      parent.normalize() // Merge adjacent text nodes
    }
    highlightedElement = null
  }

  if (!text) return

  // Function to search for text in an element and its children
  function searchAndHighlight(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      const content = element.textContent
      const index = content.indexOf(text)

      if (index >= 0) {
        // Split the text node into three parts: before match, match, and after match
        const before = content.substring(0, index)
        const match = content.substring(index, index + text.length)
        const after = content.substring(index + text.length)

        const parent = element.parentNode

        // Create text nodes for before and after
        if (before) {
          parent.insertBefore(document.createTextNode(before), element)
        }

        // Create highlighted span for the match
        const highlightSpan = document.createElement("span")
        highlightSpan.textContent = match
        highlightSpan.style.backgroundColor = "#FFFF00"
        highlightSpan.style.color = "#000000"
        highlightSpan.style.padding = "2px"
        highlightSpan.style.borderRadius = "2px"
        highlightSpan.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })

        parent.insertBefore(highlightSpan, element)
        highlightedElement = highlightSpan

        // Create text node for after
        if (after) {
          parent.insertBefore(document.createTextNode(after), element)
        }

        // Remove the original text node
        parent.removeChild(element)
        return true
      }
    } else if (
      element.nodeType === Node.ELEMENT_NODE &&
      !["script", "style", "noscript", "iframe"].includes(element.tagName.toLowerCase())
    ) {
      // Skip hidden elements
      const style = window.getComputedStyle(element)
      if (style.display === "none" || style.visibility === "hidden") {
        return false
      }

      // Search in child nodes
      for (let i = 0; i < element.childNodes.length; i++) {
        if (searchAndHighlight(element.childNodes[i])) {
          return true
        }
      }
    }

    return false
  }

  // Start search from body
  searchAndHighlight(document.body)
}
