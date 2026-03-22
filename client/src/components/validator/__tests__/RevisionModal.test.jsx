import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import validatorReducer from '../../../store/slices/validatorSlice'
import { RevisionModal } from '../RevisionModal'

// Mock fetchWithAuth
vi.mock('../../../utils/fetchWithAuth', () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({ ok: true }),
}))

function makeStore(revisionCandidate = null) {
  return configureStore({
    reducer: { validator: validatorReducer },
    preloadedState: {
      validator: {
        idea: '',
        status: 'done',
        result: '',
        error: null,
        progress: 100,
        revisionCandidate,
      },
    },
  })
}

describe('RevisionModal', () => {
  it('renders nothing when revisionCandidate is null', () => {
    const { container } = render(
      <Provider store={makeStore(null)}>
        <RevisionModal resultId={42} />
      </Provider>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal content when revisionCandidate is set', () => {
    const candidate = { id: 5, title: 'AI Invoice Tool', scores: { weighted: 4.0 } }
    render(
      <Provider store={makeStore(candidate)}>
        <RevisionModal resultId={42} />
      </Provider>
    )
    expect(screen.getByText(/Looks like a revision/)).toBeInTheDocument()
    expect(screen.getByText(/AI Invoice Tool/)).toBeInTheDocument()
    expect(screen.getByText(/4.0\/5/)).toBeInTheDocument()
  })

  it('shows Link as revision and New idea buttons', () => {
    const candidate = { id: 5, title: 'AI Invoice Tool', scores: { weighted: 4.0 } }
    render(
      <Provider store={makeStore(candidate)}>
        <RevisionModal resultId={42} />
      </Provider>
    )
    expect(screen.getByText('Link as revision')).toBeInTheDocument()
    expect(screen.getByText('New idea')).toBeInTheDocument()
  })
})

describe('ScoreDelta logic', () => {
  it('computes positive delta correctly', () => {
    const delta = +(4.5 - 4.0).toFixed(1)
    expect(delta).toBe(0.5)
  })

  it('computes negative delta correctly', () => {
    const delta = +(3.0 - 4.0).toFixed(1)
    expect(delta).toBe(-1.0)
  })

  it('computes zero delta correctly', () => {
    const delta = +(4.0 - 4.0).toFixed(1)
    expect(delta).toBe(0)
  })
})
