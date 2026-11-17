
import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import AccountsPage from './pages/AccountsPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import BudgetsPage from './pages/BudgetsPage.jsx'
import SavingGoalsPage from './pages/SavingGoalsPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import { useAuth } from './hooks/useAuth.js'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="/accounts"
          element={<AccountsPage />}
        />
        <Route
          path="/transactions"
          element={<TransactionsPage />}
        />
        <Route
          path="/budgets"
          element={<BudgetsPage />}
        />
        <Route
          path="/saving-goals"
          element={<SavingGoalsPage />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />
    </Routes>
  )
}

export default App
