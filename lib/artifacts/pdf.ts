const escapePdfText = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

const buildTextStream = (lines: string[]) => {
  const escaped = lines.map(escapePdfText)
  const streamLines = ["BT", "/F1 12 Tf", "72 720 Td"]
  escaped.forEach((line, index) => {
    if (index === 0) {
      streamLines.push(`(${line}) Tj`)
    } else {
      streamLines.push("0 -18 Td")
      streamLines.push(`(${line}) Tj`)
    }
  })
  streamLines.push("ET")
  return streamLines.join("\n")
}

export function buildPdfBase64(lines: string[]): string {
  const textStream = buildTextStream(lines)
  const length = Buffer.byteLength(textStream, "utf8")

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${length} >>\nstream\n${textStream}\nendstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  ]

  const header = "%PDF-1.4\n"
  let body = ""
  const offsets: number[] = [0]
  let currentOffset = Buffer.byteLength(header, "utf8")

  for (const obj of objects) {
    offsets.push(currentOffset)
    body += obj
    currentOffset += Buffer.byteLength(obj, "utf8")
  }

  const xrefOffset = Buffer.byteLength(header + body, "utf8")
  const xrefEntries = offsets
    .map((offset, index) => {
      if (index === 0) return "0000000000 65535 f \n"
      return `${offset.toString().padStart(10, "0")} 00000 n \n`
    })
    .join("")

  const xref = `xref\n0 ${objects.length + 1}\n${xrefEntries}`
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  const pdf = header + body + xref + trailer
  return Buffer.from(pdf, "utf8").toString("base64")
}
