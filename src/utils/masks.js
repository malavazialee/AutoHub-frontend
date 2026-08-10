export const maskCPF = (value) => {
  if (!value) return '';
  return value
    .replace(/\D/g, '') // Remove tudo que não for dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o terceiro dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Adiciona ponto após o sexto dígito
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Adiciona hífen após o nono dígito
    .replace(/(-\d{2})\d+?$/, '$1'); // Impede mais de 11 dígitos
};

export const maskTelefone = (value) => {
  if (!value) return '';
  let v = value.replace(/\D/g, ''); // Remove não dígitos
  
  if (v.length <= 10) {
    // Formato Fixo (10 dígitos)
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  // Formato Celular (11 dígitos)
  return v
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const maskPlaca = (value) => {
  if (!value) return '';
  // Remove caracteres que não são letras ou números
  let v = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Se tiver pelo menos 4 caracteres, formata como AAA-1234
  if (v.length > 3) {
    return v.replace(/^([A-Z0-9]{3})([A-Z0-9]{1,4})/, '$1-$2').substring(0, 8);
  }
  return v;
};
