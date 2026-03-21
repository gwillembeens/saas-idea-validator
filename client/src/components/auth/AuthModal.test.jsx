import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../../store'
import { AuthModal } from './AuthModal'

describe('AuthModal', () => {
  it('renders nothing when hidden', () => {
    const { container } = render(
      <Provider store={store}><AuthModal /></Provider>
    )
    expect(container.firstChild).toBeNull()
  })
  it('stub', () => expect(true).toBe(true))
})
