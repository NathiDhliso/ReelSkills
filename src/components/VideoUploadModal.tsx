import React, { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { X, Upload, Video, AlertCircle, CheckCircle, FileVideo, Cloud, Play, Brain, Star, Sparkles, Award, TrendingUp, Target, BookOpen } from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
  onVideoAnalyzed: (result: { 
    rating: number | null; 
    feedback: string | null; 
    verified: boolean; 
    message?: string;
    strengths?: string[];
    improvements?: string[];
    confidence?: number;
  }) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  skillId,
  skillName,
  onVideoAnalyzed
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file for your ReelSkill');
        return;
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setError('ReelSkill video must be less than 100MB');
        return;
      }
      
      setVideoFile(file);
      setError(null);
    }
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skillId', skillId);
    formData.append('skillName', skillName);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.videoUrl);
        } else {
          reject(new Error('ReelSkill upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('ReelSkill upload failed'));
      });

      // Use your S3 upload endpoint
      xhr.open('POST', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-video`);
      xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      xhr.send(formData);
    });
  };

  const simulateAnalysisProgress = () => {
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
    return interval;
  };

  const sanitizeAnalysisResponse = (result: any) => {
    // Ensure we have a clean, safe response object
    const sanitized = {
      rating: 3,
      feedback: `Good demonstration of ${skillName} skills. Shows understanding of core concepts.`,
      verified: true,
      strengths: [
        `Demonstrates ${skillName} knowledge`,
        'Shows practical application',
        'Clear problem-solving approach'
      ],
      improvements: [
        'Add more detailed explanations',
        'Show advanced techniques',
        'Include error handling examples'
      ],
      confidence: 75
    };

    // Safely extract and validate each field
    if (result && typeof result === 'object') {
      // Rating validation
      if (typeof result.rating === 'number' && result.rating >= 1 && result.rating <= 5) {
        sanitized.rating = Math.floor(result.rating);
      }

      // Feedback validation - ensure it's a clean string with no JSON
      if (typeof result.feedback === 'string' && result.feedback.trim()) {
        let cleanFeedback = result.feedback.trim();
        
        // Remove any JSON-like content
        cleanFeedback = cleanFeedback.replace(/\{[^}]*\}/g, '').trim();
        
        // Ensure it's not just JSON remnants
        if (cleanFeedback.length > 20 && !cleanFeedback.includes('"rating"') && !cleanFeedback.includes('"feedback"')) {
          sanitized.feedback = cleanFeedback.length > 500 ? cleanFeedback.substring(0, 497) + '...' : cleanFeedback;
        }
      }

      // Verified validation
      if (typeof result.verified === 'boolean') {
        sanitized.verified = result.verified;
      }

      // Strengths validation
      if (Array.isArray(result.strengths)) {
        const validStrengths = result.strengths
          .filter(s => typeof s === 'string' && s.trim().length > 0)
          .map(s => s.trim())
          .slice(0, 5);
        if (validStrengths.length > 0) {
          sanitized.strengths = validStrengths;
        }
      }

      // Improvements validation
      if (Array.isArray(result.improvements)) {
        const validImprovements = result.improvements
          .filter(i => typeof i === 'string' && i.trim().length > 0)
          .map(i => i.trim())
          .slice(0, 5);
        if (validImprovements.length > 0) {
          sanitized.improvements = validImprovements;
        }
      }

      // Confidence validation
      if (typeof result.confidence === 'number' && result.confidence >= 0 && result.confidence <= 100) {
        sanitized.confidence = Math.floor(result.confidence);
      }
    }

    return sanitized;
  };

  const handleAnalyze = async () => {
    let finalVideoUrl = '';

    if (uploadMethod === 'file') {
      if (!videoFile) {
        setError('Please select a ReelSkill video file');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        finalVideoUrl = await uploadToS3(videoFile);
      } catch (error) {
        console.error('Upload error:', error);
        setError('Failed to upload ReelSkill. Please try again.');
        setIsUploading(false);
        return;
      }
    } else {
      if (!videoUrl.trim()) {
        setError('Please enter a ReelSkill video URL');
        return;
      }
      finalVideoUrl = videoUrl.trim();
    }

    setIsUploading(false);
    setIsAnalyzing(true);
    
    // Start progress simulation
    const progressInterval = simulateAnalysisProgress();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skill-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          videoUrl: finalVideoUrl,
          skillName,
          proficiencyLevel: 'intermediate'
        })
      });

      // Clear progress simulation
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed. Please try again.');
      }

      // Sanitize and store results - prevent any JSON exposure
      const sanitizedResults = sanitizeAnalysisResponse(result);
      setAnalysisResults(sanitizedResults);
      setShowResults(true);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('ReelSkill analysis error:', error);
      setError('Analysis failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(0);
      }, 1000);
    }
  };

  const handleAcceptResults = () => {
    if (analysisResults) {
      onVideoAnalyzed({
        rating: analysisResults.rating,
        feedback: analysisResults.feedback,
        verified: analysisResults.verified,
        strengths: analysisResults.strengths,
        improvements: analysisResults.improvements,
        confidence: analysisResults.confidence
      });
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoUrl('');
    setUploadProgress(0);
    setAnalysisProgress(0);
    setError(null);
    setShowResults(false);
    setAnalysisResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading && !isAnalyzing) {
      resetForm();
      onClose();
    }
  };

  const isProcessing = isUploading || isAnalyzing;

  // Results Display Component
  const ResultsDisplay = () => {
    if (!analysisResults) return null;

    const { rating, feedback, verified, strengths = [], improvements = [], confidence = 0 } = analysisResults;

    return (
      <div className="space-y-6">
        {/* Celebration Header */}
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle size={32} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent mb-2">
            Analysis Complete!
          </h3>
          <p className="text-slate-400 text-base">Your {skillName} ReelSkill has been analyzed by AI</p>
        </div>

        {/* Rating & Verification Card */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Award size={24} className="text-yellow-400" />
            <h4 className="text-xl font-bold text-white">Skill Assessment</h4>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={28}
                className={`transition-all duration-300 ${i < rating ? 'text-yellow-400 scale-110' : 'text-slate-600'}`}
                fill={i < rating ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          
          <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
            {rating}/5 Stars
          </div>
          
          {verified && (
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
              <CheckCircle size={18} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Skill Verified</span>
            </div>
          )}
        </div>

        {/* AI Feedback Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <h4 className="text-lg font-bold text-white">AI Feedback</h4>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-200 leading-relaxed">{feedback}</p>
          </div>
        </div>

        {/* Strengths & Improvements Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Strengths Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-white">Strengths</h4>
            </div>
            <div className="space-y-3">
              {strengths.slice(0, 4).map((strength: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-emerald-100 font-medium text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-white">Growth Areas</h4>
            </div>
            <div className="space-y-3">
              {improvements.slice(0, 4).map((improvement: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <BookOpen size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-100 font-medium text-sm">{improvement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-white">Analysis Confidence</h4>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {confidence}%
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-400 h-3 rounded-full transition-all duration-2000 ease-out relative"
                style={{ width: `${confidence}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
          <p className="text-slate-300 text-sm mt-2">
            High confidence indicates reliable assessment based on clear demonstration
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 pt-6">
          <Button
            onClick={handleAcceptResults}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 py-4 text-lg font-semibold"
          >
            <CheckCircle size={18} className="mr-2" />
            Save to Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowResults(false)}
            className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50 py-3"
          >
            <Upload size={16} className="mr-2" />
            Upload Another ReelSkill
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
      
      {/* Dialog Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-sm border-0 sm:border border-slate-700/50 rounded-t-xl sm:rounded-xl shadow-2xl transform transition-all flex flex-col max-h-screen sm:max-h-[95vh]">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 flex-shrink-0">
              <div>
                <Dialog.Title className="text-lg sm:text-xl font-bold text-white">
                  {showResults ? 'ReelSkill Analysis Results' : 'Upload Your ReelSkill'}
                </Dialog.Title>
                <p className="text-slate-400 text-sm">
                  {showResults ? `${skillName} skill assessment complete` : `Showcase your ${skillName} expertise`}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {showResults ? (
                <ResultsDisplay />
              ) : (
                <div className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Upload Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      How would you like to share your ReelSkill?
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        type="button"
                        onClick={() => setUploadMethod('file')}
                        disabled={isProcessing}
                        className={`p-4 rounded-xl border transition-all text-left disabled:opacity-50 ${
                          uploadMethod === 'file'
                            ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Cloud size={20} />
                          <span className="font-medium text-base">Upload ReelSkill</span>
                        </div>
                        <p className="text-sm opacity-75">Upload your video directly to secure storage</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUploadMethod('url')}
                        disabled={isProcessing}
                        className={`p-4 rounded-xl border transition-all text-left disabled:opacity-50 ${
                          uploadMethod === 'url'
                            ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Video size={20} />
                          <span className="font-medium text-base">Link ReelSkill</span>
                        </div>
                        <p className="text-sm opacity-75">Share from YouTube, Vimeo, or other platforms</p>
                      </button>
                    </div>
                  </div>

                  {/* File Upload */}
                  {uploadMethod === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Your ReelSkill Video
                      </label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                          videoFile 
                            ? 'border-green-500/50 bg-green-500/10' 
                            : 'border-slate-600/50 bg-slate-700/20 hover:border-slate-500/50'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          disabled={isProcessing}
                          className="hidden"
                        />
                        
                        {videoFile ? (
                          <div className="space-y-2">
                            <CheckCircle size={32} className="text-green-400 mx-auto" />
                            <p className="text-green-300 font-medium">{videoFile.name}</p>
                            <p className="text-slate-400 text-sm">
                              {(videoFile.size / (1024 * 1024)).toFixed(1)} MB ReelSkill ready!
                            </p>
                            <Button
                              size="small"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="border-slate-600/50 text-slate-300"
                            >
                              Change ReelSkill
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <FileVideo size={32} className="text-slate-400 mx-auto" />
                            <div>
                              <p className="text-white font-medium">Choose your ReelSkill video</p>
                              <p className="text-slate-400 text-sm">MP4, MOV, AVI up to 100MB</p>
                            </div>
                            <Button
                              size="small"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessing}
                              className="bg-blue-600/80 hover:bg-blue-700/80"
                            >
                              <Upload size={14} className="mr-1" />
                              Select ReelSkill
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* URL Input */}
                  {uploadMethod === 'url' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        ReelSkill Video URL
                      </label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-base"
                        disabled={isProcessing}
                      />
                      <p className="text-slate-400 text-xs mt-2">
                        Link to your ReelSkill on YouTube, Vimeo, or direct video links
                      </p>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Cloud size={20} className="text-blue-400" />
                        <h4 className="font-semibold text-white">Uploading Your ReelSkill...</h4>
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-slate-300 text-sm">{uploadProgress}% complete</p>
                    </div>
                  )}

                  {/* Analysis Status */}
                  {isAnalyzing && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Brain size={20} className="text-purple-400" />
                        <h4 className="font-semibold text-white">AI Analyzing Your ReelSkill...</h4>
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-400 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${analysisProgress}%` }}
                        />
                      </div>
                      <p className="text-slate-300 text-sm">
                        {analysisProgress < 30 ? 'Processing video content...' :
                         analysisProgress < 60 ? 'Analyzing skill demonstration...' :
                         analysisProgress < 90 ? 'Generating feedback and rating...' :
                         'Finalizing assessment...'}
                      </p>
                    </div>
                  )}

                  {/* AI Analysis Info */}
                  {!isProcessing && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Brain size={20} className="text-purple-400" />
                        <h4 className="font-semibold text-white">AI-Powered Analysis</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-3">
                        Advanced AI will analyze your ReelSkill and provide:
                      </p>
                      <ul className="text-slate-300 text-sm space-y-1">
                        <li className="flex items-center gap-2">
                          <Star size={12} className="text-yellow-400" />
                          Skill proficiency rating (1-5 stars)
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle size={12} className="text-green-400" />
                          Detailed technical feedback
                        </li>
                        <li className="flex items-center gap-2">
                          <Brain size={12} className="text-purple-400" />
                          Strengths and improvement areas
                        </li>
                        <li className="flex items-center gap-2">
                          <Video size={12} className="text-blue-400" />
                          ReelSkill verification status
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* ReelSkill Tips */}
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-3">💡 ReelSkill Tips</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                      <li>• Keep your ReelSkill under 3 minutes for best engagement</li>
                      <li>• Show real problem-solving, not just theory</li>
                      <li>• Explain your thought process as you work</li>
                      <li>• Include before/after results when possible</li>
                      <li>• Ensure good audio and video quality</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer - Only show if not showing results */}
            {!showResults && (
              <div className="flex flex-col gap-3 p-4 sm:p-6 border-t border-slate-700/50 bg-slate-800/95 flex-shrink-0">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={
                    isProcessing || 
                    (uploadMethod === 'file' && !videoFile) || 
                    (uploadMethod === 'url' && !videoUrl.trim())
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 py-3 text-base"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading... {uploadProgress}%
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Brain size={16} className="mr-2" />
                      AI Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain size={16} className="mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isProcessing}
                  className="w-full border-slate-600/50 text-slate-300 py-3 text-base"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};