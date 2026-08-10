import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, X, Eye, Car, FileText } from 'lucide-react';
import { maskPlaca } from '../utils/masks';

function Veiculos({ apiBase, userRole }) {
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({ placa: '', marca: '', modelo: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ cliente_id: '', marca: '', modelo: '', placa: '', ano: '', quilometragem: '' });
  const [errorMsg, setErrorMsg] = useState('');

  // History State
  const [selectedVeiculo, setSelectedVeiculo] = useState(null);
  const [veiculoHistory, setVeiculoHistory] = useState([]);

  const fetchVeiculos = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filtros).toString();
      const res = await apiFetch(`${apiBase}/veiculos?${queryParams}`);
      const data = await res.json();
      setVeiculos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await apiFetch(`${apiBase}/clientes`);
      const data = await res.json();
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  useEffect(() => {
    fetchVeiculos();
  }, [filtros]);

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ cliente_id: '', placa: '', marca: '', modelo: '', ano: '', quilometragem: '' });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (veiculo) => {
    setEditingId(veiculo.id);
    setForm({
      cliente_id: veiculo.cliente_id,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      placa: veiculo.placa,
      ano: veiculo.ano,
      quilometragem: veiculo.quilometragem
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenHistory = async (veiculo) => {
    setSelectedVeiculo(veiculo);
    try {
      const res = await apiFetch(`${apiBase}/veiculos/${veiculo.id}/manutencoes`);
      const data = await res.json();
      setVeiculoHistory(data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Erro ao obter histórico de manutenções:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja remover este veículo?')) {
      try {
        const res = await apiFetch(`${apiBase}/veiculos/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          alert('Veículo removido com sucesso.');
          fetchVeiculos();
        } else {
          alert(data.error || 'Erro ao remover veículo.');
        }
      } catch (err) {
        alert('Erro ao remover veículo.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${apiBase}/veiculos/${editingId}` : `${apiBase}/veiculos`;

    try {
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        setShowModal(false);
        setSuccessMsg(editingId ? 'Alterações salvas com sucesso!' : 'Veículo cadastrado com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchVeiculos();
      } else {
        setErrorMsg(data.error || 'Erro ao salvar veículo.');
      }
    } catch (err) {
      setErrorMsg('Erro na conexão com o servidor.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Veículos</h1>
          <p className="page-subtitle">Frota de veículos registrados e histórico de manutenções.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Novo Veículo
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
          <label className="input-label">Placa</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por placa"
            value={filtros.placa}
            onChange={(e) => setFiltros({ ...filtros, placa: maskPlaca(e.target.value) })}
            maxLength="8"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Marca</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por marca"
            value={filtros.marca}
            onChange={(e) => setFiltros({ ...filtros, marca: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Modelo</label>
          <input
            type="text"
            className="input-field"
            placeholder="Filtrar por modelo"
            value={filtros.modelo}
            onChange={(e) => setFiltros({ ...filtros, modelo: e.target.value })}
          />
        </div>
      </div>

      {/* Lista de Veículos */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="nowrap">Placa</th>
              <th>Proprietário</th>
              <th>Marca / Modelo</th>
              <th className="nowrap">Ano</th>
              <th className="nowrap">Quilometragem</th>
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
            ) : veiculos.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <Car size={48} />
                    <p>Nenhum veículo cadastrado.</p>
                  </div>
                </td>
              </tr>
            ) : (
              veiculos.map((veiculo) => (
                <tr key={veiculo.id}>
                  <td className="nowrap"><code>{veiculo.placa}</code></td>
                  <td>{veiculo.proprietario}</td>
                  <td><strong>{veiculo.marca} {veiculo.modelo}</strong></td>
                  <td className="nowrap">{veiculo.ano}</td>
                  <td className="nowrap">{(Number(veiculo.quilometragem) || 0).toLocaleString('pt-BR')} km</td>
                  <td className="nowrap">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" title="Histórico" onClick={() => handleOpenHistory(veiculo)}>
                        <FileText size={18} />
                      </button>
                      <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(veiculo)}>
                        <Edit3 size={18} />
                      </button>
                      {userRole !== 'funcionario' && (
                        <button className="icon-btn danger" title="Excluir" onClick={() => handleDelete(veiculo.id)}>
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
              <h3 className="modal-title">{editingId ? 'Editar Veículo' : 'Novo Veículo'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

                {!editingId && (
                  <div className="input-group">
                    <label className="input-label">Proprietário (Cliente)</label>
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
                  <label className="input-label">Marca</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: Chevrolet, Volkswagen"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Modelo</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: Onix, Gol"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Placa</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Ex: ABC-1234 ou BRA2S19"
                    value={form.placa}
                    onChange={(e) => setForm({ ...form, placa: maskPlaca(e.target.value) })}
                    maxLength="8"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Ano</label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    placeholder="Ex: 2020"
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Quilometragem</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="input-field"
                    placeholder="Ex: 45000"
                    value={form.quilometragem}
                    onChange={(e) => setForm({ ...form, quilometragem: e.target.value })}
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

      {/* Modal Histórico de Manutenções do Veículo */}
      {showHistoryModal && selectedVeiculo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Histórico: {selectedVeiculo.marca} {selectedVeiculo.modelo} ({selectedVeiculo.placa})</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {veiculoHistory.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum registro de ordem de serviço localizado para este veículo.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>OS ID</th>
                        <th>Data Abertura</th>
                        <th>Data Conclusão</th>
                        <th>Descrição do Problema</th>
                        <th>Valor Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {veiculoHistory.map(os => (
                        <tr key={os.id}>
                          <td>#{os.id}</td>
                          <td>{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</td>
                          <td>{os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : '-'}</td>
                          <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{os.descricao_problema}</td>
                          <td className="nowrap">R$ {parseFloat(os.valor_total).toFixed(2)}</td>
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
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Veiculos;
