import { useDispatch, useSelector } from 'react-redux'
import { setIdea } from '../../store/slices/validatorSlice'
import { useValidate } from '../../hooks/useValidate'
import { Button } from '../ui/Button'
import { TextArea } from '../ui/TextArea'
import { Card } from '../ui/Card'

export function IdeaInput() {
  const dispatch = useDispatch()
  const { idea, status } = useSelector(s => s.validator)
  const { validate } = useValidate()

  const isLoading = status === 'loading' || status === 'streaming'

  function handleSubmit(e) {
    e.preventDefault()
    if (!isLoading) validate()
  }

  return (
    <Card decoration="tape" rotate={-1} className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="font-heading text-3xl text-pencil">
          Your SaaS Idea
        </label>
        <TextArea
          value={idea}
          onChange={e => dispatch(setIdea(e.target.value))}
          placeholder="Describe your SaaS idea in a few sentences. Include the target customer, the problem, and your proposed solution..."
          disabled={isLoading}
          className="min-h-[180px]"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || idea.trim().length < 20}
        >
          {isLoading ? 'Validating...' : 'Validate Idea'}
        </Button>
      </form>
    </Card>
  )
}
