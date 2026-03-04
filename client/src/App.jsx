import { useSelector } from 'react-redux';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
  const { token } = useSelector((state) => state.auth);

  return token ? <Dashboard /> : <AuthPage />;
}

export default App;
