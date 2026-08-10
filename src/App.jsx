import React, { useState } from 'react';
import { LayoutDashboard, Users, Car, FileText, CalendarRange, Shield, LogOut } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Clientes from './components/Clientes';
import Veiculos from './components/Veiculos';
import OrdensServico from './components/OrdensServico';
import Agendamentos from './components/Agendamentos';
import Usuarios from './components/Usuarios';
import Login from './components/Login';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('autohub_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabProps, setTabProps] = useState({});

  const handleTabChange = (tab, props = {}) => {
    setActiveTab(tab);
    setTabProps(props);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard apiBase={API_BASE_URL} setActiveTab={handleTabChange} userRole={user?.role} />;
      case 'clientes':
        return <Clientes apiBase={API_BASE_URL} {...tabProps} userRole={user?.role} />;
      case 'veiculos':
        return <Veiculos apiBase={API_BASE_URL} {...tabProps} userRole={user?.role} />;
      case 'ordens':
        return <OrdensServico apiBase={API_BASE_URL} {...tabProps} userRole={user?.role} />;
      case 'agendamentos':
        return <Agendamentos apiBase={API_BASE_URL} {...tabProps} userRole={user?.role} />;
      case 'usuarios':
        return user?.role === 'admin' ? <Usuarios apiBase={API_BASE_URL} /> : <Dashboard apiBase={API_BASE_URL} setActiveTab={handleTabChange} userRole={user?.role} />;
      default:
        return <Dashboard apiBase={API_BASE_URL} setActiveTab={handleTabChange} userRole={user?.role} />;
    }
  };

  if (!isAuthenticated) {
    return <Login apiBase={API_BASE_URL} onLogin={(userData) => setUser(userData)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('autohub_token');
    localStorage.removeItem('autohub_user');
    setUser(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar de Navegação */}
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/car-logo-generated.png" alt="AutoHub" style={{ width: '42px', height: 'auto', borderRadius: '4px' }} />
          <span className="logo-text">AutoHub</span>
        </div>
        <nav>
          <ul className="nav-links">
            <li>
              <a
                href="#dashboard"
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
              >
                <LayoutDashboard size={20} />
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#clientes"
                className={`nav-item ${activeTab === 'clientes' ? 'active' : ''}`}
                onClick={() => handleTabChange('clientes')}
              >
                <Users size={20} />
                Clientes
              </a>
            </li>
            <li>
              <a
                href="#veiculos"
                className={`nav-item ${activeTab === 'veiculos' ? 'active' : ''}`}
                onClick={() => handleTabChange('veiculos')}
              >
                <Car size={20} />
                Veículos
              </a>
            </li>
            <li>
              <a
                href="#ordens"
                className={`nav-item ${activeTab === 'ordens' ? 'active' : ''}`}
                onClick={() => handleTabChange('ordens')}
              >
                <FileText size={20} />
                Serviços
              </a>
            </li>
            <li>
              <a
                href="#agendamentos"
                className={`nav-item ${activeTab === 'agendamentos' ? 'active' : ''}`}
                onClick={() => handleTabChange('agendamentos')}
              >
                <CalendarRange size={20} />
                Agendamentos
              </a>
            </li>
            {user?.role === 'admin' && (
              <li>
                <a
                  href="#usuarios"
                  className={`nav-item ${activeTab === 'usuarios' ? 'active' : ''}`}
                  onClick={() => handleTabChange('usuarios')}
                >
                  <Shield size={20} />
                  Usuários
                </a>
              </li>
            )}
          </ul>
        </nav>
        
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.nome.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.nome}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.role === 'admin' ? 'Administrador' : 'Funcionário'}</div>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
export { API_BASE_URL };
