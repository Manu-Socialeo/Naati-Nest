import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, MenuItem, Category } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, LogOut, RefreshCw, CheckCircle, Clock, XCircle,
  BarChart3, Settings, TrendingUp, DollarSign,
  ShoppingBag, Users, Calendar, Download, Plus, Edit2, Trash2,
  Star, Sparkles, X, Save, Image as ImageIcon,
  Search, Bell, QrCode, Timer, Printer, GripVertical, EyeOff, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice, exportToCSV } from '@/lib/utils';
import { generateQRDataUrl } from '@/lib/qrUtils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLORS = ['#1e9e62', '#e46c35', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

/* ==================== QR TAB ==================== */
const QRTab = () => {
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

  useEffect(() => { fetchTables(); }, []);

  useEffect(() => {
    if (addNum) {
      generateQRDataUrl(window.location.origin + '/menu?table=preview', { size: 150, color: '#1e9e62', bgColor: '#ffffff' })
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
      generateQRDataUrl(url, { size: 300, color: '#1e9e62', bgColor: '#ffffff' })
        .then((dataUrl) => { setQuickQR(dataUrl); setQuickGenerating(false); })
        .catch(() => { setQuickGenerating(false); });
    } else {
      setQuickQR('');
    }
  }, [quickNum]);

  useEffect(() => {
    tables.forEach(table => {
      if (!qrImages[table.id]) {
        generateQRDataUrl(getQRUrl(table), { size: 200, color: '#1e9e62', bgColor: '#ffffff' })
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
    } catch { toast.error('Failed to fetch tables'); }
    finally { setLoading(false); }
  };

  const getQRUrl = (table: any) => window.location.origin + '/menu?table=' + table.id;

  const getQRImage = (table: any): string => qrImages[table.id] || '';

  const getQRImageForSize = async (table: any, size = 300): Promise<string> => {
    const cacheKey = table.id + '-' + size;
    try {
      return await generateQRDataUrl(getQRUrl(table), { size, color: '#1e9e62', bgColor: '#ffffff' });
    } catch {
      return qrImages[table.id] || '';
    }
  };

  const quickDownload = async (mode: 'card' | 'sticker' = 'card') => {
    if (!quickNum || !quickQR) { toast.error('Enter a table number first'); return; }
    try {
      const label = quickLabel || 'Table ' + quickNum;
      const qrImg = new Image();
      qrImg.src = quickQR;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('Failed to load QR image'));
      });

      if (mode === 'card') {
        const W = 1063, H = 1417;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.45, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#1e9e62';
        ctx.lineWidth = 8;
        const r = 40;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
        ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r);
        ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H);
        ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#1e9e62';
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
        ctx.fillStyle = '#1e9e62';
        ctx.font = 'bold 36px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 190);
        const link = document.createElement('a');
        link.download = label.replace(/\s+/g, '-').toLowerCase() + '-qr-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR card downloaded!');
      } else {
        const W = 827, H = 827;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.6, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#1e9e62';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#1e9e62';
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
        ctx.fillStyle = '#1e9e62';
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
    if (!quickNum || !quickQR) { toast.error('Enter a table number first'); return; }
    const label = quickLabel || 'Table ' + quickNum;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Allow popups to print'); return; }
    if (mode === 'card') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${label}</title><style>
        @page { size: 90mm 120mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 90mm; height: 120mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .card { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2.5px solid #1e9e62; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); }
        .logo { font-size: 17px; font-weight: 900; color: #1e9e62; letter-spacing: 1.5px; }
        .tagline { font-size: 7.5px; color: #6b7280; margin-top: 1px; letter-spacing: 0.3px; }
        .qr { width: 52mm; height: 52mm; margin-top: 5mm; border-radius: 10px; }
        .tbl { font-size: 15px; font-weight: 800; color: #111827; margin-top: 5mm; }
        .scan { font-size: 10px; font-weight: 700; color: #1e9e62; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${quickQR}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    } else {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Sticker - ${label}</title><style>
        @page { size: 70mm 70mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 70mm; height: 70mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .sticker { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm; border-radius: 50%; border: 2px solid #1e9e62; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%); }
        .logo { font-size: 11px; font-weight: 900; color: #1e9e62; letter-spacing: 1px; }
        .qr { width: 38mm; height: 38mm; margin-top: 2mm; border-radius: 8px; }
        .tbl { font-size: 12px; font-weight: 800; color: #111827; margin-top: 2mm; }
        .scan { font-size: 10px; font-weight: 700; color: #1e9e62; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="sticker"><div class="logo">NAATI NEST</div><img class="qr" src="${quickQR}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    }
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const quickCopyLink = () => {
    if (!quickNum) { toast.error('Enter a table number first'); return; }
    navigator.clipboard.writeText(window.location.origin + '/menu?table=' + quickNum);
    toast.success('Menu link copied!');
  };

  const addTable = async () => {
    const num = parseInt(addNum);
    if (!num || num < 1) { toast.error('Enter a valid table number'); return; }
    const existing = tables.find(t => t.table_number === num);
    if (existing) { toast.error('Table ' + num + ' already exists'); return; }
    try {
      const { error } = await supabase.from('tables').insert({
        table_number: num,
        label: addLabel || 'Table ' + num,
        qr_code: 'table-' + num,
      } as any);
      if (error) throw error;
      setAddNum(''); setAddLabel('');
      setShowAddModal(false);
      fetchTables();
      toast.success('Table ' + num + ' added — QR code generated');
    } catch (err: any) {
      if (err.code === '23505') { toast.error('Table ' + num + ' already exists'); }
      else { toast.error('Failed to add table'); }
    }
  };

  const addBulkTables = async () => {
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);
    if (!start || !end || start < 1 || end < start) { toast.error('Enter valid range'); return; }
    if (end - start + 1 > 50) { toast.error('Maximum 50 tables at once'); return; }
    const toAdd = [];
    for (let i = start; i <= end; i++) {
      if (!tables.find(t => t.table_number === i)) {
        toAdd.push({ table_number: i, label: bulkPrefix + ' ' + i, qr_code: 'table-' + i });
      }
    }
    if (toAdd.length === 0) { toast.error('All tables in this range already exist'); return; }
    try {
      const { error } = await supabase.from('tables').insert(toAdd as any);
      if (error) throw error;
      setShowBulkModal(false);
      setBulkStart(''); setBulkEnd(''); setBulkPrefix('Table');
      fetchTables();
      toast.success(toAdd.length + ' tables added successfully');
    } catch { toast.error('Failed to add tables'); }
  };

  const updateTable = async () => {
    if (!editingTable) return;
    try {
      const { error } = await supabase.from('tables').update({ label: editLabel, table_number: Number(editNum) || editingTable.table_number } as any).eq('id', editingTable.id);
      if (error) throw error;
      setEditingTable(null);
      fetchTables();
      toast.success('Table updated');
    } catch { toast.error('Failed to update'); }
  };

  const toggleActive = async (table: any) => {
    try {
      const { error } = await supabase.from('tables').update({ is_active: !table.is_active } as any).eq('id', table.id);
      if (error) throw error;
      fetchTables();
      toast.success(table.is_active ? 'Table deactivated' : 'Table activated');
    } catch { toast.error('Failed to update'); }
  };

  const deleteTable = async (table: any) => {
    if (!confirm('Delete ' + (table.label || 'Table ' + table.table_number) + '? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('tables').delete().eq('id', table.id);
      if (error) throw error;
      fetchTables();
      toast.success('Table deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const copyLink = (table: any) => {
    navigator.clipboard.writeText(getQRUrl(table));
    toast.success('Menu link copied!');
  };

  const downloadQR = async (table: any, mode: 'card' | 'sticker' = 'card') => {
    try {
      const label = table.label || 'Table ' + table.table_number;
      const qrDataUrl = await getQRImageForSize(table, 600);
      if (!qrDataUrl) { toast.error('Failed to generate QR. Try again.'); return; }

      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('Failed to load QR image'));
      });

      if (mode === 'card') {
        // 90mm x 120mm at 300 DPI = 1063 x 1417 px
        const W = 1063, H = 1417;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.45, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Border
        ctx.strokeStyle = '#1e9e62';
        ctx.lineWidth = 8;
        const r = 40;
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
        ctx.quadraticCurveTo(W, 0, W, r);
        ctx.lineTo(W, H - r);
        ctx.quadraticCurveTo(W, H, W - r, H);
        ctx.lineTo(r, H);
        ctx.quadraticCurveTo(0, H, 0, H - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.stroke();

        // Logo
        ctx.fillStyle = '#1e9e62';
        ctx.font = 'bold 64px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 140);

        // Tagline
        ctx.fillStyle = '#6b7280';
        ctx.font = '28px Segoe UI, Arial, sans-serif';
        ctx.fillText('Authentic Non-Veg Cuisine', W / 2, 200);

        // QR Code
        const qrSize = 500;
        const qrX = (W - qrSize) / 2;
        const qrY = 340;
        // QR shadow
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.beginPath();
        ctx.roundRect(qrX + 6, qrY + 6, qrSize, qrSize, 24);
        ctx.fill();
        // QR background
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 12, qrY + 12, qrSize - 24, qrSize - 24);

        // Table label
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 56px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 120);

        // SCAN HERE TO ORDER
        ctx.fillStyle = '#1e9e62';
        ctx.font = 'bold 36px Segoe UI, Arial, sans-serif';
        ctx.fillText('SCAN HERE TO ORDER', W / 2, qrY + qrSize + 190);

        const link = document.createElement('a');
        link.download = (table.label || 'table-' + table.table_number) + '-qr-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        URL.revokeObjectURL(qrImg.src);
        toast.success('QR card downloaded — ready to print & stick!');
      } else {
        // Sticker: 70mm x 70mm at 300 DPI = 827 x 827 px
        const W = 827, H = 827;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;

        // Background gradient
        const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
        grad.addColorStop(0, '#f0fdf4');
        grad.addColorStop(0.6, '#ffffff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Circular border
        ctx.strokeStyle = '#1e9e62';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, W / 2 - 10, 0, Math.PI * 2);
        ctx.stroke();

        // Logo
        ctx.fillStyle = '#1e9e62';
        ctx.font = 'bold 42px Segoe UI, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NAATI NEST', W / 2, 100);

        // QR
        const qrSize = 380;
        const qrX = (W - qrSize) / 2;
        const qrY = 170;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(qrX, qrY, qrSize, qrSize, 16);
        ctx.fill();
        ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize - 16, qrSize - 16);

        // Table label
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 40px Segoe UI, Arial, sans-serif';
        ctx.fillText(label, W / 2, qrY + qrSize + 70);

        // SCAN HERE TO ORDER
        ctx.fillStyle = '#1e9e62';
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

  const openPrint = (table: any) => { setPrintTable(table); setPrintMode('card'); };

  const doPrint = async (table?: any) => {
    if (printMode === 'sheet') {
      const activeTables = tables.filter(t => t.is_active !== false);
      if (activeTables.length === 0) { toast.error('No active tables to print'); return; }
      let cardsHtml = '';
      for (const t of activeTables) {
        const l = t.label || 'Table ' + t.table_number;
        const u = qrImages[t.id] || await getQRImageForSize(t, 300);
        cardsHtml += `<div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${u}" /><div class="tbl">${l}</div><div class="scan">SCAN HERE TO ORDER</div></div>`;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) { toast.error('Allow popups to print'); return; }
      printWindow.document.write(`<!DOCTYPE html><html><head><title>All QR Cards</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 10mm; background: #fff; }
        .grid { display: grid; grid-template-columns: repeat(3, 90mm); gap: 5mm; justify-content: center; }
        .card { width: 90mm; height: 120mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2px solid #1e9e62; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); page-break-inside: avoid; }
        .logo { font-size: 15px; font-weight: 900; color: #1e9e62; letter-spacing: 1.5px; }
        .tagline { font-size: 7px; color: #6b7280; margin-top: 1px; }
        .qr { width: 45mm; height: 45mm; margin-top: 4mm; border-radius: 8px; }
        .tbl { font-size: 13px; font-weight: 800; color: #111827; margin-top: 4mm; }
        .scan { font-size: 9px; font-weight: 700; color: #1e9e62; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="grid">${cardsHtml}</div></body></html>`);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
      return;
    }

    const target = table || printTable;
    if (!target) return;
    const qrDataUrl = qrImages[target.id] || await getQRImageForSize(target, 400);
    const label = target.label || 'Table ' + target.table_number;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Allow popups to print'); return; }

    if (printMode === 'card') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Card - ${label}</title><style>
        @page { size: 90mm 120mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 90mm; height: 120mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .card { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6mm; border: 2.5px solid #1e9e62; border-radius: 14px; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%); }
        .logo { font-size: 17px; font-weight: 900; color: #1e9e62; letter-spacing: 1.5px; }
        .tagline { font-size: 7.5px; color: #6b7280; margin-top: 1px; letter-spacing: 0.3px; }
        .qr { width: 52mm; height: 52mm; margin-top: 5mm; border-radius: 10px; }
        .tbl { font-size: 15px; font-weight: 800; color: #111827; margin-top: 5mm; }
        .scan { font-size: 10px; font-weight: 700; color: #1e9e62; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="card"><div class="logo">NAATI NEST</div><div class="tagline">Authentic Non-Veg Cuisine</div><img class="qr" src="${qrDataUrl}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    } else if (printMode === 'sticker') {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>QR Sticker - ${label}</title><style>
        @page { size: 70mm 70mm; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { width: 70mm; height: 70mm; display: flex; align-items: center; justify-content: center; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
        .sticker { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4mm; border-radius: 50%; border: 2px solid #1e9e62; background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%); }
        .logo { font-size: 11px; font-weight: 900; color: #1e9e62; letter-spacing: 1px; }
        .qr { width: 38mm; height: 38mm; margin-top: 2mm; border-radius: 8px; }
        .tbl { font-size: 12px; font-weight: 800; color: #111827; margin-top: 2mm; }
        .scan { font-size: 10px; font-weight: 700; color: #1e9e62; margin-top: 2px; letter-spacing: 1px; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body><div class="sticker"><div class="logo">NAATI NEST</div><img class="qr" src="${qrDataUrl}" /><div class="tbl">${label}</div><div class="scan">SCAN HERE TO ORDER</div></div></body></html>`);
    }
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const filteredTables = tables.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.label || '').toLowerCase().includes(q) || t.table_number.toString().includes(q);
  });

  if (loading) return <div className="text-center py-12 text-gray-500">Loading tables...</div>;

  return (
    <div>
      {/* Quick QR Generator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-xl"><QrCode size={20} className="text-primary" /></div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Quick QR Generator</h3>
            <p className="text-xs text-gray-500">Generate QR instantly — no database needed. Links to live menu.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Table Number *</label>
            <input type="number" value={quickNum} onChange={(e) => setQuickNum(e.target.value)} placeholder="e.g. 1, 2, 3..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min="1" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 mb-1.5 block">Label (optional)</label>
            <input type="text" value={quickLabel} onChange={(e) => setQuickLabel(e.target.value)} placeholder="e.g. Window Seat, VIP" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        {quickNum && (
          <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 rounded-xl p-5">
            <div className="flex-shrink-0">
              {quickGenerating ? (
                <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center border border-gray-100"><RefreshCw size={24} className="text-gray-400 animate-spin" /></div>
              ) : (
                <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                  <img src={quickQR} alt="QR" className="w-32 h-32 rounded-lg" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-base font-bold text-gray-800">{quickLabel || 'Table ' + quickNum}</h4>
              <p className="text-xs text-gray-400 mt-0.5">Table #{quickNum}</p>
              <p className="text-xs text-gray-500 mt-2 font-mono bg-white px-3 py-1.5 rounded-lg inline-block border border-gray-100">{window.location.origin}/menu?table={quickNum}</p>
              <p className="text-xs text-green-600 mt-1">Scanning this QR opens the live, real-time updated menu</p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <button onClick={() => quickPrint('card')} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1"><Printer size={13} /> Print Card</button>
                <button onClick={() => quickPrint('sticker')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"><Printer size={13} /> Print Sticker</button>
                <button onClick={() => quickDownload('card')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"><Download size={13} /> Download Card</button>
                <button onClick={() => quickDownload('sticker')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"><Download size={13} /> Download Sticker</button>
                <button onClick={quickCopyLink} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1"><QrCode size={13} /> Copy Link</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-200 shadow-sm">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search tables..." className="bg-transparent border-none outline-none w-full text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <button onClick={() => { setAddNum(''); setAddLabel(''); setShowAddModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"><Plus size={16} /> Add Table</button>
        <button onClick={() => { setBulkStart(''); setBulkEnd(''); setBulkPrefix('Table'); setShowBulkModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"><QrCode size={16} /> Bulk Add</button>
        {tables.length > 0 && (
          <button onClick={() => { setPrintTable(null); setPrintMode('sheet'); doPrint(); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"><Printer size={16} /> Print All</button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-l-4 border-l-primary"><p className="text-xs text-gray-500 font-bold uppercase">Total Tables</p><p className="text-2xl font-extrabold text-primary">{tables.length}</p></Card>
        <Card className="p-4 border-l-4 border-l-green-500"><p className="text-xs text-gray-500 font-bold uppercase">Active</p><p className="text-2xl font-extrabold text-green-600">{tables.filter(t => t.is_active !== false).length}</p></Card>
        <Card className="p-4 border-l-4 border-l-amber-500"><p className="text-xs text-gray-500 font-bold uppercase">Inactive</p><p className="text-2xl font-extrabold text-amber-600">{tables.filter(t => t.is_active === false).length}</p></Card>
        <Card className="p-4 border-l-4 border-l-blue-500"><p className="text-xs text-gray-500 font-bold uppercase">QR Codes Ready</p><p className="text-2xl font-extrabold text-blue-600">{tables.length}</p></Card>
      </div>

      {/* Table Grid */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
          <QrCode size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{searchQuery ? 'No tables match your search' : 'No tables added yet. Add your first table above.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTables.map(table => (
            <div key={table.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all hover:shadow-md ${table.is_active === false ? 'border-gray-200 opacity-60' : 'border-gray-100'}`}>
              {/* QR Preview */}
              <div className="p-5 text-center bg-gradient-to-b from-green-50/50 to-white">
                <div className="w-36 h-36 mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 mb-3">
                  <img src={getQRImage(table)} alt={'QR for ' + (table.label || 'Table ' + table.table_number)} className="w-32 h-32 rounded-lg" />
                </div>
                <h3 className="text-base font-bold text-gray-800">{table.label || 'Table ' + table.table_number}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Table #{table.table_number}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className={'inline-block w-2 h-2 rounded-full ' + (table.is_active !== false ? 'bg-green-500' : 'bg-gray-400')} />
                  <span className="text-xs font-medium text-gray-500">{table.is_active !== false ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openPrint(table)} className="py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"><Printer size={13} /> Print</button>
                  <button onClick={() => downloadQR(table, 'card')} className="py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"><Download size={13} /> Download</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => copyLink(table)} className="py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"><QrCode size={12} /> Copy Link</button>
                  <button onClick={() => { setEditingTable(table); setEditLabel(table.label || ''); setEditNum(table.table_number.toString()); }} className="py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                  <button onClick={() => toggleActive(table)} className="py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"><EyeOff size={12} /> {table.is_active !== false ? 'Hide' : 'Show'}</button>
                </div>
                <button onClick={() => deleteTable(table)} className="w-full py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-xl"><QrCode size={20} className="text-primary" /></div>
                <h3 className="text-lg font-bold text-gray-800">Add New Table</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Table Number *</label>
                <input type="number" value={addNum} onChange={(e) => setAddNum(e.target.value)} placeholder="e.g. 1, 2, 3..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min="1" autoFocus onKeyDown={(e) => e.key === 'Enter' && addTable()} />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Label (optional)</label>
                <input type="text" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="e.g. Window Seat, VIP, AC Hall" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" onKeyDown={(e) => e.key === 'Enter' && addTable()} />
                <p className="text-xs text-gray-400 mt-1.5">Labels appear on admin bills for easy identification</p>
              </div>
              {/* Live Preview */}
              {addNum && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">QR Preview</p>
                  <div className="w-28 h-28 mx-auto bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 mb-2">
                    <img src={previewQR} alt="Preview" className="w-24 h-24 rounded" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{addLabel || 'Table ' + addNum}</p>
                  <p className="text-xs text-gray-400">Table #{addNum}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={addTable} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"><QrCode size={16} /> Generate QR</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl"><QrCode size={20} className="text-blue-600" /></div>
                <h3 className="text-lg font-bold text-gray-800">Bulk Add Tables</h3>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Table Prefix</label>
                <input type="text" value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} placeholder="Table" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
                <p className="text-xs text-gray-400 mt-1.5">e.g. "Table" → Table 1, Table 2... or "T" → T 1, T 2...</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">From</label>
                  <input type="number" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} placeholder="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min="1" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">To</label>
                  <input type="number" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} placeholder="20" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min="1" />
                </div>
              </div>
              {bulkStart && bulkEnd && parseInt(bulkEnd) >= parseInt(bulkStart) && (
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-green-700">{Math.max(0, parseInt(bulkEnd) - parseInt(bulkStart) + 1 - tables.filter(t => t.table_number >= parseInt(bulkStart) && t.table_number <= parseInt(bulkEnd)).length)} new tables will be added</p>
                  <p className="text-xs text-green-600 mt-1">{bulkPrefix} {bulkStart} → {bulkPrefix} {bulkEnd}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={addBulkTables} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"><QrCode size={16} /> Generate All QRs</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTable(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl"><Edit2 size={20} className="text-amber-600" /></div>
                <h3 className="text-lg font-bold text-gray-800">Edit Table</h3>
              </div>
              <button onClick={() => setEditingTable(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Table Number</label>
                <input type="number" value={editNum} onChange={(e) => setEditNum(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" min="1" />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Label</label>
                <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="e.g. Window Seat, VIP, AC Hall" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" onKeyDown={(e) => e.key === 'Enter' && updateTable()} />
              </div>
              {/* QR Preview */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Current QR Code</p>
                <div className="w-28 h-28 mx-auto bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 mb-2">
                  <img src={getQRImage(editingTable)} alt="QR" className="w-24 h-24 rounded" />
                </div>
                <p className="text-sm font-bold text-gray-800">{editLabel || 'Table ' + editNum}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setEditingTable(null)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={updateTable} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"><Save size={16} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Print Mode Modal */}
      {printTable && printMode !== 'sheet' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPrintTable(null)}>
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-xl"><Printer size={20} className="text-primary" /></div>
                <h3 className="text-lg font-bold text-gray-800">Print QR Code</h3>
              </div>
              <button onClick={() => setPrintTable(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-gray-800 text-center">{printTable.label || 'Table ' + printTable.table_number}</p>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setPrintMode('card')} className={`p-4 rounded-xl border-2 text-center transition-all ${printMode === 'card' ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="w-12 h-16 mx-auto bg-white rounded-lg border border-gray-200 mb-2 flex items-center justify-center"><QrCode size={20} className="text-gray-400" /></div>
                  <p className="text-xs font-bold text-gray-700">Card</p>
                  <p className="text-[10px] text-gray-400">90×120mm</p>
                </button>
                <button onClick={() => setPrintMode('sticker')} className={`p-4 rounded-xl border-2 text-center transition-all ${printMode === 'sticker' ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="w-12 h-12 mx-auto bg-white rounded-full border border-gray-200 mb-2 flex items-center justify-center"><QrCode size={20} className="text-gray-400" /></div>
                  <p className="text-xs font-bold text-gray-700">Sticker</p>
                  <p className="text-[10px] text-gray-400">70×70mm</p>
                </button>
                <button onClick={() => { setPrintMode('sheet'); doPrint(); setPrintTable(null); }} className="p-4 rounded-xl border-2 border-gray-200 text-center hover:border-gray-300 transition-all">
                  <div className="w-12 h-16 mx-auto bg-white rounded-lg border border-gray-200 mb-2 flex items-center justify-center"><QrCode size={16} className="text-gray-400" /></div>
                  <p className="text-xs font-bold text-gray-700">All Tables</p>
                  <p className="text-[10px] text-gray-400">Print sheet</p>
                </button>
              </div>
              {/* Print Preview */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preview</p>
                <div className={`mx-auto bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 mb-2 ${printMode === 'sticker' ? 'w-28 h-28 rounded-full' : 'w-32 h-44'}`}>
                  <img src={getQRImage(printTable)} alt="QR" className={printMode === 'sticker' ? 'w-20 h-20 rounded' : 'w-28 h-28 rounded-lg'} />
                </div>
                <p className="text-sm font-bold text-gray-800">{printTable.label || 'Table ' + printTable.table_number}</p>
                <p className="text-xs text-gray-400">SCAN HERE TO ORDER</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setPrintTable(null)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={doPrint} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"><Printer size={16} /> Print Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export const AdminDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'menu' | 'qr'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchOrders();
    fetchMenuData();
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const subscription = supabase
      .channel('orders-admin')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setNewOrderCount(prev => prev + 1);
        const o = payload.new as Order;
        toast.success(`New order #${o.token || '-'} from ${o.customer_name}`);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 New Order - Naati Nest', { body: `${o.customer_name} - ₹${o.total_amount} (${o.order_type})`, tag: o.id });
        }
        if (autoPrintEnabled || o.order_type === 'takeaway') {
          printBill(o);
        }
        fetchOrders();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => { fetchOrders(); })
      .subscribe();
    return () => { subscription?.unsubscribe(); };
  }, [user, authLoading, navigate, autoPrintEnabled]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch { toast.error('Failed to fetch orders'); }
    finally { setLoading(false); }
  };

  const fetchMenuData = async () => {
    try {
      const [catRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*').order('sort_order'),
      ]);
      if (catRes.error) throw catRes.error;
      if (itemsRes.error) throw itemsRes.error;
      setCategories(catRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch { toast.error('Failed to fetch menu data'); }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status } as any).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(`Order status updated to ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const printBill = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.error('Please allow popups to print'); return; }
    const date = new Date(order.created_at).toLocaleDateString('en-IN');
    const time = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const billNo = order.id.slice(-6).toUpperCase();
    const token = order.token || order.id.slice(-4).toUpperCase();
    let itemsHtml = '';
    order.items.forEach(item => {
      const name = (item.name + (item.variant ? ` (${item.variant})` : '')).padEnd(18).slice(0, 18);
      const qty = item.quantity.toString().padStart(3);
      const price = item.price.toFixed(2).padStart(8);
      const total = (item.price * item.quantity).toFixed(2).padStart(8);
      itemsHtml += `${name} ${qty} ${price} ${total}\n`;
    });
    printWindow.document.write(`<html><head><title>Print Bill - ${billNo}</title><style>@page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 5px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; }</style></head><body onload="window.print(); window.close();">NAATI NEST - Token: ${token}\nDT: ${date} TM: ${time}\nBILL: ${billNo}\n-------------------------------------\nITEM               QTY    PRICE   TOTAL\n-------------------------------------\n${itemsHtml}-------------------------------------\nSUB TOTAL                   ${(order.subtotal || order.total_amount).toFixed(2)}\n${order.parcel_charge ? `PARCEL CHARGE               ${order.parcel_charge.toFixed(2)}\n` : ''}GRAND TOTAL:               ₹${order.total_amount}\n-------------------------------------\nPAY: ${order.payment_method || 'ONLINE'}\nTHANK YOU - VISIT AGAIN\n      </body></html>`);
    printWindow.document.close();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cashPending = orders.filter(o => o.payment_method === 'cash' && o.status !== 'served' && o.status !== 'cancelled' && o.payment_status !== 'paid');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={32} />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/menu')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-800" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              {newOrderCount > 0 && (
                <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  <Bell size={16} /> {newOrderCount} new
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: 'orders' as const, label: 'Orders', icon: ShoppingBag, count: orders.length },
              { key: 'menu' as const, label: 'Menu', icon: Settings },
              { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
              { key: 'qr' as const, label: 'QR Codes', icon: QrCode },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'orders' && (
          <OrdersTab orders={orders} pendingOrders={pendingOrders} cashPending={cashPending} updateOrderStatus={updateOrderStatus} printBill={printBill} fetchOrders={fetchOrders} autoPrintEnabled={autoPrintEnabled} setAutoPrintEnabled={setAutoPrintEnabled} />
        )}
        {activeTab === 'analytics' && <AnalyticsTab orders={orders} />}
        {activeTab === 'menu' && <MenuManagementTab menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} fetchMenuData={fetchMenuData} />}
        {activeTab === 'qr' && <QRTab />}
        </main>
    </div>
  );
};

/* ==================== ORDERS TAB ==================== */
const OrdersTab = ({ orders, pendingOrders, cashPending, updateOrderStatus, printBill, fetchOrders, autoPrintEnabled, setAutoPrintEnabled }: {
  orders: Order[]; pendingOrders: Order[]; cashPending: Order[];
  updateOrderStatus: (id: string, status: Order['status']) => void;
  printBill: (order: Order) => void; fetchOrders: () => void;
  autoPrintEnabled: boolean; setAutoPrintEnabled: (v: boolean) => void;
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (paymentFilter === 'cash-pending' && !(order.payment_method === 'cash' && order.payment_status !== 'paid' && order.status !== 'served' && order.status !== 'cancelled')) return false;
    if (paymentFilter === 'paid' && order.payment_status !== 'paid') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return order.customer_name?.toLowerCase().includes(q) || order.customer_phone?.includes(q) || order.token?.toLowerCase().includes(q) || order.id.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-l-4 border-l-blue-500"><p className="text-xs text-gray-500 font-bold uppercase">Pending</p><p className="text-2xl font-extrabold text-blue-600">{pendingOrders.length}</p></Card>
        <Card className="p-4 border-l-4 border-l-amber-500"><p className="text-xs text-gray-500 font-bold uppercase">Collect Cash</p><p className="text-2xl font-extrabold text-amber-600">{cashPending.length}</p></Card>
        <Card className="p-4 border-l-4 border-l-green-500"><p className="text-xs text-gray-500 font-bold uppercase">Served Today</p><p className="text-2xl font-extrabold text-green-600">{orders.filter(o => o.status === 'served' && new Date(o.created_at).toDateString() === new Date().toDateString()).length}</p></Card>
        <Card className="p-4 border-l-4 border-l-primary"><p className="text-xs text-gray-500 font-bold uppercase">Today Revenue</p><p className="text-2xl font-extrabold text-primary">{formatPrice(orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.total_amount, 0))}</p></Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800">Auto-Print New Orders</p>
          <p className="text-xs text-gray-500">OFF = only takeaway auto-prints. ON = all orders auto-print.</p>
        </div>
        <button onClick={() => setAutoPrintEnabled(!autoPrintEnabled)} className={`w-14 h-8 rounded-full transition-colors relative ${autoPrintEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${autoPrintEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search by name, phone, token..." className="bg-transparent border-none outline-none w-full text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="served">Served</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="cash-pending">Collect Cash</option>
        </select>
        <button onClick={fetchOrders} className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-primary transition-colors"><RefreshCw size={18} /></button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className={`overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow ${order.payment_method === 'cash' && order.status !== 'served' && order.status !== 'cancelled' && order.payment_status !== 'paid' ? 'ring-2 ring-amber-400' : ''}`}>
              <div className="p-5">
                {order.payment_method === 'cash' && order.status !== 'served' && order.status !== 'cancelled' && order.payment_status !== 'paid' && (
                  <div className="mb-4 -mx-5 -mt-5 px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="text-sm font-bold text-amber-800">Collect ₹{order.total_amount} - Cash Payment</span>
                  </div>
                )}
                {order.payment_status === 'paid' && (
                  <div className="mb-4 -mx-5 -mt-5 px-5 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-bold text-green-800">Payment Received - ₹{order.total_amount}</span>
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">#{order.id.slice(0, 8).toUpperCase()}</p>
                      <Badge variant="pending" className="text-[10px] py-0 px-1.5 h-auto bg-gray-50 border-gray-200 text-gray-500">{order.token || order.id.slice(-4).toUpperCase()}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{order.customer_name || 'Guest'}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{order.customer_phone || 'No phone'}</p>
                      <span className="text-xs font-bold text-primary uppercase tracking-wide bg-orange-50 px-1.5 py-0.5 rounded">{order.order_type || 'Dine-in'}</span>
                    </div>
                  </div>
                  <Badge variant={order.status === 'pending' ? 'warning' : order.status === 'preparing' ? 'preparing' : order.status === 'ready' ? 'ready' : order.status === 'served' ? 'served' : 'cancelled'}>{order.status}</Badge>
                </div>
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</span>
                      <span className="text-gray-900 font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                    <p className="text-lg font-extrabold text-primary">{formatPrice(order.total_amount)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => printBill(order)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors" title="Print Bill"><Printer size={20} /></button>
                    {order.status === 'pending' && <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Start Preparing"><Clock size={20} /></button>}
                    {(order.status === 'preparing' || order.status === 'pending') && <button onClick={() => updateOrderStatus(order.id, 'ready')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Mark as Ready"><CheckCircle size={20} /></button>}
                    {order.status === 'ready' && <button onClick={() => updateOrderStatus(order.id, 'served')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Mark as Delivered"><CheckCircle size={20} /></button>}
                    {order.status !== 'cancelled' && order.status !== 'served' && <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Cancel Order"><XCircle size={20} /></button>}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

/* ==================== ANALYTICS TAB ==================== */
const AnalyticsTab = ({ orders }: { orders: Order[] }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (order.status === 'cancelled') return false;
      switch (period) {
        case 'today': return orderDate.toDateString() === now.toDateString();
        case 'week': { const w = new Date(now); w.setDate(w.getDate() - 7); return orderDate >= w; }
        case 'month': { const m = new Date(now); m.setMonth(m.getMonth() - 1); return orderDate >= m; }
        case 'all': return true;
      }
    });
  }, [orders, period]);

  const customFiltered = useMemo(() => {
    if (!startDate || !endDate) return filteredOrders;
    const s = new Date(startDate), e = new Date(endDate); e.setHours(23, 59, 59, 999);
    return filteredOrders.filter(o => { const d = new Date(o.created_at); return d >= s && d <= e; });
  }, [filteredOrders, startDate, endDate]);

  const stats = useMemo(() => {
    const totalRevenue = customFiltered.reduce((s, o) => s + o.total_amount, 0);
    const totalOrders = customFiltered.length;
    return {
      totalRevenue, totalOrders,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      uniqueCustomers: new Set(customFiltered.map(o => o.customer_phone)).size,
      cashOrders: customFiltered.filter(o => o.payment_method === 'cash').length,
      onlineOrders: customFiltered.filter(o => o.payment_method === 'online').length,
      dineInOrders: customFiltered.filter(o => o.order_type === 'dine-in').length,
      takeawayOrders: customFiltered.filter(o => o.order_type === 'takeaway').length,
    };
  }, [customFiltered]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    customFiltered.forEach(o => { const day = new Date(o.created_at).toLocaleDateString('en-IN'); map.set(day, (map.get(day) || 0) + o.total_amount); });
    return Array.from(map.entries()).slice(-30).map(([date, revenue]) => ({ date, revenue }));
  }, [customFiltered]);

  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, orders: 0 }));
    customFiltered.forEach(o => { hours[new Date(o.created_at).getHours()].orders += 1; });
    return hours.filter(h => h.orders > 0);
  }, [customFiltered]);

  const mostSold = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    customFiltered.forEach(o => o.items.forEach((item: any) => {
      const key = item.name + (item.variant ? ` (${item.variant})` : '');
      const e = map.get(key) || { name: key, qty: 0 }; e.qty += item.quantity; map.set(key, e);
    }));
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [customFiltered]);

  const leastSold = useMemo(() => mostSold.slice().reverse().slice(0, 5), [mostSold]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    customFiltered.forEach(o => o.items.forEach((item: any) => { const cat = item.category || 'Other'; map.set(cat, (map.get(cat) || 0) + item.price * item.quantity); }));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [customFiltered]);

  const exportOrdersCSV = () => {
    const csvData = customFiltered.map(o => ({ 'Order ID': o.id, 'Token': o.token, 'Customer': o.customer_name, 'Phone': o.customer_phone, 'Type': o.order_type, 'Status': o.status, 'Payment': o.payment_method, 'Total': o.total_amount, 'Date': new Date(o.created_at).toLocaleString('en-IN') }));
    exportToCSV(csvData, `orders-${period}-${new Date().toISOString().split('T')[0]}`);
    toast.success('CSV exported');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden">
          {(['today', 'week', 'month', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm" />
        </div>
        <button onClick={exportOrdersCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:text-primary hover:border-primary transition-colors"><Download size={16} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100 border-none"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-green-200 rounded-lg"><DollarSign size={20} className="text-green-700" /></div><p className="text-xs text-green-600 font-bold uppercase">Total Revenue</p></div><p className="text-2xl font-extrabold text-green-800">{formatPrice(stats.totalRevenue)}</p></Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-none"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-blue-200 rounded-lg"><ShoppingBag size={20} className="text-blue-700" /></div><p className="text-xs text-blue-600 font-bold uppercase">Total Orders</p></div><p className="text-2xl font-extrabold text-blue-800">{stats.totalOrders}</p></Card>
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-none"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-purple-200 rounded-lg"><TrendingUp size={20} className="text-purple-700" /></div><p className="text-xs text-purple-600 font-bold uppercase">Avg Order Value</p></div><p className="text-2xl font-extrabold text-purple-800">{formatPrice(stats.avgOrderValue)}</p></Card>
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-none"><div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-200 rounded-lg"><Users size={20} className="text-orange-700" /></div><p className="text-xs text-orange-600 font-bold uppercase">Unique Customers</p></div><p className="text-2xl font-extrabold text-orange-800">{stats.uniqueCustomers}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Revenue Trend</h3>{revenueByDay.length > 0 ? <ResponsiveContainer width="100%" height={250}><AreaChart data={revenueByDay}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} /><Tooltip formatter={(v: number) => formatPrice(v)} /><Area type="monotone" dataKey="revenue" stroke="#1e9e62" fill="#1e9e62" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center text-gray-400">No data available</div>}</Card>
        <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={20} className="text-blue-500" /> Orders by Hour</h3>{ordersByHour.length > 0 ? <ResponsiveContainer width="100%" height={250}><BarChart data={ordersByHour}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="hour" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center text-gray-400">No data</div>}</Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 lg:col-span-2"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Star size={20} className="text-amber-500" /> Most Sold Items</h3>{mostSold.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={mostSold.slice(0, 10)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} /><Tooltip /><Bar dataKey="qty" fill="#1e9e62" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <div className="h-[300px] flex items-center justify-center text-gray-400">No data</div>}</Card>
        <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h3>{categoryBreakdown.length > 0 ? <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={categoryBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatPrice(v)} /></PieChart></ResponsiveContainer> : <div className="h-[250px] flex items-center justify-center text-gray-400">No data</div>}</Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4">Payment Method Split</h3><div className="grid grid-cols-2 gap-4"><div className="text-center p-4 bg-green-50 rounded-xl"><p className="text-3xl font-extrabold text-green-600">{stats.onlineOrders}</p><p className="text-sm text-green-700 font-medium mt-1">Online</p></div><div className="text-center p-4 bg-amber-50 rounded-xl"><p className="text-3xl font-extrabold text-amber-600">{stats.cashOrders}</p><p className="text-sm text-amber-700 font-medium mt-1">Cash</p></div></div></Card>
        <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4">Order Type Split</h3><div className="grid grid-cols-2 gap-4"><div className="text-center p-4 bg-blue-50 rounded-xl"><p className="text-3xl font-extrabold text-blue-600">{stats.dineInOrders}</p><p className="text-sm text-blue-700 font-medium mt-1">Dine-in</p></div><div className="text-center p-4 bg-purple-50 rounded-xl"><p className="text-3xl font-extrabold text-purple-600">{stats.takeawayOrders}</p><p className="text-sm text-purple-700 font-medium mt-1">Takeaway</p></div></div></Card>
      </div>

      {leastSold.length > 0 && <Card className="p-6 mb-8"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><EyeOff size={20} className="text-red-400" /> Least Sold Items (Dead Stock)</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{leastSold.map((item, i) => (<div key={i} className="p-3 bg-red-50 rounded-xl text-center"><p className="text-sm font-bold text-red-700 truncate">{item.name}</p><p className="text-2xl font-extrabold text-red-600 mt-1">{item.qty}</p><p className="text-xs text-red-500">sold</p></div>))}</div></Card>}

      <Card className="p-6"><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={20} className="text-gray-500" /> Recent Orders</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-200"><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Token</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Customer</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Type</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Payment</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Status</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Total</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Date</th></tr></thead><tbody>{customFiltered.slice(0, 20).map(order => (<tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-3 px-4 font-bold">{order.token}</td><td className="py-3 px-4">{order.customer_name}</td><td className="py-3 px-4 capitalize">{order.order_type}</td><td className="py-3 px-4"><Badge variant={order.payment_method === 'cash' ? 'warning' : 'success'}>{order.payment_method}</Badge></td><td className="py-3 px-4"><Badge variant={order.status === 'pending' ? 'warning' : order.status === 'preparing' ? 'preparing' : order.status === 'ready' ? 'ready' : order.status === 'served' ? 'served' : 'cancelled'}>{order.status}</Badge></td><td className="py-3 px-4 text-right font-bold">{formatPrice(order.total_amount)}</td><td className="py-3 px-4 text-right text-gray-500">{new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>))}</tbody></table></div></Card>

      {/* Customer Data Export for Ads */}
      <Card className="p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users size={20} className="text-primary" /> Customer Data - For Ads & Retargeting</h3>
          <button onClick={() => {
            const customerMap = new Map<string, { name: string; phone: string; orderCount: number; totalSpent: number; lastOrder: string }>();
            orders.filter(o => o.status !== 'cancelled').forEach(o => {
              const key = o.customer_phone;
              const existing = customerMap.get(key);
              if (existing) { existing.orderCount += 1; existing.totalSpent += o.total_amount; if (new Date(o.created_at) > new Date(existing.lastOrder)) existing.lastOrder = o.created_at; }
              else { customerMap.set(key, { name: o.customer_name, phone: o.customer_phone, orderCount: 1, totalSpent: o.total_amount, lastOrder: o.created_at }); }
            });
            const csvData = Array.from(customerMap.values()).map(c => ({ Name: c.name, Phone: c.phone, 'Order Count': c.orderCount, 'Total Spent': c.totalSpent, 'Last Order': new Date(c.lastOrder).toLocaleDateString('en-IN') }));
            exportToCSV(csvData, `customers-retargeting-${new Date().toISOString().split('T')[0]}`);
            toast.success(`Exported ${csvData.length} customers`);
          }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"><Download size={16} /> Export Customer CSV</button>
        </div>
        <p className="text-sm text-gray-500">Export customer names, phone numbers, order counts, and total spent. Use this data for WhatsApp/SMS marketing campaigns and ad retargeting.</p>
      </Card>
    </div>
  );
};

/* ==================== MENU MANAGEMENT TAB ==================== */
const MenuManagementTab = ({ menuItems, setMenuItems, categories, fetchMenuData }: {
  menuItems: MenuItem[]; setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>; categories: Category[]; fetchMenuData: () => void;
}) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleAvailability = async (item: MenuItem) => {
    try { const { error } = await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id); if (error) throw error; fetchMenuData(); toast.success(item.name + ' ' + (!item.is_available ? 'is now available' : 'marked unavailable')); } catch { toast.error('Failed to update'); }
  };
  const toggleBestseller = async (item: MenuItem) => {
    try { const { error } = await supabase.from('menu_items').update({ is_bestseller: !item.is_bestseller }).eq('id', item.id); if (error) throw error; fetchMenuData(); toast.success(item.name + ' ' + (!item.is_bestseller ? 'marked as bestseller' : 'removed from bestsellers')); } catch { toast.error('Failed to update'); }
  };
  const toggleTodaysSpecial = async (item: MenuItem) => {
    try { const { error } = await supabase.from('menu_items').update({ is_todays_special: !item.is_todays_special }).eq('id', item.id); if (error) throw error; fetchMenuData(); toast.success(item.name + ' ' + (!item.is_todays_special ? 'marked as today special' : 'removed from today special')); } catch { toast.error('Failed to update'); }
  };
  const deleteItem = async (item: MenuItem) => {
    if (!confirm('Delete ' + item.name + '?')) return;
    try { const { error } = await supabase.from('menu_items').delete().eq('id', item.id); if (error) throw error; fetchMenuData(); toast.success(item.name + ' deleted'); } catch { toast.error('Failed to delete'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = (itemId || 'new') + '-' + Date.now() + '.' + fileExt;
      const { error: uploadError } = await supabase.storage.from('menu-photos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('menu-photos').getPublicUrl(fileName);
      if (itemId && editingItem) { await supabase.from('menu_items').update({ image_url: publicUrl }).eq('id', itemId); setEditingItem({ ...editingItem, image_url: publicUrl }); fetchMenuData(); }
      toast.success('Image uploaded');
    } catch (err: any) { toast.error(err.message || 'Upload failed'); }
    finally { setUploadingImage(false); }
  };

  const handleDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    const activeItem = menuItems.find(i => i.id === active.id);
    const overItem = menuItems.find(i => i.id === over.id);
    if (!activeItem || !overItem || activeItem.category_id !== overItem.category_id) return;

    const catItems = menuItems
      .filter(i => i.category_id === activeItem.category_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const oldIndex = catItems.findIndex(i => i.id === active.id);
    const newIndex = catItems.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(catItems, oldIndex, newIndex);

    // Instant local state update — zero lag
    const otherItems = menuItems.filter(i => i.category_id !== activeItem.category_id);
    setMenuItems([...otherItems, ...reordered.map((item, idx) => ({ ...item, sort_order: idx }))]);

    // Fire-and-forget persist to Supabase — no await, no blocking
    reordered.forEach((item, idx) => {
      supabase.from('menu_items').update({ sort_order: idx }).eq('id', item.id);
    });
  };

  const filteredItems = menuItems.filter(item => {
    if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.name_kn && item.name_kn.includes(q));
    }
    return true;
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search items..." className="bg-transparent border-none outline-none w-full text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => { setEditingItem(null); setShowAddForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"><Plus size={16} /> Add Item</button>
        </div>

        {menuItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
            <Settings size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No menu items yet. Add your first item.</p>
          </div>
        ) : (
          categories.map(category => {
            const catItems = filteredItems.filter(i => i.category_id === category.id).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            if (catItems.length === 0) return null;
            return (
              <div key={category.id} className="mb-6">
                <h3 className="text-md font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">{category.name} <span className="text-sm font-normal text-gray-400">({catItems.length})</span></h3>
                <SortableContext items={catItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {catItems.map(item => (
                      <SortableMenuItem
                        key={item.id}
                        item={item}
                        toggleAvailability={toggleAvailability}
                        toggleBestseller={toggleBestseller}
                        toggleTodaysSpecial={toggleTodaysSpecial}
                        deleteItem={deleteItem}
                        setEditingItem={setEditingItem}
                        setShowAddForm={setShowAddForm}
                        isDragging={activeDragId === item.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })
        )}

        {showAddForm && <ItemFormModal item={editingItem} categories={categories} onClose={() => { setShowAddForm(false); setEditingItem(null); }} onSuccess={() => { setShowAddForm(false); setEditingItem(null); fetchMenuData(); }} onImageUpload={handleImageUpload} uploadingImage={uploadingImage} />}
      </div>
    </DndContext>
  );
};

/* ==================== SORTABLE MENU ITEM ==================== */
const SortableMenuItem = ({ item, toggleAvailability, toggleBestseller, toggleTodaysSpecial, deleteItem, setEditingItem, setShowAddForm, isDragging }: {
  item: MenuItem;
  toggleAvailability: (item: MenuItem) => void;
  toggleBestseller: (item: MenuItem) => void;
  toggleTodaysSpecial: (item: MenuItem) => void;
  deleteItem: (item: MenuItem) => void;
  setEditingItem: (item: MenuItem | null) => void;
  setShowAddForm: (show: boolean) => void;
  isDragging: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-40' : ''}>
      <Card className="p-4 flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical size={20} className="text-gray-300" />
        </div>
        <img src={item.image_url || 'https://via.placeholder.com/80'} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-800 truncate">{item.name}</p>
            {item.is_bestseller && <Star size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
            {item.is_todays_special && <Sparkles size={14} className="text-primary flex-shrink-0" />}
          </div>
          <p className="text-sm text-gray-500">Rs.{item.price}{item.variants && item.variants.length > 0 ? ' - ' + item.variants.length + ' variants' : ''}</p>
          {item.available_from && item.available_until && <p className="text-xs text-blue-500 mt-1">{item.available_from} - {item.available_until}</p>}
          <div className="flex gap-2 mt-2">
            <button onClick={() => toggleAvailability(item)} className={'px-2 py-0.5 text-xs font-bold rounded-full transition-colors ' + (item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{item.is_available ? 'Available' : 'Out of Stock'}</button>
            <button onClick={() => toggleBestseller(item)} className={'px-2 py-0.5 text-xs font-bold rounded-full transition-colors ' + (item.is_bestseller ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500')}>Bestseller</button>
            <button onClick={() => toggleTodaysSpecial(item)} className={'px-2 py-0.5 text-xs font-bold rounded-full transition-colors ' + (item.is_todays_special ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500')}>Today's Special</button>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => { setEditingItem(item); setShowAddForm(true); }} className="p-2 text-gray-400 hover:text-primary hover:bg-green-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
          <button onClick={() => deleteItem(item)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      </Card>
    </div>
  );
};

/* ==================== ITEM FORM MODAL ==================== */
const ItemFormModal = ({ item, categories, onClose, onSuccess, onImageUpload, uploadingImage }: {
  item: MenuItem | null; categories: Category[]; onClose: () => void; onSuccess: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, itemId?: string) => void; uploadingImage: boolean;
}) => {
  const [name, setName] = useState(item?.name || '');
  const [nameKn, setNameKn] = useState(item?.name_kn || '');
  const [description, setDescription] = useState(item?.description || '');
  const [descriptionKn, setDescriptionKn] = useState(item?.description_kn || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [hasVariants, setHasVariants] = useState(item?.has_variants || false);
  const [variants, setVariants] = useState(item?.variants || [{ id: '', name: '', price: 0 }]);
  const [availableFrom, setAvailableFrom] = useState(item?.available_from || '');
  const [availableUntil, setAvailableUntil] = useState(item?.available_until || '');
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameKn, setNewCatNameKn] = useState('');

  const addVariant = () => setVariants([...variants, { id: '', name: '', price: 0 }]);
  const removeVariant = (idx: number) => setVariants(variants.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: string, value: string | number) => { const u = [...variants]; u[idx] = { ...u[idx], [field]: value }; setVariants(u); };

  const handleSave = async () => {
    if (!name || !price) { toast.error('Name and price are required'); return; }
    if (!categoryId && !showNewCategory) { toast.error('Select a category or add a new one'); return; }
    setSaving(true);
    try {
      let finalCategoryId = categoryId;
      if (showNewCategory && newCatName) {
        const { data: newCat, error: catError } = await supabase.from('categories').insert({ name: newCatName, name_kn: newCatNameKn || null }).select().single();
        if (catError) throw catError;
        finalCategoryId = newCat.id;
      }
      const data = { name, name_kn: nameKn, description, description_kn: descriptionKn, price: parseFloat(price), image_url: imageUrl, category_id: finalCategoryId, has_variants: hasVariants, available_from: availableFrom || null, available_until: availableUntil || null, variants: hasVariants ? variants.filter(v => v.name).map(v => ({ ...v, id: v.id || v.name.toLowerCase().replace(/\s/g, '-') })) : [] };
      if (item) { const { error } = await supabase.from('menu_items').update(data).eq('id', item.id); if (error) throw error; toast.success(name + ' updated'); }
      else { const { error } = await supabase.from('menu_items').insert(data); if (error) throw error; toast.success(name + ' added'); }
      onSuccess();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-gray-800">{item ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">Photo</label>
            <div className="flex items-center gap-4">
              {imageUrl && <img src={imageUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover bg-gray-100" />}
              <div className="flex-1">
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Paste image URL" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-2" />
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors w-fit">
                  <ImageIcon size={16} /> Upload Photo
                  <input type="file" accept="image/*" onChange={(e) => onImageUpload(e, item?.id)} className="hidden" disabled={uploadingImage} />
                </label>
                {uploadingImage && <span className="text-xs text-gray-500">Uploading...</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Name (English) *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Name (Kannada)</label>
              <input type="text" value={nameKn} onChange={(e) => setNameKn(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Description (English)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Description (Kannada)</label>
              <input type="text" value={descriptionKn} onChange={(e) => setDescriptionKn(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Price (Rs.) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" min="0" required />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-1 block">Category *</label>
              {!showNewCategory ? (
                <div>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button onClick={() => setShowNewCategory(true)} className="text-xs text-primary font-bold mt-1">+ Add new category</button>
                </div>
              ) : (
                <div>
                  <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="New category name" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-1" />
                  <input type="text" value={newCatNameKn} onChange={(e) => setNewCatNameKn(e.target.value)} placeholder="Kannada name (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm mb-1" />
                  <button onClick={() => { setShowNewCategory(false); setNewCatName(''); setNewCatNameKn(''); }} className="text-xs text-gray-500 font-bold">Cancel, use existing category</button>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Has Variants</span>
          </label>

          {hasVariants && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700">Variants</label>
                <button onClick={addVariant} className="text-sm text-primary font-bold flex items-center gap-1"><Plus size={14} /> Add</button>
              </div>
              <div className="space-y-2">
                {variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input type="text" value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder="Name (e.g. Half)" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                    <input type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} placeholder="Price" className="w-24 px-3 py-2 border border-gray-200 rounded-xl text-sm" min="0" />
                    <button onClick={() => removeVariant(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2"><Timer size={16} /> Time Availability (optional)</label>
            <p className="text-xs text-gray-400 mb-2">Leave blank for all-day availability</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Available From</label>
                <input type="time" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Available Until</label>
                <input type="time" value={availableUntil} onChange={(e) => setAvailableUntil(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">{saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}{item ? 'Update' : 'Add'} Item</button>
        </div>
      </div>
    </div>
  );
};
