'use client';

import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [pageDrag, setPageDrag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件（JPG / PNG / WEBP）');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('文件大小不能超过 12MB');
      return;
    }
    setError(null);
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
    setProcessedImage(null);
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Zone drag
  const onZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onZoneDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onZoneDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  // Page drag
  const onPageDragEnter = () => {
    dragCounterRef.current++;
    setPageDrag(true);
  };
  const onPageDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) { dragCounterRef.current = 0; setPageDrag(false); }
  };
  const onPageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0; setPageDrag(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f);
  };

  const handleRemoveBg = async () => {
    if (!originalImage || !fileName) return;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch(originalImage);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type });
      const formData = new FormData();
      formData.append('image', file);
      const apiRes = await fetch('/api/remove-bg', { method: 'POST', body: formData });
      if (!apiRes.ok) {
        const d = await apiRes.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || `处理失败: ${apiRes.status}`);
      }
      const resultBlob = await apiRes.blob();
      setProcessedImage(URL.createObjectURL(resultBlob));
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = 'bgeraser-output.png';
    a.click();
  };

  const resetFile = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="min-h-screen text-slate-100 overflow-x-hidden"
      style={{ background: '#0f0f1a' }}
      onDragEnter={onPageDragEnter}
      onDragLeave={onPageDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onPageDrop}
    >
      {/* Page drag overlay */}
      {pageDrag && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center text-2xl font-bold pointer-events-none"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '3px dashed #6366f1',
            color: '#818cf8',
          }}
        >
          🎯 松开鼠标上传图片
        </div>
      )}

      {/* Glow background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(236,72,153,0.1) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />

      {/* HEADER */}
      <header
        className="relative z-10 flex items-center justify-between px-10 py-5"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(15,15,26,0.8)',
        }}
      >
        <div className="flex items-center gap-3 font-bold text-xl">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-xl text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
          >
            ✂️
          </div>
          BgEraser
        </div>
        <div
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))',
            border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8',
          }}
        >
          AI 智能抠图
        </div>
      </header>

      {/* HERO */}
      <div className="relative z-5 text-center px-5" style={{ paddingTop: 70, paddingBottom: 50 }}>
        <div
          className="inline-flex items-center gap-2 text-xs px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#10b981' }}
          />
          AI Powered · 秒级处理 · 高清输出
        </div>

        <h1 className="font-bold leading-tight mb-5" style={{ fontSize: 'clamp(36px,6vw,60px)', letterSpacing: '-1px' }}>
          告别复杂抠图
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            一键去除背景
          </span>
        </h1>

        <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: '#94a3b8' }}>
          上传图片，AI 自动识别主体，精准移除背景，输出高清透明 PNG。
        </p>

        <div className="flex justify-center gap-8 mt-8">
          {[['5s', '平均处理时间'], ['HD', '高清输出'], ['Free', '完全免费']].map(([num, label]) => (
            <div key={num} className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #818cf8, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {num}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="relative z-5 max-w-3xl mx-auto mb-16 px-5">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: '#16162a',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}
        >
          <div className="p-10">

            {/* Upload zone or file selected */}
            {!originalImage ? (
              <div
                className="relative rounded-2xl text-center cursor-pointer transition-all duration-300"
                style={{
                  border: isDragging
                    ? '2px solid #6366f1'
                    : '2px dashed rgba(99,102,241,0.35)',
                  padding: '60px 40px',
                  background: isDragging ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.03)',
                  transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                }}
                onDragOver={onZoneDragOver}
                onDragLeave={onZoneDragLeave}
                onDrop={onZoneDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="w-20 h-20 mx-auto mb-5 flex items-center justify-center rounded-2xl text-4xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  📁
                </div>
                <p className="text-lg font-semibold mb-2">拖拽图片到这里，或点击选择</p>
                <p className="text-sm" style={{ color: '#94a3b8' }}>支持格式如下，最大 12MB</p>
                <div className="flex justify-center gap-2 mt-4">
                  {['JPG', 'PNG', 'WEBP', 'BMP'].map((f) => (
                    <span
                      key={f}
                      className="text-xs font-medium px-2.5 py-1 rounded-md"
                      style={{
                        background: '#1e1e35',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#94a3b8',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            ) : (
              /* File selected state */
              <div
                className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-200"
                style={{
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.25)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-xl flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.15)' }}
                >
                  ✅
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: '#10b981' }}>{fileName}</p>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>{fileSize} · 点击重新选择</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); resetFile(); }}
                  className="flex-shrink-0 text-sm px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.05)' }}
                >
                  ✕
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            )}

            {/* Process button */}
            {originalImage && !processedImage && (
              <button
                onClick={handleRemoveBg}
                disabled={isProcessing}
                className="w-full mt-5 py-4 rounded-2xl text-base font-semibold text-white transition-all duration-300"
                style={
                  isProcessing
                    ? { background: 'rgba(99,102,241,0.35)', cursor: 'not-allowed' }
                    : {
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        boxShadow: '0 0 0 0 rgba(99,102,241,0)',
                      }
                }
                onMouseEnter={(e) => {
                  if (!isProcessing) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 15px 30px rgba(99,102,241,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    AI 正在处理中，请稍候...
                  </span>
                ) : (
                  '✨ 开始移除背景'
                )}
              </button>
            )}

            {/* Loading detail */}
            {isProcessing && (
              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: '#94a3b8' }}>通常需要 3~10 秒，请耐心等待</p>
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: '#1e1e35' }}>
                  <div
                    className="h-full rounded-full animate-pulse"
                    style={{
                      width: '60%',
                      background: 'linear-gradient(90deg, #6366f1, #ec4899)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-5 px-5 py-4 rounded-xl flex items-center gap-3 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                }}
              >
                <span className="text-lg flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            {/* Result comparison */}
            {processedImage && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-lg font-semibold">🎉 处理完成</p>
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10b981',
                    }}
                  >
                    ✓ 成功
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Original */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#1e1e35', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                      style={{
                        color: '#94a3b8',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#94a3b8' }} />
                      原始图片
                    </div>
                    <div className="p-3 flex items-center justify-center min-h-44">
                      <img src={originalImage ?? undefined} alt="原图" className="max-w-full max-h-56 rounded-lg object-contain" />
                    </div>
                  </div>

                  {/* Processed */}
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: '#1e1e35', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                      style={{
                        color: '#94a3b8',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                      背景移除后
                    </div>
                    <div
                      className="p-3 flex items-center justify-center min-h-44"
                      style={{
                        background:
                          'repeating-conic-gradient(#1e1e35 0 90deg, #252540 0 180deg) 0 0 / 20px 20px',
                      }}
                    >
                      <img
                        src={processedImage}
                        alt="处理后"
                        className="max-w-full max-h-56 rounded-lg object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRemoveBg}
                    disabled={isProcessing}
                    className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ background: '#1e1e35', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    重新处理
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white transition-all duration-300"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', flex: 2 }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 15px 30px rgba(16,185,129,0.35)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                    }}
                  >
                    ⬇️ 下载透明 PNG
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="relative z-5 max-w-3xl mx-auto mb-20 px-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '⚡', title: '极速处理', desc: '基于 Remove.bg AI 引擎，秒级精准抠图，告别漫长等待。' },
            { icon: '🔒', title: '隐私安全', desc: '图片仅用于处理，不做存储和留存，保护你的隐私数据。' },
            { icon: '🎨', title: '高清输出', desc: '输出透明 PNG 格式，保留最高质量细节，适合商业使用。' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{ background: '#16162a', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(99,102,241,0.3)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 15px 30px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-semibold mb-1.5 text-sm">{title}</div>
              <div className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer
        className="relative z-5 text-center py-8 text-sm"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
      >
        Powered by{' '}
        <a href="https://remove.bg" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>
          Remove.bg
        </a>{' '}
        &amp;{' '}
        <a href="https://workers.cloudflare.com" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>
          Cloudflare Workers
        </a>
      </footer>
    </div>
  );
}
