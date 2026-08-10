import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Shield, User } from 'lucide-react';

function Usuarios({ apiBase }) {
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('usuarios');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'funcionario' });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiBase}/usuarios`);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`${apiBase}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchLogs();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ nome: '', email: '', senha: '', role: 'funcionario' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingId(user.id);
    setForm({ nome: user.nome, email: user.email, senha: '', role: user.role });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        const res = await apiFetch(`${apiBase}/usuarios/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setSuccessMsg('Usuário removido.');
          setTimeout(() => setSuccessMsg(''), 3000);
          fetchUsuarios();
        } else {
          alert('Erro ao remover usuário.');
        }
      } catch (err) {
        alert('Erro ao processar remoção.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!editingId && !form.senha) {
      setErrorMsg('A senha é obrigatória para novos usuários.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiBase}/usuarios/${editingId}` : `${apiBase}/usuarios`;

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setSuccessMsg(editingId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsuarios();
      } else {
        setErrorMsg(data.error || 'Erro ao processar dados.');
      }
    } catch (err) {
      setErrorMsg('Erro na conexão com o servidor.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações de Acesso</h1>
          <p className="page-subtitle">Gerenciamento de usuários e monitoramento de API.</p>
        </div>
        {activeTab === 'usuarios' && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Novo Usuário
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button 
          onClick={() => setActiveTab('usuarios')} 
          style={{ padding: '10px 0', background: 'none', border: 'none', borderBottom: activeTab === 'usuarios' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'usuarios' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer' }}>
          Gestão de Usuários
        </button>
        <button 
          onClick={() => setActiveTab('logs')} 
          style={{ padding: '10px 0', background: 'none', border: 'none', borderBottom: activeTab === 'logs' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'logs' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 'bold', cursor: 'pointer' }}>
          Monitoramento de API
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {successMsg}
        </div>
      )}

      {/* Abas */}
      {activeTab === 'usuarios' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Nível de Acesso</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty-state" style={{ padding: '48px' }}>
                    <p>Buscando registros...</p>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state">
                      <User size={48} />
                      <p>Nenhum usuário cadastrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.nome}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role === 'admin' ? 'aberta' : 'agendado'}`}>
                        {u.role === 'admin' ? <><Shield size={12} style={{marginRight: 4}} /> Administrador</> : 'Funcionário'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(u)}>
                          <Edit3 size={18} />
                        </button>
                        <button className="icon-btn danger" title="Excluir" onClick={() => handleDelete(u.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Tráfego Recente (Últimas 100 requisições)</h3>
            <button className="btn btn-secondary" onClick={fetchLogs} style={{ padding: '6px 12px', fontSize: '12px' }}>Atualizar</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Método</th>
                <th>Rota Acessada</th>
                <th>Status</th>
                <th>Tempo (ms)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state" style={{ padding: '48px' }}>
                    <p>Nenhum log registrado ainda.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="nowrap">{new Date(log.created_at.replace('Z', '')).toLocaleString('pt-BR')}</td>
                    <td>{log.user_nome ? log.user_nome : 'Anônimo'}</td>
                    <td>
                      <span className={`badge`} style={{
                        backgroundColor: log.method === 'GET' ? 'rgba(59, 130, 246, 0.2)' : log.method === 'POST' ? 'rgba(16, 185, 129, 0.2)' : log.method === 'DELETE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: log.method === 'GET' ? '#60A5FA' : log.method === 'POST' ? '#34D399' : log.method === 'DELETE' ? '#F87171' : '#FBBF24'
                      }}>
                        {log.method}
                      </span>
                    </td>
                    <td><code>{log.url}</code></td>
                    <td>
                      <span style={{ color: log.status >= 400 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>{log.status}</span>
                    </td>
                    <td>{log.response_time}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="modal-body">
                {errorMsg && <div className="error-msg">{errorMsg}</div>}

                <div className="input-group">
                  <label className="input-label">Nome Completo</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: João Silva"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Email / Usuário</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: joao.silva"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Senha {editingId && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(Deixe em branco para manter a atual)</span>}</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nível de Acesso</label>
                  <select
                    className="input-field"
                    required
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="funcionario">Funcionário (Acesso Limitado)</option>
                    <option value="admin">Administrador (Acesso Total)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Salvar Alterações' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
