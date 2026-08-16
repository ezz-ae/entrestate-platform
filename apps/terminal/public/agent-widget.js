(() => {
  const script = document.currentScript
  if (!script) return

  const agent = script.getAttribute("data-agent") || "entrestate-dm"
  const name = script.getAttribute("data-name") || "Entrestate Lead Agent"
  const theme = script.getAttribute("data-theme") || "dark"
  const host = script.getAttribute("data-host") || window.location.origin

  const wrapper = document.createElement("div")
  wrapper.style.position = "relative"
  wrapper.style.maxWidth = "420px"
  wrapper.style.margin = "0"

  const header = document.createElement("div")
  header.textContent = name
  header.style.fontFamily = "system-ui, -apple-system, sans-serif"
  header.style.fontSize = "14px"
  header.style.fontWeight = "600"
  header.style.padding = "10px 12px"
  header.style.background = theme === "dark" ? "#0a0a0a" : "#f5f5f5"
  header.style.color = theme === "dark" ? "#ededed" : "#111111"
  header.style.border = theme === "dark" ? "1px solid #262626" : "1px solid #e5e5e5"
  header.style.borderBottom = "none"
  header.style.borderRadius = "12px 12px 0 0"

  const iframe = document.createElement("iframe")
  iframe.src = `${host}/lead-agent/embed?agent=${encodeURIComponent(agent)}`
  iframe.title = name
  iframe.style.width = "100%"
  iframe.style.height = "520px"
  iframe.style.border = theme === "dark" ? "1px solid #262626" : "1px solid #e5e5e5"
  iframe.style.borderRadius = "0 0 12px 12px"
  iframe.style.background = theme === "dark" ? "#000" : "#fff"

  wrapper.appendChild(header)
  wrapper.appendChild(iframe)

  script.parentNode?.insertBefore(wrapper, script.nextSibling)
})()
