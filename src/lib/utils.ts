export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

export const formatDateSafe = (date: string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-IN');
};

export const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  const visible = digits.slice(-4);
  const masked = '*'.repeat(digits.length - 4);
  return masked + visible;
};

export const formatDate = (date: string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleString('en-IN');
};

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    const blob = new Blob([''], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    return;
  }
  const escapeCsvValue = (val: any): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(escapeCsvValue).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
};
