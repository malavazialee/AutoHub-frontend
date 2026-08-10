export default async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('autohub_token');
  
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Se o token for inválido/expirado, limpa e recarrega para voltar pro login
    localStorage.removeItem('autohub_token');
    localStorage.removeItem('autohub_user');
    window.location.reload();
  }

  return response;
}
