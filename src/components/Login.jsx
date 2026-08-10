import React, { useState } from 'react';
import { Car, Lock, User, ArrowRight } from 'lucide-react';

function Login({ onLogin, apiBase }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('autohub_token', data.token);
        localStorage.setItem('autohub_user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Credenciais inválidas.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <Car size={36} color="var(--accent-primary)" />
          </div>
          <h1 className="login-title">Bem-vindo ao AutoHub</h1>
          <p className="login-subtitle">Acesse o sistema de gestão da oficina</p>
        </div>

        {error && <div className="error-msg" style={{ animation: 'fadeIn 0.3s' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">Usuário</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Seu e-mail ou usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="input-field"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                Entrar no Sistema <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
