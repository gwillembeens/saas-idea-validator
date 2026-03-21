export function generateShareUrls(title, resultUrl) {
  const shareText = `I just validated my startup idea '${title}' — check out the score:`

  return {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(resultUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(resultUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + resultUrl)}`,
  }
}
