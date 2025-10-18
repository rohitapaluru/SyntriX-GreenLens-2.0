import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { User, WasteType, Report } from './types';
import { analyzeWasteImage, fileToBase64 } from './services/geminiService';
import Button from './components/Button';
import Spinner from './components/Spinner';
import Modal from './components/Modal';

const REWARD_PER_VALID_REPORT = 50;

export default function HomePage({
  user,
  onReportSubmitted,
}: {
  user: User;
  onReportSubmitted: (data: Omit<Report, 'id' | 'userId' | 'timestamp' | 'status'>) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Cache, setBase64Cache] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ isWastePresent: boolean; confidenceScore: number; wasteType?: WasteType } | null>(null);
  const [manualType, setManualType] = useState<WasteType | 'Auto' | ''>('Auto');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const analyzeTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // create preview URL and revoke when changed
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      setBase64Cache(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Debounced analysis when an image is chosen
  useEffect(() => {
    if (!imageFile) {
      setAnalysisResult(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    if (analyzeTimerRef.current) {
      clearTimeout(analyzeTimerRef.current);
    }

    analyzeTimerRef.current = window.setTimeout(async () => {
      try {
        // convert to base64 once and cache it
        const b64 = await fileToBase64(imageFile);
        setBase64Cache(b64);
        const mime = imageFile.type || 'image/jpeg';
        const res = await analyzeWasteImage(b64, mime);
        setAnalysisResult(res);
        // if auto-detected, set manualType to 'Auto' to indicate automatic pick
        setManualType('Auto');
      } catch (e) {
        console.error('Analysis failed', e);
        setAnalysisResult(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 600);

    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported by your browser.');
      return;
    }
    setLocationStatus('Requesting location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('Location captured');
      },
      (err) => setLocationStatus(`Could not get location: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    setDragOver(false);
    const f = ev.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setImageFile(f);
    }
  };

  const handleFileChange = (f?: File) => {
    const file = f ?? fileInputRef.current?.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image file.');
    setImageFile(file);
  };

  const clearForm = () => {
    setImageFile(null);
    setDescription('');
    setAnalysisResult(null);
    setManualType('Auto');
    setLocation(null);
    setLocationStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const estimatedReward = useMemo(() => {
    // give more reward if analysis confidence is high and waste detected
    if (!analysisResult) return 5;
    if (!analysisResult.isWastePresent) return 5;
    const c = analysisResult.confidenceScore ?? 0;
    if (c > 90) return REWARD_PER_VALID_REPORT + 20;
    if (c > 75) return REWARD_PER_VALID_REPORT;
    return REWARD_PER_VALID_REPORT - 10;
  }, [analysisResult]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!imageFile && !description) {
      return alert('Add a photo or description before submitting.');
    }
    // prefer cached base64 from analysis step
    let imageUrl: string | undefined = base64Cache ?? undefined;
    if (!imageUrl && imageFile) {
      try {
        imageUrl = await fileToBase64(imageFile);
      } catch {
        imageUrl = undefined;
      }
    }

    const payload: Omit<Report, 'id' | 'userId' | 'timestamp' | 'status'> = {
      description: description || undefined,
      wasteType: manualType && manualType !== 'Auto' ? manualType : analysisResult?.wasteType,
      location: location ? { lat: location.lat, lng: location.lng } : undefined,
      imageUrl,
    };

    // show confirmation modal
    setConfirmOpen(true);
    // if user confirms in modal, we'll call onReportSubmitted (see below)
    // store payload temporarily on modal confirm via closure
    const onConfirm = () => {
      onReportSubmitted(payload);
      clearForm();
      setConfirmOpen(false);
    };

    // attach onConfirm to modal via a small delay to let render attach handler
    // we'll store it on window for simplicity in this small app (cleanup immediately)
    (window as any).__greenlens_confirm = onConfirm;
  };

  const confirmSubmit = () => {
    const fn = (window as any).__greenlens_confirm;
    if (typeof fn === 'function') fn();
    delete (window as any).__greenlens_confirm;
  };

  const wasteTypes: WasteType[] = ['Plastic', 'Glass', 'Metal', 'Organic', 'Other'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Submit a waste report</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`rounded-lg border-2 p-4 transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-50/30' : 'border-dashed border-slate-200 dark:border-slate-700'}`}
        >
          <label className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">Photo</div>
                {isAnalyzing && <Spinner message="Analyzing..." />}
                {analysisResult && !isAnalyzing && (
                  <div className="ml-auto text-sm text-slate-600 flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-xs">
                      {analysisResult.wasteType ?? 'Detected'} • {Math.round(analysisResult.confidenceScore)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-3 items-start">
                <div className="w-44 h-28 bg-slate-50 dark:bg-slate-800 rounded overflow-hidden flex items-center justify-center border">
                  {previewUrl ? (
                    <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm text-slate-400 text-center px-2">
                      Drag & drop an image here or click Upload
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex gap-2 mb-2">
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={() => handleFileChange()} />
                    <Button type="button" variant="secondary" size="sm" onClick={() => { setImageFile(null); setPreviewUrl(null); setBase64Cache(null); }}>Clear</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={requestCurrentLocation}>Use my location</Button>
                    <div className="ml-auto text-xs text-slate-500">Est. reward: <span className="font-medium">{estimatedReward} pts</span></div>
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe where/how you found the waste (optional)"
                    className="w-full p-2 border rounded min-h-[80px]"
                  />

                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-sm text-slate-600">Detected type</label>
                    <select value={manualType} onChange={(e) => setManualType(e.target.value as any)} className="p-1 border rounded text-sm">
                      <option value="Auto">Auto</option>
                      {wasteTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="text-sm text-slate-500 ml-auto">
                      {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : locationStatus || 'No location'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="md" isLoading={isAnalyzing}>Preview & Submit</Button>
          <Button type="button" variant="secondary" onClick={clearForm}>Reset</Button>
        </div>
      </form>

      <div className="text-sm text-slate-500">
        Tips: Use a clear close-up photo, enable location for accurate mapping, and choose the correct waste type if the detector is wrong.
      </div>

      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); delete (window as any).__greenlens_confirm; }} title="Confirm submission">
        <div className="space-y-3">
          {previewUrl && <img src={previewUrl} alt="preview" className="w-full rounded" />}
          <div><strong>Type:</strong> {manualType !== 'Auto' ? manualType : (analysisResult?.wasteType ?? 'Unknown')}</div>
          <div><strong>Confidence:</strong> {analysisResult ? `${Math.round(analysisResult.confidenceScore)}%` : '—'}</div>
          <div><strong>Reward:</strong> {estimatedReward} pts</div>
          <div className="text-sm text-slate-600">{description || 'No description'}</div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setConfirmOpen(false); delete (window as any).__greenlens_confirm; }}>Cancel</Button>
            <Button onClick={confirmSubmit}>Confirm & Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
