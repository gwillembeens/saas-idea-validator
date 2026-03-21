import { useDispatch, useSelector } from 'react-redux'
import { startValidation, startStreaming, appendResult, finishValidation, setError } from '../store/slices/validatorSlice.js'

export function useValidate() {
  const dispatch = useDispatch()
  const { idea, status, result, error } = useSelector(s => s.validator)

  async function validate() {
    dispatch(startValidation())
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      })
      if (!res.ok) throw new Error('Server error')
      dispatch(startStreaming())
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        dispatch(appendResult(decoder.decode(value)))
      }
      dispatch(finishValidation())
    } catch (e) {
      dispatch(setError(e.message))
    }
  }

  return { idea, status, result, error, validate }
}
