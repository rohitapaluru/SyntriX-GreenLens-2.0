import React, { useState, useRef } from 'react';
import type { User, WasteType, Report } from '../types';
import { analyzeWasteImage, fileToBase64 } from '../services/geminiService';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

interface HomePageProps {
  user: User;
  onReportSubmitted: (report: Omit<Report, 'id' | 'userId' | 'timestamp' | 'status'>) => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onReportSubmitted }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ wasteType: WasteType; confidence: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
    }
  };
  
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(selectedFile);
      const result = await analyzeWasteImage(base64Image, selectedFile.type);

      if (result.isWastePresent && result.confidenceScore >= 50) { // Added confidence check
        setAnalysisResult({
          wasteType: result.wasteType,
          confidence: result.confidenceScore,
        });
      } else {
        setError("No significant waste was detected, or confidence is too low. Please try another image.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = () => {
    if (!analysisResult || !selectedFile || !previewUrl) return;
    
    onReportSubmitted({
        imageUrl: previewUrl,
        location: { lat: 34.0522, lng: -118.2437 }, // Mock location
        wasteType: analysisResult.wasteType,
        confidence: analysisResult.confidence,
        note: note,
    });

    setIsModalOpen(true); // Show success modal
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setIsLoading(false);
    setError(null);
    setNote('');
    setIsModalOpen(false);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in-up">
        <h1 className="text-3xl font-bold mb-2">Report Environmental Waste</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Upload a photo of waste to get it analyzed and reported.</p>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
            {!previewUrl ? (
                 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center">
                    <p className="mb-4 text-slate-500">Select an image to begin</p>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef}/>
                    <Button onClick={() => fileInputRef.current?.click()}>
                        Upload Image
                    </Button>
                 </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <img src={previewUrl} alt="Waste preview" className="rounded-xl w-full h-auto object-cover shadow-md" />
                         <Button variant="secondary" size="sm" onClick={handleReset} className="mt-4 w-full">
                           Choose a different image
                         </Button>
                    </div>

                    <div className="flex flex-col justify-center">
                        {isLoading && <Spinner message="Analyzing with Gemini..." />}
                        {error && <p className="text-rose-500 bg-rose-100 dark:bg-rose-900/50 p-3 rounded-lg">{error}</p>}
                        
                        {analysisResult && !isLoading && (
                            <div className="space-y-4 animate-fade-in">
                                <h2 className="text-2xl font-bold">Analysis Complete</h2>
                                <div className="bg-emerald-50 dark:bg-emerald-900/50 p-4 rounded-lg">
                                    <p className="text-lg">Detected Waste Type: <span className="font-bold text-emerald-600 dark:text-emerald-400">{analysisResult.wasteType}</span></p>
                                    <p className="text-lg">Confidence Score: <span className="font-bold text-emerald-600 dark:text-emerald-400">{analysisResult.confidence.toFixed(2)}%</span></p>
                                </div>
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add an optional note (e.g., 'near the river bank')"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                    rows={3}
                                />
                                <Button onClick={handleSubmitReport} size="lg" className="w-full">
                                    Submit Report
                                </Button>
                            </div>
                        )}

                        {!analysisResult && !isLoading && !error && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Ready to Analyze</h2>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">Click the button below to let our AI analyze the type of waste in your image.</p>
                                <Button onClick={handleAnalyze} size="lg" isLoading={isLoading} className="w-full">
                                    Analyze Waste
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <Modal isOpen={isModalOpen} onClose={handleReset} title="Report Submitted!">
            <div className="text-center">
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Thank you for helping keep our planet clean! You've been awarded 50 GreenUnits.
                </p>
                <Button onClick={handleReset}>
                    Submit Another Report
                </Button>
            </div>
        </Modal>
    </div>
  );
};

export default HomePage;
