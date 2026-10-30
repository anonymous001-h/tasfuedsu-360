import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useUpload } from '@/hooks/useUpload';
import { useToast } from '@/contexts/ToastContext';

interface FileUploadProps {
  onUploaded: (url: string, path: string) => void;
  currentUrl?: string;
  label?: string;
  accept?: string;
  folder?: string;
}

export function FileUpload({ onUploaded, currentUrl, label = 'Upload Image', accept = 'image/*', folder = 'uploads' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, progress, uploadFile } = useUpload();
  const { showToast } = useToast();
  const [preview, setPreview] = useState(currentUrl || '');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)', 'error');
      return;
    }
    const result = await uploadFile(file, folder);
    if (result) {
      setPreview(result.url);
      onUploaded(result.url, result.path);
      showToast('Upload successful', 'success');
    } else {
      showToast('Upload failed', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragOver ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-navy-200 dark:border-dark-border hover:border-brand-400'
        }`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); setPreview(''); onUploaded('', ''); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
              {uploading ? <Upload className="w-5 h-5 animate-pulse" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <p className="text-sm font-medium text-navy-700 dark:text-dark-text">
              {uploading ? `Uploading... ${progress}%` : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-navy-400 dark:text-dark-muted mt-1">PNG, JPG up to 10MB</p>
            {uploading && (
              <div className="w-full max-w-[200px] mt-3">
                <div className="h-1.5 bg-navy-100 dark:bg-dark-surface2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
