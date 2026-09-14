/**
 * Utilitários de data formatados para PT-BR (DD/MM/AAAA)
 */

export const formatDateBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTimeBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTimeBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Amanhã';
  if (diffDays === -1) return 'Ontem';
  if (diffDays > 0 && diffDays <= 7) return `Em ${diffDays} dias`;
  if (diffDays < 0 && diffDays >= -7) return `Há ${Math.abs(diffDays)} dias`;

  return formatDateBR(date);
};

export const getDayNameBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { weekday: 'long' });
};

export const getMonthNameBR = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { month: 'long' });
};

export const getYearBR = (dateString: string | Date): number => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 0;
  return date.getFullYear();
};

/**
 * Converte data no formato YYYY-MM-DD para Date object
 */
export const parseISODate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Formata data para input type="date" (YYYY-MM-DD)
 */
export const formatForInput = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formata range de datas: "27/08/2026 - 29/08/2026"
 */
export const formatDateRangeBR = (start: string | Date, end: string | Date): string => {
  const startFormatted = formatDateBR(start);
  const endFormatted = formatDateBR(end);
  if (!startFormatted) return endFormatted;
  if (!endFormatted) return startFormatted;
  if (startFormatted === endFormatted) return startFormatted;
  return `${startFormatted} - ${endFormatted}`;
};