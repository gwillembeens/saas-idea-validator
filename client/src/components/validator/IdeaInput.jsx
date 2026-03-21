import { useDispatch, useSelector } from 'react-redux'
import { setIdea } from '../../store/slices/validatorSlice'
import { useValidate } from '../../hooks/useValidate'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/TextArea'
import { Card } from '../ui/Card'

export function IdeaInput() {
  const dispatch = useDispatch()
  const { idea, status } = useSelector(s => s.validator)
  const { validate } = useValidate()
  const { user, openModal, setPendingValidation } = useAuth()

  const isLoading = status === 'loading' || status === 'streaming'

  function handleValidate() {
    if (!user) {
      setPendingValidation(true)
      openModal('login')
      return
    }
    validate()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!isLoading) handleValidate()
  }

  return (
    <Card decoration="tape" rotate={-1} className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
        <label htmlFor="idea-input" className="font-heading text-2xl md:text-3xl text-pencil">
          Your SaaS Idea
        </label>
        <TextArea
          id="idea-input"
          value={idea}
          onChange={e => dispatch(setIdea(e.target.value))}
          placeholder="Describe your SaaS idea in a few sentences. Include the target customer, the problem, and your proposed solution..."
          disabled={isLoading}
          className="min-h-[180px] md:min-h-[220px]"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || idea.trim().length < 20}
          aria-busy={isLoading}
        >
          {isLoading ? 'Validating...' : 'Validate Idea'}
        </Button>
      </form>
    </Card>
  )
}
