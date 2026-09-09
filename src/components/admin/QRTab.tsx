import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { generateQRDataUrl } from '@/lib/qrUtils';
import toast from 'react-hot-toast';
import {
  QrCode,
  Search,
  Plus,
  Printer,
  Download,
  Edit2,
  EyeOff,
  Trash2,
  X,
  RefreshCw,
  Save,
} from 'lucide-react';

export const QRTab = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [printTable, setPrintTable] = useState<any>(null);
  const [printMode, setPrintMode] = useState<'card' | 'sticker' | 'sheet'>('card');
  const [qrImages, setQrImages] = useState<Record<string, string>>({});

  // Add form
  const [addNum, setAddNum] = useState('');
  const [addLabel, setAddLabel] = useState('');
  const [previewQR, setPreviewQR] = useState('');

  // Bulk form
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('Table');

  // Edit form
  const [editLabel, setEditLabel] = useState('');
  const [editNum, setEditNum] = useState('');

  // Quick QR Generator
  const [quickNum, setQuickNum] = useState('');
  const [quickLabel, setQuickLabel] = useState('');
  const [quickQR, setQuickQR] = useState('');
  const [quickGenerating, setQuickGenerating] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (addNum) {
      generateQRDataUrl(window.location.origin + '/menu?table=preview', {
        size: 150,
        color: '#15803d',
        bgColor: '#ffffff',
      })
        .then(setPreviewQR)
        .catch(() => {});
    } else {
      setPreviewQR('');
    }
  }, [addNum]);

  useEffect(() => {
    if (quickNum) {
      setQuickGenerating(true);
      const url = window.location.origin + '/menu?table=' + quickNum;
      generateQRDataUrl(url, { size: 300, color: '#15803d', bgColor: '#ffffff' })
        .then(dataUrl => {
          setQuickQR(dataUrl);
          setQuickGenerating(false);
        })
        .catch(() => {
          setQuickGenerating(false);
        });
    } else {
      setQuickQR('');
    }
  }, [quickNum]);

  useEffect(() => {
    tables.forEach(table => {
      if (!qrImages[table.id]) {
        generateQRDataUrl(getQRUrl(table), { size: 200, color: '#15803d', bgColor: '#ffffff' })
          .then(dataUrl => setQrImages(prev => ({ ...prev, [table.id]: dataUrl })))
          .catch(() => {});
      }
    });
  }, [tables]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.from('tables').select('*').order('table_number');
      if (error) throw error;
      setTables(data || []);
    } catch {
      toast.error('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const getQRUrl = (table: any) => window.location.origin + '/menu?table=' + table.id;
  const getQRImage = (table: any): string => qrImages[table.id] || '';

  const getQRImageForSize = async (table: any, size = 300): Promise<string> => {
    try {
      return await generateQRDataUrl(getQRUrl(table), {
        size,
        color: '#15803d',
        bgColor: '#ffffff',
      });
    } catch {
      return qrImages[table.id] || '';
    }
  };

  const quickDownload = async (mode: 'card' | 'sticker' = 'card') => {
    if (!quickNum || !quickQR) {
      toast.error('Enter a table number first');
      return;
    }
    try {
      const label = quickLabel || 'Table ' + quickNum;
      const qrImg = new Image();
      qrImg.src = quickQR;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('Failed to load QR image'));
      });

      if (mode === 'card') {
        const W = 1063,
          H = 1417;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.45, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 8;
        const r = 40;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(W - r, 0);
        ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r);
        ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H);
        ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 64px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 140);
        ctx.fillStyle = '#6b7280';
        ctx.font = '28px Segoe UI, Arial, sans-serif';
        ctx.fillText('Authentic Non-Veg Cuisine', W / 2, 200);
        const qrSize = 500;
        const qrX = (W - qrSize) / 2;
        const qrY = 340;
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.roundRect(qrX + 6, qrY + 6, qrSize, qrSize, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 12, qrY + 12, qrSize - 24, qrSize - 24);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 56px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 120);
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 36px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 190);
        const link = document.createElement('a');
        link.download = label.replace(/\s+/g, '-').toLowerCase() + '-qr-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR card downloaded!');
      } else {
        const W = 827,
          H = 827;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.6, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 42px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 100);
        const qrSize = 380;
        const qrX = (W - qrSize) / 2;
        const qrY = 170;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 16);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 40px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 70);
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 30px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 120);
        const link = document.createElement('a');
        link.download = label.replace(/\s+/g, '-').toLowerCase() + '-qr-sticker.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR sticker downloaded!');
      }
    } catch {
      toast.error('Failed to generate QR image');
    }
  };

  const quickPrint = (mode: 'card' | 'sticker' = 'card') => {
    if (!quickNum || !quickQR) {
      toast.error('Enter a table number first');
      return;
    }
    const label = quickLabel || 'Table ' + quickNum;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow popups to print');
      return;
    }
    if (mode === 'card') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${label}</title><style>
        @page { size: 90mm 120mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 90mm; height: 120mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .card { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2.5px solid #15803d; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); }
        .logo { font-size: 17px; font-weight: 900; color: #15803d; letter-spacing: 1.5px; }
        .tagline { font-size: 7.5px; color: #6b7280; margin-top: 1px; letter-spacing: 0.3px; }
        .qr { width: 52mm; height: 52mm; margin-top: 5mm; border-radius: 10px; }
        .tbl { font-size: 15px; font-weight: 800; color: #111827; margin-top: 5mm; }
        .scan { font-size: 10px; font-weight: 700; color: #15803d; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${quickQR}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    } else {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Sticker - ${label}</title><style>
        @page { size: 70mm 70mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 70mm; height: 70mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .sticker { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm; border-radius: 50%; border: 2px solid #15803d; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%); }
        .logo { font-size: 11px; font-weight: 900; color: #15803d; letter-spacing: 1px; }
        .qr { width: 38mm; height: 38mm; margin-top: 2mm; border-radius: 8px; }
        .tbl { font-size: 12px; font-weight: 800; color: #111827; margin-top: 2mm; }
        .scan { font-size: 10px; font-weight: 700; color: #15803d; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="sticker"><div class="logo">NAATI NEST</div><img class="qr" src="${quickQR}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    }
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const quickCopyLink = () => {
    if (!quickNum) {
      toast.error('Enter a table number first');
      return;
    }
    navigator.clipboard.writeText(window.location.origin + '/menu?table=' + quickNum);
    toast.success('Menu link copied!');
  };

  const addTable = async () => {
    const num = parseInt(addNum);
    if (!num || num < 1) {
      toast.error('Enter a valid table number');
      return;
    }
    const existing = tables.find(t => t.table_number === num);
    if (existing) {
      toast.error('Table ' + num + ' already exists');
      return;
    }
    try {
      const { error } = await supabase.from('tables').insert({
        table_number: num,
        label: addLabel || 'Table ' + num,
        qr_code: 'table-' + num,
      } as any);
      if (error) throw error;
      setAddNum('');
      setAddLabel('');
      setShowAddModal(false);
      fetchTables();
      toast.success('Table ' + num + ' added — QR code generated');
    } catch (err: any) {
      if (err.code === '23505') {
        toast.error('Table ' + num + ' already exists');
      } else {
        toast.error('Failed to add table');
      }
    }
  };

  const addBulkTables = async () => {
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);
    if (!start || !end || start < 1 || end < start) {
      toast.error('Enter valid range');
      return;
    }
    if (end - start + 1 > 50) {
      toast.error('Maximum 50 tables at once');
      return;
    }
    const toAdd = [];
    for (let i = start; i <= end; i++) {
      if (!tables.find(t => t.table_number === i)) {
        toAdd.push({ table_number: i, label: bulkPrefix + ' ' + i, qr_code: 'table-' + i });
      }
    }
    if (toAdd.length === 0) {
      toast.error('All tables in this range already exist');
      return;
    }
    try {
      const { error } = await supabase.from('tables').insert(toAdd as any);
      if (error) throw error;
      setShowBulkModal(false);
      setBulkStart('');
      setBulkEnd('');
      setBulkPrefix('Table');
      fetchTables();
      toast.success(toAdd.length + ' tables added successfully');
    } catch {
      toast.error('Failed to add tables');
    }
  };

  const updateTable = async () => {
    if (!editingTable) return;
    try {
      const { error } = await supabase
        .from('tables')
        .update({
          label: editLabel,
          table_number: Number(editNum) || editingTable.table_number,
        } as any)
        .eq('id', editingTable.id);
      if (error) throw error;
      setEditingTable(null);
      fetchTables();
      toast.success('Table updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const toggleActive = async (table: any) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ is_active: !table.is_active } as any)
        .eq('id', table.id);
      if (error) throw error;
      fetchTables();
      toast.success(table.is_active ? 'Table deactivated' : 'Table activated');
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteTable = async (table: any) => {
    if (
      !confirm(
        'Delete ' +
          (table.label || 'Table ' + table.table_number) +
          '? This cannot be undone.'
      )
    )
      return;
    try {
      const { error } = await supabase.from('tables').delete().eq('id', table.id);
      if (error) throw error;
      fetchTables();
      toast.success('Table deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyLink = (table: any) => {
    navigator.clipboard.writeText(getQRUrl(table));
    toast.success('Menu link copied!');
  };

  const downloadQR = async (table: any, mode: 'card' | 'sticker' = 'card') => {
    try {
      const label = table.label || 'Table ' + table.table_number;
      const qrDataUrl = await getQRImageForSize(table, 600);
      if (!qrDataUrl) {
        toast.error('Failed to generate QR. Try again.');
        return;
      }

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('Failed to load QR image'));
      });

      if (mode === 'card') {
        const W = 1063,
          H = 1417;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.45, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 8;
        const r = 40;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(W - r, 0);
        ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r);
        ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H);
        ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 64px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 140);
        ctx.fillStyle = '#6b7280';
        ctx.font = '28px Segoe UI, Arial, sans-serif';
        ctx.fillText('Authentic Non-Veg Cuisine', W / 2, 200);
        const qrSize = 500;
        const qrX = (W - qrSize) / 2;
        const qrY = 340;
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.roundRect(qrX + 6, qrY + 6, qrSize, qrSize, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 12, qrY + 12, qrSize - 24, qrSize - 24);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 56px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 120);
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 36px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 190);
        const link = document.createElement('a');
        link.download = (table.label || 'table-' + table.table_number) + '-qr-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR card downloaded — ready to print & stick!');
      } else {
        const W = 827,
          H = 827;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.6, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 42px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 100);
        const qrSize = 380;
        const qrX = (W - qrSize) / 2;
        const qrY = 170;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 16);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 40px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 70);
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 30px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 120);
        const link = document.createElement('a');
        link.download = (table.label || 'table-' + table.table_number) + '-qr-sticker.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR sticker downloaded — ready to print & stick!');
      }
    } catch {
      toast.error('Failed to generate QR image. Try print instead.');
    }
  };

  const openPrint = (table: any) => {
    setPrintTable(table);
    setPrintMode('card');
  };

  const doPrint = async (table?: any) => {
    if (printMode === 'sheet') {
      const activeTables = tables.filter(t => t.is_active !== false);
      if (activeTables.length === 0) {
        toast.error('No active tables to print');
        return;
      }
      let cardsHtml = '';
      for (const t of activeTables) {
        const l = t.label || 'Table ' + t.table_number;
        const u = qrImages[t.id] || (await getQRImageForSize(t, 300));
        cardsHtml += `<div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${u}" /><div class="tbl">${l}</div><div class="scan">SCAN HERE TO ORDER</div></div>`;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Allow popups to print');
        return;
      }
      printWindow.document.write(`<!DOCTYPE html><html><head><title>All QR Cards</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10mm; background: #fff; }
        .grid { display: grid; grid-template-columns: repeat(3, 90mm); gap: 5mm; justify-content: center; }
        .card { width: 90mm; height: 120mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2px solid #15803d; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); page-break-inside: avoid; }
        .logo { font-size: 15px; font-weight: 900; color: #15803d; letter-spacing: 1.5px; }
        .tagline { font-size: 7px; color: #6b7280; margin-top: 1px; }
        .qr { width: 45mm; height: 45mm; margin-top: 4mm; border-radius: 8px; }
        .tbl { font-size: 13px; font-weight: 800; color: #111827; margin-top: 4mm; }
        .scan { font-size: 9px; font-weight: 700; color: #15803d; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="grid">${cardsHtml}</div></body></html>`);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      return;
    }

    const target = table || printTable;
    if (!target) return;
    const qrDataUrl = qrImages[target.id] || (await getQRImageForSize(target, 400));
    const label = target.label || 'Table ' + target.table_number;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow popups to print');
      return;
    }

    if (printMode === 'card') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${label}</title><style>
        @page { size: 90mm 120mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 90mm; height: 120mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .card { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2.5px solid #15803d; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); }
        .logo { font-size: 17px; font-weight: 900; color: #15803d; letter-spacing: 1.5px; }
        .tagline { font-size: 7.5px; color: #6b7280; margin-top: 1px; letter-spacing: 0.3px; }
        .qr { width: 52mm; height: 52mm; margin-top: 5mm; border-radius: 10px; }
        .tbl { font-size: 15px; font-weight: 800; color: #111827; margin-top: 5mm; }
        .scan { font-size: 10px; font-weight: 700; color: #15803d; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${qrDataUrl}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    } else if (printMode === 'sticker') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Sticker - ${label}</title><style>
        @page { size: 70mm 70mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 70mm; height: 70mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .sticker { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm; border-radius: 50%; border: 2px solid #15803d; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%); }
        .logo { font-size: 11px; font-weight: 900; color: #15803d; letter-spacing: 1px; }
        .qr { width: 38mm; height: 38mm; margin-top: 2mm; border-radius: 8px; }
        .tbl { font-size: 12px; font-weight: 800; color: #111827; margin-top: 2mm; }
        .scan { font-size: 10px; font-weight: 700; color: #15803d; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="sticker"><div class="logo">NAATI NEST</div><img class="qr" src="${qrDataUrl}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    }
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredTables = tables.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.label || '').toLowerCase().includes(q) || t.table_number.toString().includes(q);
  });

  if (loading)
    return (
      <div className="text-center py-16 text-text-secondary font-medium">
        <RefreshCw size={24} className="animate-spin mx-auto text-primary mb-3" />
        Loading tables & QR codes...
      </div>
    );

  return (
    <div>
      {/* Quick QR Generator */}
      <div className="bg-white rounded-2xl shadow-xs border border-surface-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-primary-light rounded-xl">
            <QrCode size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-800">Quick QR Generator</h3>
            <p className="text-xs text-text-secondary">
              Generate QR instantly without database records. Links dynamically to live menu.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
              Table Number *
            </label>
            <input
              type="number"
              value={quickNum}
              onChange={e => setQuickNum(e.target.value)}
              placeholder="e.g. 1, 2, 3..."
              className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
              Label (optional)
            </label>
            <input
              type="text"
              value={quickLabel}
              onChange={e => setQuickLabel(e.target.value)}
              placeholder="e.g. Window Seat, VIP, AC Hall"
              className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
            />
          </div>
        </div>
        {quickNum && (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-surface-subtle rounded-xl p-5 border border-surface-border/60">
            <div className="flex-shrink-0">
              {quickGenerating ? (
                <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center border border-gray-100">
                  <RefreshCw size={24} className="text-gray-400 animate-spin" />
                </div>
              ) : (
                <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center border border-surface-border shadow-xs">
                  <img src={quickQR} alt="QR" className="w-32 h-32 rounded-lg" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-base font-bold text-gray-800">
                {quickLabel || 'Table ' + quickNum}
              </h4>
              <p className="text-xs text-text-secondary mt-0.5 font-medium">Table #{quickNum}</p>
              <p className="text-xs text-text-muted mt-2 font-mono bg-white px-3 py-1.5 rounded-lg inline-block border border-surface-border">
                {window.location.origin}/menu?table={quickNum}
              </p>
              <p className="text-xs text-primary font-semibold mt-1">
                ✓ Scanning this QR opens the live, real-time updated menu
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={() => quickPrint('card')}
                  className="px-3.5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print Card
                </button>
                <button
                  type="button"
                  onClick={() => quickPrint('sticker')}
                  className="px-3.5 py-2 bg-white border border-surface-border text-gray-700 rounded-lg text-xs font-bold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={13} /> Print Sticker
                </button>
                <button
                  type="button"
                  onClick={() => quickDownload('card')}
                  className="px-3.5 py-2 bg-white border border-surface-border text-gray-700 rounded-lg text-xs font-bold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={13} /> Download Card
                </button>
                <button
                  type="button"
                  onClick={() => quickDownload('sticker')}
                  className="px-3.5 py-2 bg-white border border-surface-border text-gray-700 rounded-lg text-xs font-bold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download size={13} /> Download Sticker
                </button>
                <button
                  type="button"
                  onClick={quickCopyLink}
                  className="px-3.5 py-2 bg-white border border-surface-border text-gray-700 rounded-lg text-xs font-bold hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <QrCode size={13} /> Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-surface-border shadow-xs focus-within:border-primary transition-colors">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAddNum('');
            setAddLabel('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Table
        </button>
        <button
          type="button"
          onClick={() => {
            setBulkStart('');
            setBulkEnd('');
            setBulkPrefix('Table');
            setShowBulkModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-surface-border text-text-secondary rounded-xl text-xs sm:text-sm font-bold hover:bg-surface-subtle transition-colors shadow-xs cursor-pointer"
        >
          <QrCode size={16} /> Bulk Add
        </button>
        {tables.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPrintTable(null);
              setPrintMode('sheet');
              doPrint();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-surface-border text-text-secondary rounded-xl text-xs sm:text-sm font-bold hover:bg-surface-subtle transition-colors shadow-xs cursor-pointer"
          >
            <Printer size={16} /> Print All
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-primary bg-white">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Tables</p>
          <p className="text-2xl font-extrabold text-primary mt-1">{tables.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Active Tables</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {tables.filter(t => t.is_active !== false).length}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {tables.filter(t => t.is_active === false).length}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500 bg-white">
          <p className="text-xs text-text-muted font-bold uppercase tracking-wider">QRs Ready</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{tables.length}</p>
        </Card>
      </div>

      {/* Table Grid */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-xs border border-dashed border-gray-300">
          <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-text-secondary font-medium">
            {searchQuery
              ? 'No tables match your search'
              : 'No tables added yet. Add your first table above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTables.map(table => (
            <div
              key={table.id}
              className={`bg-white rounded-2xl shadow-xs overflow-hidden border transition-all hover:shadow-md ${
                table.is_active === false
                  ? 'border-surface-border opacity-60'
                  : 'border-surface-border hover:border-primary-border'
              }`}
            >
              {/* QR Preview */}
              <div className="p-5 text-center bg-gradient-to-b from-primary-light/40 to-white">
                <div className="w-36 h-36 mx-auto bg-white rounded-xl flex items-center justify-center shadow-xs border border-surface-border mb-3">
                  <img
                    src={getQRImage(table)}
                    alt={'QR for ' + (table.label || 'Table ' + table.table_number)}
                    className="w-32 h-32 rounded-lg"
                  />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {table.label || 'Table ' + table.table_number}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">Table #{table.table_number}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span
                    className={
                      'inline-block w-2 h-2 rounded-full ' +
                      (table.is_active !== false ? 'bg-emerald-500' : 'bg-gray-400')
                    }
                  />
                  <span className="text-xs font-semibold text-text-secondary">
                    {table.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openPrint(table)}
                    className="py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Printer size={13} /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadQR(table, 'card')}
                    className="py-2 bg-surface-subtle text-text-secondary border border-surface-border rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Download
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyLink(table)}
                    className="py-1.5 bg-gray-50 text-text-secondary rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <QrCode size={12} /> Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTable(table);
                      setEditLabel(table.label || '');
                      setEditNum(table.table_number.toString());
                    }}
                    className="py-1.5 bg-gray-50 text-text-secondary rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(table)}
                    className="py-1.5 bg-gray-50 text-text-secondary rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <EyeOff size={12} /> {table.is_active !== false ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => deleteTable(table)}
                  className="w-full py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-light rounded-xl">
                  <QrCode size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Add New Table</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Table Number *
                </label>
                <input
                  type="number"
                  value={addNum}
                  onChange={e => setAddNum(e.target.value)}
                  placeholder="e.g. 1, 2, 3..."
                  className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                  min="1"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && addTable()}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Label (optional)
                </label>
                <input
                  type="text"
                  value={addLabel}
                  onChange={e => setAddLabel(e.target.value)}
                  placeholder="e.g. Window Seat, VIP, AC Hall"
                  className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                  onKeyDown={e => e.key === 'Enter' && addTable()}
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Labels appear on print layouts and bills for easy identification
                </p>
              </div>
              {addNum && (
                <div className="bg-surface-subtle rounded-xl p-4 text-center border border-surface-border/60">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    QR Preview
                  </p>
                  <div className="w-28 h-28 mx-auto bg-white rounded-lg flex items-center justify-center shadow-xs border border-surface-border mb-2">
                    <img src={previewQR} alt="Preview" className="w-24 h-24 rounded" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{addLabel || 'Table ' + addNum}</p>
                  <p className="text-xs text-text-muted">Table #{addNum}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2.5 border border-surface-border rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addTable}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <QrCode size={16} /> Generate QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowBulkModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <QrCode size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Bulk Add Tables</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Table Prefix
                </label>
                <input
                  type="text"
                  value={bulkPrefix}
                  onChange={e => setBulkPrefix(e.target.value)}
                  placeholder="Table"
                  className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  e.g. "Table" → Table 1, Table 2... or "T" → T 1, T 2...
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    From
                  </label>
                  <input
                    type="number"
                    value={bulkStart}
                    onChange={e => setBulkStart(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                    To
                  </label>
                  <input
                    type="number"
                    value={bulkEnd}
                    onChange={e => setBulkEnd(e.target.value)}
                    placeholder="20"
                    className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                    min="1"
                  />
                </div>
              </div>
              {bulkStart && bulkEnd && parseInt(bulkEnd) >= parseInt(bulkStart) && (
                <div className="bg-primary-light border border-primary-border/60 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-primary">
                    {Math.max(
                      0,
                      parseInt(bulkEnd) -
                        parseInt(bulkStart) +
                        1 -
                        tables.filter(
                          t =>
                            t.table_number >= parseInt(bulkStart) &&
                            t.table_number <= parseInt(bulkEnd)
                        ).length
                    )}{' '}
                    new tables will be added
                  </p>
                  <p className="text-xs text-text-secondary mt-1 font-medium">
                    {bulkPrefix} {bulkStart} → {bulkPrefix} {bulkEnd}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-6 py-2.5 border border-surface-border rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addBulkTables}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <QrCode size={16} /> Generate All QRs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setEditingTable(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <Edit2 size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Edit Table</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Table Number
                </label>
                <input
                  type="number"
                  value={editNum}
                  onChange={e => setEditNum(e.target.value)}
                  className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">
                  Label
                </label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  placeholder="e.g. Window Seat, VIP, AC Hall"
                  className="w-full px-4 py-2.5 border border-surface-border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                  onKeyDown={e => e.key === 'Enter' && updateTable()}
                />
              </div>
              <div className="bg-surface-subtle rounded-xl p-4 text-center border border-surface-border/60">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Current QR Code
                </p>
                <div className="w-28 h-28 mx-auto bg-white rounded-lg flex items-center justify-center shadow-xs border border-surface-border mb-2">
                  <img
                    src={getQRImage(editingTable)}
                    alt="QR"
                    className="w-24 h-24 rounded"
                  />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {editLabel || 'Table ' + editNum}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="px-6 py-2.5 border border-surface-border rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateTable}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Mode Modal */}
      {printTable && printMode !== 'sheet' && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setPrintTable(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-light rounded-xl">
                  <Printer size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Print QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setPrintTable(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-800 text-center">
                {printTable.label || 'Table ' + printTable.table_number}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPrintMode('card')}
                  className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    printMode === 'card'
                      ? 'border-primary bg-primary-light'
                      : 'border-surface-border hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-16 mx-auto bg-white rounded-lg border border-surface-border mb-2 flex items-center justify-center">
                    <QrCode size={20} className="text-primary" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">Card</p>
                  <p className="text-[10px] text-text-muted">90×120mm</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('sticker')}
                  className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    printMode === 'sticker'
                      ? 'border-primary bg-primary-light'
                      : 'border-surface-border hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto bg-white rounded-full border border-surface-border mb-2 flex items-center justify-center">
                    <QrCode size={20} className="text-primary" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">Sticker</p>
                  <p className="text-[10px] text-text-muted">70×70mm</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintMode('sheet');
                    doPrint();
                    setPrintTable(null);
                  }}
                  className="p-4 rounded-xl border-2 border-surface-border text-center hover:border-gray-300 transition-all cursor-pointer"
                >
                  <div className="w-12 h-16 mx-auto bg-white rounded-lg border border-surface-border mb-2 flex items-center justify-center">
                    <QrCode size={16} className="text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-800">All Tables</p>
                  <p className="text-[10px] text-text-muted">Sheet</p>
                </button>
              </div>
              <div className="bg-surface-subtle rounded-xl p-4 text-center border border-surface-border/60">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Preview
                </p>
                <div
                  className={`mx-auto bg-white rounded-xl flex items-center justify-center shadow-xs border border-surface-border mb-2 ${
                    printMode === 'sticker' ? 'w-28 h-28 rounded-full' : 'w-32 h-44'
                  }`}
                >
                  <img
                    src={getQRImage(printTable)}
                    alt="QR"
                    className={
                      printMode === 'sticker'
                        ? 'w-20 h-20 rounded-full'
                        : 'w-28 h-28 rounded-lg'
                    }
                  />
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {printTable.label || 'Table ' + printTable.table_number}
                </p>
                <p className="text-xs text-primary font-bold tracking-wider">
                  SCAN HERE TO ORDER
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPrintTable(null)}
                className="px-6 py-2.5 border border-surface-border rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doPrint}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer size={16} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
