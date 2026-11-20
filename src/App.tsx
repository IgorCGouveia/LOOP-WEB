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
import { bootstrapSession } from './features/auth/bootstrap'

// Boot da app: tenta /refresh antes de decidir se a sessão existe — ver
// src/features/auth/bootstrap.ts. O efeito duplo do StrictMode em dev
// compartilha o mesmo POST /refresh (src/api/client.ts, refreshSession).
function useBootstrapSession() {
  useEffect(() => {
    void bootstrapSession()
  }, [])
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
