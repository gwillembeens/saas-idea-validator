// Splits Claude's markdown response into logical sections.
// Returns { ideaSummary, commentary, verdict } or null on failure.
// Claude's system prompt guarantees these headings in this order:
//   ## 📋 Idea Summary
//   ## 🔬 Scorecard      ← stripped/ignored
//   ## 📝 Commentary
//   ## ✅ Verdict

export function parseSections(markdown) {
  try {
    if (!markdown || !markdown.trim()) return null

    // Split by any ## heading
    const sections = {}

    // Extract Idea Summary: content between ## 📋 Idea Summary and next ##
    const ideaSummaryMatch = markdown.match(
      /## 📋 Idea Summary\n([\s\S]*?)(?=\n## |\n---\n##|$)/
    )
    sections.ideaSummary = ideaSummaryMatch ? ideaSummaryMatch[1].trim() : ''

    // Extract Commentary: content between ## 📝 Commentary and next ##
    const commentaryMatch = markdown.match(
      /## 📝 Commentary\n([\s\S]*?)(?=\n## |\n---\n##|$)/
    )
    sections.commentary = commentaryMatch ? commentaryMatch[1].trim() : ''

    // Extract Verdict: content between ## ✅ Verdict and end
    const verdictMatch = markdown.match(
      /## ✅ Verdict\n([\s\S]*?)(?=\n## |\n---\n##|$)/
    )
    sections.verdict = verdictMatch ? verdictMatch[1].trim() : ''

    // If all sections are empty, parsing completely failed — return null
    if (
      !sections.ideaSummary &&
      !sections.commentary &&
      !sections.verdict
    ) {
      return null
    }

    return sections
  } catch {
    return null
  }
}
