import apiFetch from '../utils/apiFetch';
import React, { useState, useEffect } from 'react';
import { Users, Car, AlertCircle, Calendar, Plus } from 'lucide-react';

function Dashboard({ apiBase, setActiveTab }) {
  const [stats, setStats] = useState({
    clientes: 0,
    veiculos: 0,
    ordensAtivas: 0,
    agendamentosHoje: 0
  });
  const [proximosAgendamentos, setProximosAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch all elements to compute stats
        const [resClientes, resVeiculos, resOrdens, resAgendamentos] = await Promise.all([
          apiFetch(`${apiBase}/clientes`),
          apiFetch(`${apiBase}/veiculos`),
          apiFetch(`${apiBase}/ordens`),
          apiFetch(`${apiBase}/agendamentos`)
        ]);

        const clientesData = await resClientes.json();
        const veiculosData = await resVeiculos.json();
        const ordensData = await resOrdens.json();
        const agendamentosData = await resAgendamentos.json();
        
        const clientes = Array.isArray(clientesData) ? clientesData : [];
        const veiculos = Array.isArray(veiculosData) ? veiculosData : [];
        const ordens = Array.isArray(ordensData) ? ordensData : [];
        const agendamentos = Array.isArray(agendamentosData) ? agendamentosData : [];
        
        const getLocalDateStr = (dateInput) => {
          const d = new Date(dateInput);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Calculate counts
        const activeOS = ordens.filter(o => o.status === 'aberta' || o.status === 'em_andamento').length;
        
        const getDbDateStr = (dbDateStr) => {
          if (!dbDateStr) return '';
          return dbDateStr.split('T')[0];
        };

        const todayStr = getLocalDateStr(new Date());
        const todayAgend = agendamentos.filter(a => getDbDateStr(a.data_hora) === todayStr).length;

        setStats({
          clientes: clientes.length,
          veiculos: veiculos.length,
          ordensAtivas: activeOS,
          agendamentosHoje: todayAgend
        });

        // Filter upcoming appointments (>= today 00:00:00)
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);
        
        const upcoming = agendamentos
          .filter(a => {
            const localDbDate = new Date(a.data_hora.replace('Z', ''));
            return localDbDate >= todayAtMidnight && a.status === 'agendado';
          })
          .sort((a, b) => new Date(a.data_hora.replace('Z', '')) - new Date(b.data_hora.replace('Z', '')));
        
        setProximosAgendamentos(upcoming.slice(0, 5));
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [apiBase]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.replace('Z', ''));
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Carregando dados do painel...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel Geral</h1>
          <p className="page-subtitle">Visão geral em tempo real da oficina mecânica AutoHub.</p>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab('clientes')} style={{ cursor: 'pointer' }}>
          <div>
            <span className="stat-label">Clientes Cadastrados</span>
            <div className="stat-val">{stats.clientes}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('veiculos')} style={{ cursor: 'pointer' }}>
          <div>
            <span className="stat-label">Frota de Veículos</span>
            <div className="stat-val">{stats.veiculos}</div>
          </div>
          <div className="stat-icon-wrapper">
            <Car size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab('ordens', { initialStatus: 'ativas' })} style={{ cursor: 'pointer' }}>
          <div>
            <span className="stat-label">Manutenções Ativas</span>
            <div className="stat-val" style={{ color: 'var(--accent-amber)' }}>{stats.ordensAtivas}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-amber)' }}>
            <AlertCircle size={24} />
          </div>
        </div>

        <div className="stat-card" onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          setActiveTab('agendamentos', { initialData: today });
        }} style={{ cursor: 'pointer' }}>
          <div>
            <span className="stat-label">Agendados para Hoje</span>
            <div className="stat-val" style={{ color: 'var(--accent-emerald)' }}>{stats.agendamentosHoje}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-emerald)' }}>
            <Calendar size={24} />
          </div>
        </div>
      </div>

      {/* Próximos Agendamentos */}
      <div className="card">
        <h2 className="card-title">Próximos Agendamentos</h2>
        {proximosAgendamentos.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>Nenhum agendamento futuro localizado.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Veículo / Placa</th>
                  <th className="nowrap">Data e Horário</th>
                  <th>Serviço Solicitado</th>
                  <th className="nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {proximosAgendamentos.map((agend) => (
                  <tr key={agend.id}>
                    <td><strong>{agend.cliente_nome}</strong></td>
                    <td>{agend.veiculo_marca} {agend.veiculo_modelo} (<code>{agend.veiculo_placa}</code>)</td>
                    <td className="nowrap">{formatDate(agend.data_hora)}</td>
                    <td>{agend.servico_solicitado}</td>
                    <td className="nowrap">
                      <span className={`badge badge-${agend.status}`}>
                        {agend.status === 'agendado' ? 'Agendado' : agend.status === 'realizado' ? 'Realizado' : 'Cancelado'}
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
  );
}

export default Dashboard;
