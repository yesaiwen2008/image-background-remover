'use client';

import { useState, useRef } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件 (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return;
    }

    setError(null);
    setFileName(file.name);
    setProcessedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemoveBg = async () => {
    if (!originalImage || !fileName) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(originalImage);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      const formData = new FormData();
      formData.append('image', file);

      const apiResponse = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `处理失败: ${apiResponse.status}`);
      }

      const resultBlob = await apiResponse.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setProcessedImage(resultUrl);
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
    a.download = 'no-background.png';
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            🖼️ 图片背景移除
          </h1>
          <p className="text-gray-600 text-lg">一键智能移除图片背景，简单高效</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
          {!originalImage ? (
            <div
              className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                isDragging
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <div className="text-6xl mb-4">📁</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">点击或拖拽图片到这里</p>
              <p className="text-gray-500">支持 JPG, PNG, WEBP，最大 10MB</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="text-3xl">🖼️</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{fileName}</p>
                  <p className="text-sm text-gray-500">点击更换图片</p>
                </div>
              </div>

              {!processedImage ? (
                <div className="text-center">
                  <button
                    onClick={handleRemoveBg}
                    disabled={isProcessing}
                    className={`px-8 py-4 rounded-xl text-lg font-semibold text-white transition-all duration-300 ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-200'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> 正在处理中...
                      </span>
                    ) : (
                      '移除背景'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-center font-medium text-gray-700 mb-3">原图</p>
                      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                        <img
                          src={originalImage}
                          alt="Original"
                          className="w-full h-auto max-h-80 object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-center font-medium text-gray-700 mb-3">处理后</p>
                      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-purple-300">
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                          }}
                        />
                        <img
                          src={processedImage}
                          alt="Processed"
                          className="relative z-10 w-full h-auto max-h-80 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleRemoveBg}
                      disabled={isProcessing}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                        isProcessing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      重新处理
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-200 transition-all duration-300"
                    >
                      ⬇️ 下载 PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <span className="font-medium">❌ 错误：</span>
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🔒 我们不会存储您的图片，所有处理都在内存中完成</p>
        </div>
      </div>
    </div>
  );
}
