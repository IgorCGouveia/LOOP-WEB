import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Nav } from './Nav'
import { useAuthStore } from '../features/auth/useAuthStore'
import { ToastProvider } from '../components/Toast'

function renderAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Nav />
      </MemoryRouter>
    </ToastProvider>,
  )
}

// Regression for #1: below `sm` labels used `hidden`, leaving links and logout unnamed.
describe('Nav accessibility', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession({ accessToken: 't', id: '1', name: 'Admin', role: 'ADMIN' })
  })

  // jsdom applies no CSS, so this cannot tell `hidden` from `sr-only`; it guards against
  // the label text being removed or moved out of the link, not against responsive hiding.
  it('gives every link and the logout button an accessible name', () => {
    renderAt('/habitos')
    for (const name of ['Hábitos', 'Minha conta', 'Usuários', 'Todos hábitos']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('keeps icons out of the accessibility tree', () => {
    const { container } = renderAt('/habitos')
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0)
  })

  it.each([
    ['/habitos', 'Hábitos'],
    ['/perfil', 'Minha conta'],
    ['/admin/usuarios/9', 'Usuários'],
    ['/admin/habitos', 'Todos hábitos'],
  ])('marks the current route with aria-current at %s', (path, current) => {
    renderAt(path)
    const marked = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(marked.map((l) => l.textContent)).toEqual([current])
  })

  it('marks no link on habit subroutes, since "Hábitos" matches only the list', () => {
    renderAt('/habitos/123')
    expect(screen.getAllByRole('link').some((l) => l.hasAttribute('aria-current'))).toBe(false)
  })
})
