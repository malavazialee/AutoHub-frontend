import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, X, Eye, Users } from 'lucide-react';
import { maskCPF, maskTelefone } from '../utils/masks';

function Clientes({ apiBase, userRole }) {
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({ nome: '', cpf: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', cpf: '', telefone: '', email: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // Details State
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clientVehicles, setClientVehicles] = useState([]);
  const [clientOS, setClientOS] = useState([]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filtros).toString();
      const res = await apiFetch(`${apiBase}/clientes?${queryParams}`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [filtros]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ nome: '', cpf: '', telefone: '', email: '' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (cliente) => {
    setEditingId(cliente.id);
    setForm({ nome: cliente.nome, cpf: cliente.cpf, telefone: cliente.telefone, email: cliente.email });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenDetails = async (cliente) => {
    setSelectedCliente(cliente);
    try {
      // Fetch vehicles of client
      const resV = await apiFetch(`${apiBase}/veiculos`);
      const allVehicles = await resV.json();
      const vehicles = allVehicles.filter(v => v.cliente_id === cliente.id);
      setClientVehicles(vehicles);

      // Fetch OS of client
      const resOS = await apiFetch(`${apiBase}/clientes/${cliente.id}/ordens`);
      const os = await resOS.json();
      setClientOS(os);
      
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Erro ao buscar detalhes do cliente:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const res = await apiFetch(`${apiBase}/clientes/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          alert('Cliente excluído com sucesso.');
          fetchClientes();
        } else {
          alert(data.error || 'Erro ao excluir cliente.');
        }
      } catch (err) {
        alert('Erro ao excluir cliente.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiBase}/clientes/${editingId}` : `${apiBase}/clientes`;

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setSuccessMsg(editingId ? 'Alterações salvas com sucesso!' : 'Cliente cadastrado com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchClientes();
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
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gerenciamento e histórico dos proprietários dos veículos.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {successMsg}
        </div>
      )}

      {/* Filtros */}
      <div className="card filters-bar">
        <div className="input-group">
          <label className="input-label">Nome</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por nome"
            value={filtros.nome}
            onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">CPF</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por CPF"
            value={filtros.cpf}
            onChange={(e) => setFiltros({ ...filtros, cpf: maskCPF(e.target.value) })}
            maxLength="14"
          />
        </div>
        <div className="input-group">
          <label className="input-label">E-mail</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por e-mail"
            value={filtros.email}
            onChange={(e) => setFiltros({ ...filtros, email: e.target.value })}
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th className="nowrap">CPF</th>
              <th className="nowrap">Telefone</th>
              <th>E-mail</th>
              <th className="nowrap" style={{ width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-state" style={{ padding: '48px' }}>
                  <p>Buscando registros...</p>
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">
                    <Users size={48} />
                    <p>Nenhum cliente cadastrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td><strong>{cliente.nome}</strong></td>
                  <td className="nowrap">{cliente.cpf}</td>
                  <td className="nowrap">{cliente.telefone}</td>
                  <td>{cliente.email}</td>
                  <td className="nowrap">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" title="Visualizar Detalhes" onClick={() => handleOpenDetails(cliente)}>
                        <Eye size={18} />
                      </button>
                      <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); handleOpenEdit(cliente); }}>
                        <Edit3 size={18} />
                      </button>
                      {userRole !== 'funcionario' && (
                        <button className="icon-btn danger" title="Excluir" onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id); }}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}
                
                <div className="input-group" style={{ marginBottom: '16px' }}>
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

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">CPF</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: 123.456.789-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                    maxLength="14"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">Telefone</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: (18) 99999-9999"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                    maxLength="15"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">E-mail</label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    placeholder="Ex: joao.silva@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
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

      {/* Modal Detalhes do Cliente */}
      {showDetailsModal && selectedCliente && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalhes do Proprietário</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Informações Pessoais */}
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Dados Cadastrais</h4>
                  <p><strong>Nome:</strong> {selectedCliente.nome}</p>
                  <p><strong>CPF:</strong> {selectedCliente.cpf}</p>
                  <p><strong>Telefone:</strong> {selectedCliente.telefone}</p>
                  <p><strong>E-mail:</strong> {selectedCliente.email}</p>
                </div>
                <div className="detail-section">
                  <h4>Veículos Associados</h4>
                  {clientVehicles.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhum veículo cadastrado para este cliente.</p>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {clientVehicles.map(v => (
                        <li key={v.id} style={{ marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                          <strong>{v.marca} {v.modelo}</strong> — Placa: <code>{v.placa}</code> ({v.quilometragem} km)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Histórico de OS */}
              <div className="card">
                <h4 className="input-label" style={{ marginBottom: '12px' }}>Histórico de Ordens de Serviço</h4>
                {clientOS.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhuma ordem de serviço registrada.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>OS ID</th>
                          <th>Veículo</th>
                          <th>Data Abertura</th>
                          <th>Valor Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientOS.map(os => (
                          <tr key={os.id}>
                            <td>#{os.id}</td>
                            <td>{os.modelo} ({os.placa})</td>
                            <td>{new Date(os.data_abertura.replace('Z', '')).toLocaleDateString('pt-BR')}</td>
                            <td>R$ {parseFloat(os.valor_total).toFixed(2)}</td>
                            <td>
                              <span className={`badge badge-${os.status}`}>
                                {os.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
