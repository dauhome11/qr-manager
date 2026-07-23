import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode.react';
import { Plus, Edit2, Trash2, Download, Copy, Check, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const TABLE = 'qr_codes';

export default function QRManager() {
  const [qrList, setQrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | online | offline | not_configured
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

  // Map row từ Supabase -> shape dùng trong UI
  const mapRow = (row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description || '',
    logoPreview: row.logo_data || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

  const fetchAll = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) throw fetchError;
    return (data || []).map(mapRow);
  }, []);

  // Load lần đầu + set up realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConnectionStatus('not_configured');
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const rows = await fetchAll();
        if (isMounted) {
          setQrList(rows);
          setConnectionStatus('online');
        }
      } catch (err) {
        console.error('Không tải được dữ liệu từ Supabase:', err);
        if (isMounted) {
          setError('Không kết nối được Supabase. Kiểm tra lại VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
          setConnectionStatus('offline');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const channel = supabase
      .channel('qr_codes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE },
        (payload) => {
          setQrList((prev) => {
            if (payload.eventType === 'INSERT') {
              const incoming = mapRow(payload.new);
              if (prev.some((item) => item.id === incoming.id)) return prev;
              return [incoming, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              const updated = mapRow(payload.new);
              return prev.map((item) => (item.id === updated.id ? updated : item));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((item) => item.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('online');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnectionStatus('offline');
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

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

  const handleSubmit = async (e) => {
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
    if (!isSupabaseConfigured) {
      setError('Chưa cấu hình Supabase. Xem README.md để kết nối trước khi lưu dữ liệu.');
      return;
    }

    try {
      if (editingId) {
        const current = qrList.find((item) => item.id === editingId);
        const { data, error: updateError } = await supabase
          .from(TABLE)
          .update({
            name: formData.name,
            url: formData.url,
            description: formData.description,
            logo_data: formData.logoPreview ?? current?.logoPreview ?? null
          })
          .eq('id', editingId)
          .select()
          .single();
        if (updateError) throw updateError;
        const updated = mapRow(data);
        setQrList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setEditingId(null);
      } else {
        const { data, error: insertError } = await supabase
          .from(TABLE)
          .insert({
            name: formData.name,
            url: formData.url,
            description: formData.description,
            logo_data: formData.logoPreview || null
          })
          .select()
          .single();
        if (insertError) throw insertError;
        const created = mapRow(data);
        setQrList((prev) => (prev.some((item) => item.id === created.id) ? prev : [created, ...prev]));
      }

      setFormData({ name: '', url: '', description: '', logoFile: null, logoPreview: null });
    } catch (err) {
      console.error('Lưu QR code thất bại:', err);
      setError('Lưu thất bại: ' + (err.message || 'lỗi không xác định'));
    }
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

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa QR code này?')) return;
    try {
      const { error: deleteError } = await supabase.from(TABLE).delete().eq('id', id);
      if (deleteError) throw deleteError;
      setQrList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Xóa QR code thất bại:', err);
      setError('Xóa thất bại: ' + (err.message || 'lỗi không xác định'));
    }
  };

  const handleRefresh = async () => {
    setConnectionStatus('connecting');
    try {
      const rows = await fetchAll();
      setQrList(rows);
      setConnectionStatus('online');
    } catch (err) {
      console.error('Làm mới thất bại:', err);
      setConnectionStatus('offline');
    }
  };

  const handleDownload = (qrId) => {
    const element = qrRefs.current[qrId];
    if (element) {
      const canvas = element.querySelector('canvas');
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      const qrData = qrList.find((q) => q.id === qrId);
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
    setFormData({ name: '', url: '', description: '', logoFile: null, logoPreview: null });
    setEditingId(null);
    setError('');
  };

  const statusLabel = {
    connecting: { text: 'Đang kết nối...', color: 'text-slate-500', icon: RefreshCw, spin: true },
    online: { text: 'Đã đồng bộ (realtime)', color: 'text-green-600', icon: Wifi, spin: false },
    offline: { text: 'Mất kết nối Supabase', color: 'text-red-600', icon: WifiOff, spin: false },
    not_configured: { text: 'Chưa cấu hình Supabase', color: 'text-amber-600', icon: AlertCircle, spin: false }
  }[connectionStatus];

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
              onClick={handleRefresh}
              disabled={connectionStatus === 'connecting' || !isSupabaseConfigured}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            {statusLabel && (
              <span className={`flex items-center gap-1 text-xs ${statusLabel.color}`}>
                <statusLabel.icon className="w-3.5 h-3.5" />
                {statusLabel.text}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {connectionStatus === 'not_configured' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              Chưa kết nối Supabase. Tạo file <code className="font-mono">.env</code> từ <code className="font-mono">.env.example</code>,
              điền <code className="font-mono">VITE_SUPABASE_URL</code> và <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>, xem chi tiết trong README.md.
            </p>
          </div>
        )}

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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        onClick={() => setFormData({ ...formData, logoFile: null, logoPreview: null })}
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
        {loading ? (
          <div className="text-center py-16 text-slate-500">Đang tải dữ liệu...</div>
        ) : qrList.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-6">
              📋 Danh sách QR Codes ({qrList.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrList.map((qr) => (
                <div key={qr.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  {/* QR Preview */}
                  <div ref={(el) => (qrRefs.current[qr.id] = el)} className="p-6 bg-slate-50 border-b border-slate-200">
                    <div className="flex justify-center">
                      <QRCode
                        value={qr.url}
                        size={800}
                        level="H"
                        includeMargin={true}
                        style={{ width: '200px', height: '200px' }}
                        imageSettings={
                          qr.logoPreview
                            ? {
                                src: qr.logoPreview,
                                x: undefined,
                                y: undefined,
                                height: 160,
                                width: 160,
                                excavate: true
                              }
                            : undefined
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
