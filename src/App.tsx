import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Nav } from './routes/Nav'
import { ProtectedRoute, PublicOnlyRoute } from './routes/ProtectedRoute'
import { AdminRoute } from './routes/AdminRoute'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { HabitListPage } from './features/habits/HabitListPage'
import { HabitFormPage } from './features/habits/HabitFormPage'
import { HabitDetailPage } from './features/habits/HabitDetailPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { UserListPage } from './features/admin/UserListPage'
import { UserHabitsPage } from './features/admin/UserHabitsPage'
import { AllHabitsPage } from './features/admin/AllHabitsPage'
import { useAuthStore } from './features/auth/useAuthStore'
import { refresh } from './api/auth'

// Boot da app: o accessToken só vive em memória (Zustand), então um F5
// zera o store. O cookie httpOnly de refresh sobrevive — tentamos
// /refresh uma vez antes de decidir se a sessão existe ou não, pra não
// mandar direto pro login quem só recarregou a página.
function useBootstrapSession() {
  const setSession = useAuthStore((s) => s.setSession)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    refresh()
      .then(setSession)
      .catch(() => setStatus('guest'))
  }, [setSession, setStatus])
}

function AppRoutes() {
  useBootstrapSession()

  return (
    <>
      <Nav />
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<SignupPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/habitos" element={<HabitListPage />} />
          <Route path="/habitos/novo" element={<HabitFormPage />} />
          <Route path="/habitos/:id" element={<HabitDetailPage />} />
          <Route path="/habitos/:id/editar" element={<HabitFormPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/usuarios" element={<UserListPage />} />
          <Route path="/admin/usuarios/:userId" element={<UserHabitsPage />} />
          <Route path="/admin/habitos" element={<AllHabitsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/habitos" replace />} />
        <Route path="*" element={<Navigate to="/habitos" replace />} />
      </Routes>
    </>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
