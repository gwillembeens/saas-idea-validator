import { NavBar } from './NavBar'

export function AppShell({ children }) {
  return (
    <div
      style={{
        backgroundColor: '#fdfbf7',
        backgroundImage: 'radial-gradient(#e5e0d8 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="min-h-screen w-full"
    >
      <NavBar />
      {children}
    </div>
  )
}
