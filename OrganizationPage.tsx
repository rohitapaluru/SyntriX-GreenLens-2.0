import React, { useEffect, useMemo, useState } from 'react';
import type { Report, User } from './types';
import { mockUsers } from './data/mockData';
import { analyzeWasteImage, fileToBase64 } from './services/geminiService';
import Button from './components/Button';
import Modal from './components/Modal';

type OrgReport = Report & {
  userName?: string;
  userEmail?: string;
};

export default function OrganizationPage() {
  // Aggregate reports from mock users
  const initialReports = useMemo(() => {
    const list: OrgReport[] = [];
    (mockUsers as User[]).forEach((u) => {
      (u.reports || []).forEach((r) => list.push({ ...r, userName: u.name, userEmail: u.email }));
    });
    // sort newest first
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const [reports, setReports] = useState<OrgReport[]>(initialReports);
  const [selected, setSelected] = useState<OrgReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ isWastePresent: boolean; confidenceScore: number; wasteType?: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [verifyLoadingId, setVerifyLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // keep analysis state cleared when selection changes
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setQrDataUrl(null);
  }, [selected]);

  // helper: convert image url or data url to base64 usable by analyzeWasteImage
  async function ensureBase64(imageUrl?: string) {
    if (!imageUrl) return undefined;
    if (imageUrl.startsWith('data:')) return imageUrl;
    // fetch and convert via blob -> data url
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();
      return await fileToBase64(new File([blob], 'remote.jpg', { type: blob.type || 'image/jpeg' }));
    } catch (e) {
      console.debug('failed to fetch image ->', e);
      return undefined;
    }
  }

  async function handleAnalyze(r: OrgReport) {
    setSelected(r);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const base64 = await ensureBase64(r.imageUrl);
      if (!base64) {
        setAnalysisResult({ isWastePresent: false, confidenceScore: 0 });
        return;
      }
      const mime = (r.imageUrl && r.imageUrl.startsWith('data:')) ? r.imageUrl.split(':')[1].split(';')[0] : 'image/jpeg';
      const res = await analyzeWasteImage(base64, mime);
      setAnalysisResult(res as any);
    } catch (e) {
      console.error(e);
      setAnalysisResult({ isWastePresent: false, confidenceScore: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateQrFor(r: OrgReport) {
    // QR payload could be a verification URL; for demo we just include report id
    const payload = JSON.stringify({ reportId: r.id, action: 'mark-cleaned' });

    try {
      // Use a public QR code image API to avoid adding a new dependency.
      // This returns an image URL we can put into the modal.
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(payload)}`;
      setQrDataUrl(url);
      setQrModalOpen(true);
      setSelected(r);
    } catch (e) {
      console.error('QR generation failed', e);
    }
  }

  function updateReportStatus(reportId: string, status: Report['status']) {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  }

  // Simulate scanning the QR: mark cleaned (Accepted)
  function simulateQrScan() {
    if (!selected) return;
    updateReportStatus(selected.id, 'Accepted');
    setQrModalOpen(false);
  }

  async function handleVerify(reportId: string, accept: boolean) {
    setVerifyLoadingId(reportId);
    // simulate server side verification delay
    await new Promise(r => setTimeout(r, 700));
    updateReportStatus(reportId, accept ? 'Accepted' : 'Rejected');
    setVerifyLoadingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Organization Dashboard</h2>
        <div className="text-sm text-muted">{reports.length} reports</div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr' }}>
        {reports.length === 0 && <div className="panel">No reports yet.</div>}

        {reports.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 140 }}>
              {r.imageUrl ? (
                <div className="preview">
                  <img src={r.imageUrl} alt="report" style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="panel text-muted">No image</div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div className="text-strong" style={{ fontSize: 16 }}>{r.description ?? 'Untitled report'}</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>{r.userName || r.userEmail} • {new Date(r.timestamp).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: 6 }} className={`badge-points`}>{r.status}</div>
                </div>
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button size="sm" onClick={() => handleAnalyze(r)} isLoading={isAnalyzing && selected?.id === r.id}>Analyze</Button>

                <Button size="sm" variant="secondary" onClick={() => generateQrFor(r)}>Generate QR</Button>

                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ id: r.id, url: `/report/${r.id}` })); }} >
                  Copy payload
                </Button>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <Button size="sm" variant="secondary" onClick={() => handleVerify(r.id, true)} isLoading={verifyLoadingId === r.id}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleVerify(r.id, false)} isLoading={verifyLoadingId === r.id}>Reject</Button>
                </div>
              </div>

              {selected?.id === r.id && analysisResult && (
                <div style={{ marginTop: 12 }} className="panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="text-strong">Analysis</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        Detected: {analysisResult.wasteType ?? '—'} • Confidence: {Math.round(analysisResult.confidenceScore)}%
                      </div>
                    </div>
                    <div>
                      {analysisResult.isWastePresent ? <div className="badge-points">Waste detected</div> : <div className="text-muted">No waste</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="Report QR">
        <div className="space-y-4">
          {qrDataUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img src={qrDataUrl} alt="qr" style={{ width: 220, height: 220, display: 'inline-block' }} />
              <div className="text-muted" style={{ marginTop: 8 }}>Scan to mark as cleaned (demo)</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <Button onClick={simulateQrScan}>Simulate scan</Button>
                <Button variant="secondary" onClick={() => setQrModalOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <div>Generating QR…</div>
          )}
        </div>
      </Modal>
    </div>
  );
}