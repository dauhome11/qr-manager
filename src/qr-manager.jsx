import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import { Plus, Edit2, Trash2, Download, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';

// 👉 Dán URL Web App từ Google Apps Script vào đây sau khi deploy
const SHEET_SYNC_URL = 'https://script.google.com/macros/s/AKfycbyUdG3hcP_uPAASMqjwWp_0CdSPOXK6Pj9L3-T6xJZXmD5ocaq31WvZ9TpueEURx0UR/exec';

async function syncToSheet(action, payload) {
  if (!SHEET_SYNC_URL || SHEET_SYNC_URL.includes('PASTE_YOUR')) return;
  try {
    await fetch(SHEET_SYNC_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script không hỗ trợ CORS response, dùng no-cors để gửi được request
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...payload })
    });
  } catch (err) {
    console.error('Sync to Google Sheet failed:', err);
  }
}

export default function QRManager() {
  const [qrList, setQrList] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    logoFile: null,
    logoPreview: null
  });
  const [editingId, setEditingId] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const qrRefs = useRef({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('qrData');
    if (saved) {
      setQrList(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever qrList changes
  useEffect(() => {
    localStorage.setItem('qrData', JSON.stringify(qrList));
  }, [qrList]);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({
          ...formData,
          logoFile: file,
          logoPreview: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên QR code');
      return;
    }

    if (!formData.url.trim()) {
      setError('Vui lòng nhập URL');
      return;
    }

    if (!isValidUrl(formData.url)) {
      setError('URL không hợp lệ. Ví dụ: https://example.com');
      return;
    }

    if (editingId) {
      const updatedQR = {
        ...qrList.find(item => item.id === editingId),
        name: formData.name,
        url: formData.url,
        description: formData.description,
        logoPreview: formData.logoPreview || qrList.find(item => item.id === editingId)?.logoPreview,
        updatedAt: new Date().toISOString()
      };
      setQrList(qrList.map(item => item.id === editingId ? updatedQR : item));
      setEditingId(null);
      setSyncStatus('syncing');
      syncToSheet('update', { qr: updatedQR }).finally(() => setSyncStatus('synced'));
    } else {
      const newQR = {
        id: Date.now(),
        name: formData.name,
        url: formData.url,
        description: formData.description,
        logoPreview: formData.logoPreview,
        createdAt: new Date().toISOString()
      };
      setQrList([newQR, ...qrList]);
      setSyncStatus('syncing');
      syncToSheet('create', { qr: newQR }).finally(() => setSyncStatus('synced'));
    }

    setFormData({
      name: '',
      url: '',
      description: '',
      logoFile: null,
      logoPreview: null
    });
  };

  const handleEdit = (qr) => {
    setFormData({
      name: qr.name,
      url: qr.url,
      description: qr.description,
      logoFile: null,
      logoPreview: qr.logoPreview
    });
    setEditingId(qr.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (confirm('Xác nhận xóa QR code này?')) {
      setQrList(qrList.filter(item => item.id !== id));
      setSyncStatus('syncing');
      syncToSheet('delete', { id }).finally(() => setSyncStatus('synced'));
    }
  };

  const handleManualSync = () => {
    setSyncStatus('syncing');
    syncToSheet('sync_all', { qrList }).finally(() => setSyncStatus('synced'));
  };

  const handleDownload = (qrId) => {
    const element = qrRefs.current[qrId];
    if (element) {
      const canvas = element.querySelector('canvas');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      const qrData = qrList.find(q => q.id === qrId);
      link.download = `QR-${qrData.name}-${new Date().getTime()}.png`;
      link.click();
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      logoFile: null,
      logoPreview: null
    });
    setEditingId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">QR Code Manager</h1>
            <p className="text-slate-600 mt-2">Tạo, quản lý và tùy chỉnh QR code cho marketing, thanh toán & social</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleManualSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              Đồng bộ Sheet
            </button>
            {syncStatus === 'synced' && (
              <span className="text-xs text-green-600">✓ Đã đồng bộ</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {editingId ? '✏️ Chỉnh sửa QR Code' : '✨ Tạo QR Code Mới'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên QR Code *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ví dụ: Landing Page Năm 2026"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL *
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả (tuỳ chọn)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ghi chú về QR code này..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows="3"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Logo (tuỳ chọn) - PNG/JPG tối đa 5MB
                </label>
                <div className="flex gap-4 items-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-500 hover:text-blue-600 transition font-medium"
                  >
                    Chọn Logo
                  </button>
                  {formData.logoPreview && (
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.logoPreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, logoFile: null, logoPreview: null})}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {editingId ? 'Cập nhật' : 'Tạo QR Code'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* QR List Section */}
        {qrList.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              📋 Danh sách QR Codes ({qrList.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrList.map((qr) => (
                <div key={qr.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  {/* QR Preview */}
                  <div ref={el => qrRefs.current[qr.id] = el} className="p-6 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-center">
                      <QRCode
                        value={qr.url}
                        size={200}
                        level="H"
                        includeMargin={true}
                        imageSettings={
                          qr.logoPreview ? {
                            src: qr.logoPreview,
                            x: undefined,
                            y: undefined,
                            height: 40,
                            width: 40,
                            excavate: true
                          } : undefined
                        }
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <h3 className="font-semibold text-slate-900 mb-2 truncate">{qr.name}</h3>
                    
                    {qr.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{qr.description}</p>
                    )}

                    {/* URL Display */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 font-medium mb-1">URL</p>
                      <p className="text-xs text-slate-700 break-all font-mono">{qr.url}</p>
                    </div>

                    {/* Created Date */}
                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(qr.createdAt).toLocaleDateString('vi-VN')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(qr.url)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                      >
                        {copied === qr.url ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(qr.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleEdit(qr)}
                        className="px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(qr.id)}
                        className="px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-300">
            <p className="text-slate-500 font-medium mb-2">Chưa có QR Code nào</p>
            <p className="text-slate-400 text-sm">Tạo QR Code đầu tiên bằng form phía trên</p>
          </div>
        )}
      </div>

    </div>
  );
}
