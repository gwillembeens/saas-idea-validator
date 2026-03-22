import { useDispatch, useSelector } from 'react-redux'
import { startValidation, startStreaming, appendResult, finishValidation, setError, setProgress, setRevisionCandidate } from '../store/slices/validatorSlice.js'
import { parseScores } from '../utils/parseResult.js'
import { fetchWithAuth } from '../utils/fetchWithAuth.js'

export function useValidate() {
  const dispatch = useDispatch()
  const { idea, status, result, error, progress } = useSelector(s => s.validator)
  const user = useSelector(s => s.auth.user)

  async function validate() {
    dispatch(startValidation())
    let progressInterval = null
    try {
      dispatch(setProgress(15))
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      })
      if (!res.ok) throw new Error('Server error')
      dispatch(startStreaming())
      dispatch(setProgress(40))
      let currentProgress = 40
      progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 2, 90)
        dispatch(setProgress(currentProgress))
      }, 500)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullResult = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullResult += chunk
        dispatch(appendResult(chunk))
      }
      if (progressInterval) clearInterval(progressInterval)
      dispatch(finishValidation())

      // Auto-save if user is authenticated
      if (user) {
        const scores = parseScores(fullResult)
        if (scores) {
          try {
            const saveRes = await fetchWithAuth('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                idea_text: idea,
                markdown_result: fullResult,
                scores,
              }),
            })
            if (saveRes.ok) {
              const saveData = await saveRes.json()
              if (saveData.similarTo) {
                dispatch(setRevisionCandidate(saveData.similarTo))
              }
            }
          } catch (saveErr) {
            console.error('Auto-save failed:', saveErr)
            // Silent fail — validation result is still visible
          }
        }
      }
    } catch (e) {
      if (progressInterval) clearInterval(progressInterval)
      dispatch(setError(e.message))
    }
  }

  return { idea, status, result, error, progress, validate }
}
