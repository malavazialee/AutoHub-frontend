import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, X, Eye, FileText, Check } from 'lucide-react';

function OrdensServico({ apiBase, initialStatus = '', userRole }) {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [filtros, setFiltros] = useState({ status: initialStatus, data_inicio: '', data_fim: '', cliente_id: '' });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Add OS Form State
  const [newOS, setNewOS] = useState({ cliente_id: '', veiculo_id: '', descricao_problema: '' });
  const [formVehicles, setFormVehicles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected OS Details State
  const [selectedOS, setSelectedOS] = useState(null);
  const [newItem, setNewItem] = useState({ tipo: 'peca', descricao: '', quantidade: 1, valor_unitario: '' });
  const [itemError, setItemError] = useState('');

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filtros).toString();
      const res = await apiFetch(`${apiBase}/ordens?${queryParams}`);
      const data = await res.json();
      setOrdens(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
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
      console.error('Erro ao buscar clientes/veículos:', err);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, [filtros]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Update list of vehicles when client is selected in the creation form
  useEffect(() => {
    if (newOS.cliente_id) {
      const filtered = veiculos.filter(v => v.cliente_id === parseInt(newOS.cliente_id));
      setFormVehicles(filtered);
      setNewOS(prev => ({ ...prev, veiculo_id: filtered[0]?.id || '' }));
    } else {
      setFormVehicles([]);
      setNewOS(prev => ({ ...prev, veiculo_id: '' }));
    }
  }, [newOS.cliente_id, veiculos]);

  const handleOpenAdd = () => {
    setNewOS({ cliente_id: '', veiculo_id: '', descricao_problema: '' });
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleOpenDetail = async (id) => {
    try {
      const res = await apiFetch(`${apiBase}/ordens/${id}`);
      const data = await res.json();
      setSelectedOS(data);
      setNewItem({ tipo: 'peca', descricao: '', quantidade: 1, valor_unitario: '' });
      setItemError('');
      setShowDetailModal(true);
    } catch (err) {
      console.error('Erro ao carregar detalhes da ordem de serviço:', err);
    }
  };

  const handleCreateOS = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newOS.cliente_id || !newOS.veiculo_id || !newOS.descricao_problema) {
      setErrorMsg('Todos os campos são obrigatórios.');
      return;
    }

    try {
      const res = await apiFetch(`${apiBase}/ordens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOS)
      });
      const data = await res.json();

      if (res.ok) {
        setShowAddModal(false);
        setSuccessMsg('Ordem de serviço criada com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchOrdens();
        handleOpenDetail(data.id); // Open details panel for the new OS automatically
      } else {
        setErrorMsg(data.error || 'Erro ao abrir ordem de serviço.');
      }
    } catch (err) {
      setErrorMsg('Erro na conexão com o servidor.');
    }
  };

  const handleUpdateOSStatus = async (newStatus) => {
    try {
      const res = await apiFetch(`${apiBase}/ordens/${selectedOS.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          descricao_problema: selectedOS.descricao_problema
        })
      });

      if (res.ok) {
        // Refresh detail view
        handleOpenDetail(selectedOS.id);
        fetchOrdens();
      } else {
        alert('Erro ao atualizar status da ordem de serviço.');
      }
    } catch (err) {
      alert('Erro na conexão.');
    }
  };

  const handleDeleteOS = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço? Todos os itens associados serão removidos permanentemente.')) {
      try {
        const res = await apiFetch(`${apiBase}/ordens/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Ordem de serviço removida.');
          fetchOrdens();
        } else {
          alert('Erro ao remover ordem de serviço.');
        }
      } catch (err) {
        alert('Erro na conexão.');
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setItemError('');
    if (!newItem.descricao || !newItem.quantidade || !newItem.valor_unitario) {
      setItemError('Preencha todos os campos do item.');
      return;
    }

    try {
      const res = await apiFetch(`${apiBase}/ordens/${selectedOS.id}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (res.ok) {
        // Refresh OS Details
        handleOpenDetail(selectedOS.id);
        fetchOrdens();
      } else {
        const errData = await res.json();
        setItemError(errData.error || 'Erro ao adicionar item.');
      }
    } catch (err) {
      setItemError('Erro na conexão.');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await apiFetch(`${apiBase}/ordens/${selectedOS.id}/itens/${itemId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Refresh OS Details
        handleOpenDetail(selectedOS.id);
        fetchOrdens();
      } else {
        alert('Erro ao remover item.');
      }
    } catch (err) {
      alert('Erro na conexão.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ordens de Serviço</h1>
          <p className="page-subtitle">Acompanhamento e faturamento dos serviços de manutenção.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Nova Ordem de Serviço
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
          <label className="input-label">Status</label>
          <select
            className="input-field"
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="ativas">Ativas (Aberta + Andamento)</option>
            <option value="aberta">Aberta</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Data Início</label>
          <input
            type="date"
            className="input-field"
            max="9999-12-31"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Data Fim</label>
          <input
            type="date"
            className="input-field"
            max="9999-12-31"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
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

      {/* Lista de OS */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="nowrap">OS ID</th>
              <th>Cliente</th>
              <th>Veículo (Placa)</th>
              <th className="nowrap">Abertura</th>
              <th className="nowrap">Valor Total</th>
              <th className="nowrap">Status</th>
              <th className="nowrap" style={{ width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-state" style={{ padding: '48px' }}>
                  <p>Buscando registros...</p>
                </td>
              </tr>
            ) : ordens.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>Nenhuma ordem de serviço registrada.</p>
                  </div>
                </td>
              </tr>
            ) : (
              ordens.map((os) => (
                <tr key={os.id}>
                  <td className="nowrap"><strong>#{os.id}</strong></td>
                  <td>{os.cliente_nome}</td>
                  <td>{os.veiculo_marca} {os.veiculo_modelo} (<code>{os.veiculo_placa}</code>)</td>
                  <td className="nowrap">{new Date(os.data_abertura).toLocaleDateString('pt-BR')}</td>
                  <td className="nowrap"><strong>R$ {parseFloat(os.valor_total).toFixed(2)}</strong></td>
                  <td className="nowrap">
                    <span className={`badge badge-${os.status}`}>
                      {os.status === 'aberta' ? 'Aberta' : os.status === 'em_andamento' ? 'Em Andamento' : os.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="nowrap">
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="icon-btn" title="Visualizar Detalhes" onClick={() => handleOpenDetail(os.id)}>
                        <Eye size={18} />
                      </button>
                      {userRole !== 'funcionario' && (
                        <button className="icon-btn danger" title="Excluir" onClick={() => handleDeleteOS(os.id)}>
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

      {/* Modal Abertura de OS */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Nova Ordem de Serviço</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOS}>
              <div className="modal-body">
                {errorMsg && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

                <div className="input-group">
                  <label className="input-label">Cliente</label>
                  <select
                    className="input-field"
                    required
                    value={newOS.cliente_id}
                    onChange={(e) => setNewOS({ ...newOS, cliente_id: e.target.value })}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Veículo</label>
                  <select
                    className="input-field"
                    required
                    disabled={!newOS.cliente_id}
                    value={newOS.veiculo_id}
                    onChange={(e) => setNewOS({ ...newOS, veiculo_id: e.target.value })}
                  >
                    <option value="">Selecione um veículo...</option>
                    {formVehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.placa})</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Descrição do Problema Relatado</label>
                  <textarea
                    required
                    className="input-field"
                    rows="4"
                    placeholder="Descreva o que o cliente informou..."
                    value={newOS.descricao_problema}
                    onChange={(e) => setNewOS({ ...newOS, descricao_problema: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Abrir OS</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes e Gerenciamento de Itens */}
      {showDetailModal && selectedOS && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Ordem de Serviço #{selectedOS.id}</h3>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Resumo da OS */}
              <div className="detail-grid">
                <div className="detail-section">
                  <h4>Informações do Cliente & Veículo</h4>
                  <p><strong>Cliente:</strong> {selectedOS.cliente_nome}</p>
                  <p><strong>Telefone:</strong> {selectedOS.cliente_telefone} | <strong>Email:</strong> {selectedOS.cliente_email}</p>
                  <p><strong>Veículo:</strong> {selectedOS.veiculo_marca} {selectedOS.veiculo_modelo} (<code>{selectedOS.veiculo_placa}</code>)</p>
                  <p><strong>Ano:</strong> {selectedOS.veiculo_ano}</p>
                </div>
                <div className="detail-section">
                  <h4>Status & Histórico de Datas</h4>
                  <p><strong>Abertura:</strong> {new Date(selectedOS.data_abertura).toLocaleString('pt-BR')}</p>
                  <p><strong>Conclusão:</strong> {selectedOS.data_conclusao ? new Date(selectedOS.data_conclusao).toLocaleString('pt-BR') : 'Em aberto'}</p>
                  <p><strong>Problema:</strong> {selectedOS.descricao_problema}</p>
                  
                  {/* Botões de Ação de Status */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn btn-secondary ${selectedOS.status === 'em_andamento' ? 'active' : ''}`}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleUpdateOSStatus('em_andamento')}
                    >
                      Iniciar Serviço
                    </button>
                    <button
                      type="button"
                      className={`btn btn-primary`}
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, var(--accent-emerald), var(--accent-cyan))', boxShadow: 'none' }}
                      onClick={() => handleUpdateOSStatus('concluida')}
                    >
                      <Check size={14} /> Concluir OS
                    </button>
                    <button
                      type="button"
                      className={`btn btn-danger`}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleUpdateOSStatus('cancelada')}
                    >
                      Cancelar OS
                    </button>
                  </div>
                </div>
              </div>

              {/* Itens Cadastrados na OS */}
              <div className="card">
                <h4 className="input-label" style={{ marginBottom: '12px' }}>Itens de Manutenção (Mão de Obra e Peças)</h4>
                
                {selectedOS.itens.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Nenhum item adicionado a esta ordem de serviço.</p>
                ) : (
                  <div className="table-container" style={{ marginBottom: '20px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Descrição</th>
                          <th>Quantidade</th>
                          <th>Valor Unitário</th>
                          <th>Subtotal</th>
                          <th style={{ width: '80px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOS.itens.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className={`badge ${item.tipo === 'mao_obra' ? 'badge-aberta' : 'badge-em_andamento'}`}>
                                {item.tipo === 'mao_obra' ? 'Mão de Obra' : 'Peça'}
                              </span>
                            </td>
                            <td>{item.descricao}</td>
                            <td>{item.quantidade}</td>
                            <td>R$ {parseFloat(item.valor_unitario).toFixed(2)}</td>
                            <td><strong>R$ {parseFloat(item.valor_total).toFixed(2)}</strong></td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <td colSpan="4" style={{ textAlign: 'right' }}><strong>Valor Total da OS:</strong></td>
                          <td colSpan="2" style={{ color: 'var(--accent-blue)', fontSize: '16px' }}>
                            <strong>R$ {parseFloat(selectedOS.valor_total).toFixed(2)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Formulário para Adicionar Item */}
                {selectedOS.status !== 'concluida' && selectedOS.status !== 'cancelada' && (
                  <form onSubmit={handleAddItem} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h5 className="input-label" style={{ marginBottom: '12px', fontSize: '11px' }}>Adicionar Item à OS</h5>
                    {itemError && <div style={{ color: 'var(--accent-rose)', marginBottom: '12px', fontSize: '13px' }}>{itemError}</div>}
                    
                    <div className="filters-bar" style={{ marginBottom: '12px' }}>
                      <div className="input-group" style={{ flexGrow: 1 }}>
                        <label className="input-label">Tipo</label>
                        <select
                          className="input-field"
                          value={newItem.tipo}
                          onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value })}
                        >
                          <option value="peca">Peça</option>
                          <option value="mao_obra">Mão de Obra</option>
                        </select>
                      </div>

                      <div className="input-group" style={{ flexGrow: 3 }}>
                        <label className="input-label">Descrição / Nome do Item</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          placeholder="Ex: Pastilha de freio Bosch, Alinhamento, etc."
                          value={newItem.descricao}
                          onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                        />
                      </div>

                      <div className="input-group" style={{ flexGrow: 1 }}>
                        <label className="input-label">Qtd</label>
                        <input
                          type="number"
                          required
                          min="1"
                          className="input-field"
                          value={newItem.quantidade}
                          onChange={(e) => setNewItem({ ...newItem, quantidade: parseInt(e.target.value) || 1 })}
                        />
                      </div>

                      <div className="input-group" style={{ flexGrow: 1.5 }}>
                        <label className="input-label">Valor Unitário</label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          className="input-field"
                          placeholder="0.00"
                          value={newItem.valor_unitario}
                          onChange={(e) => setNewItem({ ...newItem, valor_unitario: e.target.value })}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" style={{ height: '45px' }}>
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdensServico;
