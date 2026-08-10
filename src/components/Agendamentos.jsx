import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, X, CalendarRange, Check } from 'lucide-react';

function Agendamentos({ apiBase, initialData = '', userRole }) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [filtros, setFiltros] = useState({ data: initialData, cliente_id: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ cliente_id: '', veiculo_id: '', data_hora: '', servico_solicitado: '', status: 'agendado' });
  const [formVehicles, setFormVehicles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filtros).toString();
      const res = await apiFetch(`${apiBase}/agendamentos?${queryParams}`);
      const data = await res.json();
      setAgendamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [resC, resV] = await Promise.all([
        apiFetch(`${apiBase}/clientes`),
        apiFetch(`${apiBase}/veiculos`)
      ]);
      const cData = await resC.json();
      const vData = await resV.json();
      setClientes(Array.isArray(cData) ? cData : []);
      setVeiculos(Array.isArray(vData) ? vData : []);
    } catch (err) {
      console.error('Erro ao carregar clientes/veículos:', err);
    }
  };

  useEffect(() => {
    fetchAgendamentos();
  }, [filtros]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update vehicle dropdown in form based on client selection
  useEffect(() => {
    if (form.cliente_id) {
      const filtered = veiculos.filter(v => v.cliente_id === parseInt(form.cliente_id));
      setFormVehicles(filtered);
      // Auto select first vehicle if not editing or if current vehicle doesn't belong to the client
      if (!editingId || !filtered.some(v => v.id === parseInt(form.veiculo_id))) {
        setForm(prev => ({ ...prev, veiculo_id: filtered[0]?.id || '' }));
      }
    } else {
      setFormVehicles([]);
      setForm(prev => ({ ...prev, veiculo_id: '' }));
    }
  }, [form.cliente_id, veiculos]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ cliente_id: '', veiculo_id: '', data_hora: '', servico_solicitado: '', status: 'agendado' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (agend) => {
    setEditingId(agend.id);
    
    // Format date string for datetime-local input (YYYY-MM-DDTHH:MM)
    const dateObj = new Date(agend.data_hora);
    // Adjust timezone offsets manually
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - (offset*60*1000));
    const formattedDate = localDate.toISOString().slice(0, 16);

    setForm({
      cliente_id: agend.cliente_id,
      veiculo_id: agend.veiculo_id,
      data_hora: formattedDate,
      servico_solicitado: agend.servico_solicitado,
      status: agend.status ? agend.status.toLowerCase() : 'agendado'
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
      try {
        const res = await apiFetch(`${apiBase}/agendamentos/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Agendamento removido.');
          fetchAgendamentos();
        } else {
          alert('Erro ao remover agendamento.');
        }
      } catch (err) {
        alert('Erro ao processar remoção.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiBase}/agendamentos/${editingId}` : `${apiBase}/agendamentos`;

    // Convert local datetime string to UTC ISO string before sending
    const dataToSend = { ...form };
    if (dataToSend.data_hora) {
      dataToSend.data_hora = new Date(dataToSend.data_hora).toISOString();
    }

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setSuccessMsg(editingId ? 'Alterações salvas com sucesso!' : 'Agendamento criado com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchAgendamentos();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar agendamento.');
      }
    } catch (err) {
      setErrorMsg('Erro na conexão com o servidor.');
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.replace('Z', ''));
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">Gerencie visitas agendadas de clientes para manutenção.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Novo Agendamento
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
          <label className="input-label">Data</label>
          <input
            type="date"
            className="input-field"
            max="9999-12-31"
            value={filtros.data}
            onChange={(e) => setFiltros({ ...filtros, data: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Cliente</label>
          <select
            className="input-field"
            value={filtros.cliente_id}
            onChange={(e) => setFiltros({ ...filtros, cliente_id: e.target.value })}
          >
            <option value="">Todos</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Veículo (Placa)</th>
              <th className="nowrap">Data e Horário</th>
              <th>Serviço Solicitado</th>
              <th className="nowrap">Status</th>
              <th className="nowrap" style={{ width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-state" style={{ padding: '48px' }}>
                  <p>Buscando registros...</p>
                </td>
              </tr>
            ) : agendamentos.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <CalendarRange size={48} />
                    <p>Nenhum agendamento agendado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              agendamentos.map((agend) => (
                <tr key={agend.id}>
                  <td><strong>{agend.cliente_nome}</strong></td>
                  <td>{agend.veiculo_marca} {agend.veiculo_modelo} (<code>{agend.veiculo_placa}</code>)</td>
                  <td className="nowrap">{formatDate(agend.data_hora)}</td>
                  <td>{agend.servico_solicitado}</td>
                  <td className="nowrap">
                    <span className={`badge badge-${agend.status ? agend.status.toLowerCase() : 'agendado'}`}>
                      {agend.status === 'agendado' || agend.status === 'Agendado' ? 'Agendado' : agend.status === 'em_andamento' ? 'Na Oficina' : agend.status === 'concluido' || agend.status === 'realizado' || agend.status === 'Realizado' ? 'Concluído' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="nowrap">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(agend)}>
                        <Edit3 size={18} />
                      </button>
                      {userRole !== 'funcionario' && (
                        <button className="icon-btn danger" title="Excluir" onClick={() => handleDelete(agend.id)}>
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
              <h3 className="modal-title">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

                {!editingId && (
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="input-label">Cliente</label>
                    <select
                      className="input-field"
                      required
                      value={form.cliente_id}
                      onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                    >
                      <option value="">Selecione um cliente...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="input-group">
                  <label className="input-label">Veículo</label>
                  <select
                    className="input-field"
                    required
                    disabled={!form.cliente_id}
                    value={form.veiculo_id}
                    onChange={(e) => setForm({ ...form, veiculo_id: e.target.value })}
                  >
                    <option value="">Selecione um veículo...</option>
                    {formVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Data e Horário</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    max="9999-12-31T23:59"
                    value={form.data_hora}
                    onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Serviço Solicitado</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: Troca de pastilhas, Revisão de 40k"
                    value={form.servico_solicitado}
                    onChange={(e) => setForm({ ...form, servico_solicitado: e.target.value })}
                  />
                </div>

                {editingId && (
                  <div className="input-group">
                    <label className="input-label">Status</label>
                    <select
                      className="input-field"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="agendado">Agendado</option>
                      <option value="realizado">Realizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Salvar Alterações' : 'Agendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agendamentos;
