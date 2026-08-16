export interface YamlRow {
  line: number
  indent: number
  path: string
  key: string
  value: string | number | boolean | null
  valueType: string
}

const MAX_ROWS = 50000

function countIndent(line: string): number {
  let count = 0
  while (count < line.length && line[count] === " ") {
    count += 1
  }
  return count
}

function stripInlineComment(value: string): string {
  let inSingle = false
  let inDouble = false

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === "'" && !inDouble) {
      inSingle = !inSingle
      continue
    }
    if (char === '"' && !inSingle) {
      inDouble = !inDouble
      continue
    }
    if (char === "#" && !inSingle && !inDouble) {
      return value.slice(0, i).trim()
    }
  }

  return value.trim()
}

function parseScalar(rawValue: string): string | number | boolean | null {
  const trimmed = rawValue.trim()
  if (!trimmed) return null

  if (trimmed === "null" || trimmed === "Null" || trimmed === "NULL") return null
  if (trimmed === "true" || trimmed === "True" || trimmed === "TRUE") return true
  if (trimmed === "false" || trimmed === "False" || trimmed === "FALSE") return false

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  const asNumber = Number(trimmed)
  if (!Number.isNaN(asNumber) && trimmed !== "") {
    return asNumber
  }

  return trimmed
}

function joinPath(tokens: string[], key?: string): string {
  const all = key ? [...tokens, key] : [...tokens]
  let path = ""
  all.forEach((token) => {
    if (token.startsWith("[")) {
      path += token
    } else {
      path += path ? `.${token}` : token
    }
  })
  return path
}

function readBlock(
  lines: string[],
  startIndex: number,
  parentIndent: number,
): { value: string; nextIndex: number } {
  const blockLines: string[] = []
  let i = startIndex + 1

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === "") {
      blockLines.push("")
      i += 1
      continue
    }

    const indent = countIndent(line)
    if (indent <= parentIndent) break

    const sliceIndex = Math.min(indent, parentIndent + 2)
    blockLines.push(line.slice(sliceIndex))
    i += 1
  }

  return { value: blockLines.join("\n").trimEnd(), nextIndex: i }
}

export function parseYamlToRows(yamlText: string): YamlRow[] {
  const lines = yamlText.split(/\r?\n/)
  const rows: YamlRow[] = []
  const stack: Array<{ indent: number; key: string }> = []
  const listCounters = new Map<number, number>()

  const resetStack = (indent: number) => {
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }
    for (const key of Array.from(listCounters.keys())) {
      if (key >= indent) listCounters.delete(key)
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    if (rows.length >= MAX_ROWS) break

    const rawLine = lines[i]
    const trimmedLine = rawLine.trim()
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const indent = countIndent(rawLine)

    if (trimmedLine.startsWith("- ")) {
      resetStack(indent)
      const index = (listCounters.get(indent) ?? -1) + 1
      listCounters.set(indent, index)
      stack.push({ indent, key: `[${index}]` })

      const rest = trimmedLine.slice(2).trim()
      if (!rest) {
        rows.push({
          line: i + 1,
          indent,
          path: joinPath(stack.map((item) => item.key)),
          key: "",
          value: null,
          valueType: "null",
        })
        continue
      }

      const colonIndex = rest.indexOf(":")
      if (colonIndex === -1) {
        const value = parseScalar(stripInlineComment(rest))
        rows.push({
          line: i + 1,
          indent,
          path: joinPath(stack.map((item) => item.key)),
          key: "",
          value,
          valueType: value === null ? "null" : typeof value,
        })
        continue
      }

      const rawKey = rest.slice(0, colonIndex).trim()
      let rawValue = rest.slice(colonIndex + 1).trim()
      rawValue = stripInlineComment(rawValue)

      if (rawValue === "|" || rawValue === ">") {
        const block = readBlock(lines, i, indent)
        rows.push({
          line: i + 1,
          indent,
          path: joinPath(stack.map((item) => item.key), rawKey),
          key: rawKey,
          value: block.value,
          valueType: "string",
        })
        i = block.nextIndex - 1
        continue
      }

      const value = parseScalar(rawValue)
      rows.push({
        line: i + 1,
        indent,
        path: joinPath(stack.map((item) => item.key), rawKey),
        key: rawKey,
        value,
        valueType: value === null ? "null" : typeof value,
      })

      if (rawValue === "") {
        stack.push({ indent, key: rawKey })
      }

      continue
    }

    resetStack(indent)
    const colonIndex = trimmedLine.indexOf(":")
    if (colonIndex === -1) {
      continue
    }

    const rawKey = trimmedLine.slice(0, colonIndex).trim()
    let rawValue = trimmedLine.slice(colonIndex + 1).trim()
    rawValue = stripInlineComment(rawValue)

    if (rawValue === "|" || rawValue === ">") {
      const block = readBlock(lines, i, indent)
      rows.push({
        line: i + 1,
        indent,
        path: joinPath(stack.map((item) => item.key), rawKey),
        key: rawKey,
        value: block.value,
        valueType: "string",
      })
      i = block.nextIndex - 1
      continue
    }

    const value = parseScalar(rawValue)
    rows.push({
      line: i + 1,
      indent,
      path: joinPath(stack.map((item) => item.key), rawKey),
      key: rawKey,
      value,
      valueType: value === null ? "null" : typeof value,
    })

    if (rawValue === "") {
      stack.push({ indent, key: rawKey })
    }
  }

  return rows
}
