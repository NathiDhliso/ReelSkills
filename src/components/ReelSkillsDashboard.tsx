import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/auth';
import { Button } from './ui/Button';
import { LoadingSpinner, LoadingOverlay } from './ui/LoadingSpinner';
import { useToast } from './ui/Toast';
import { getSupabaseClient } from '../lib/auth';
import { AddSkillModal } from './AddSkillModal';
import { VideoUploadModal } from './VideoUploadModal';
import { SkillDetailModal } from './SkillDetailModal';
import { ErrorHandler, withRetry } from '../lib/errorHandling';
import { Target, Plus, Brain, Star, Award, Video, CheckCircle, Upload, Play, Edit, AlertCircle, Sparkles, Trash2, RefreshCw } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'certification';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  status: 'planned' | 'in-progress' | 'completed' | 'verified';
  years_experience: number;
  verified: boolean;
  endorsements: number;
  video_demo_url?: string;
  description?: string;
  ai_rating?: number;
  ai_feedback?: string;
  video_verified: boolean;
  video_uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
}

const ReelSkillsDashboard: React.FC = () => {
  const { user, profile, createProfile } = useAuthStore();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showSkillDetail, setShowSkillDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const supabase = getSupabaseClient();

  const handleCreateProfile = async () => {
    if (!user?.email) {
      showError('Authentication Error', 'User email not found');
      return;
    }
    
    setCreatingProfile(true);
    setError(null);
    
    try {
      const newProfile = await withRetry(
        () => createProfile(
          user.id,
          user.email!,
          user.user_metadata?.first_name,
          user.user_metadata?.last_name
        ),
        3,
        (attempt) => showWarning('Retrying...', `Attempt ${attempt} of 3`)
      );
      
      if (!newProfile) {
        throw new Error('Profile creation returned null');
      }

      showSuccess('Profile Created', 'Welcome to ReelSkills!');
    } catch (error) {
      console.error('Error creating profile:', error);
      const appError = ErrorHandler.handleGenericError(error as Error);
      setError(appError.userMessage);
      showError('Profile Creation Failed', appError.userMessage);
    } finally {
      setCreatingProfile(false);
    }
  };

  const fetchSkills = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await withRetry(
        () => supabase
          .from('skills')
          .select('*')
          .eq('profile_id', profile.id)
          .order('created_at', { ascending: false }),
        3,
        (attempt) => {
          setRetryCount(attempt);
          showWarning('Retrying...', `Loading skills (attempt ${attempt})`);
        }
      );

      if (supabaseError) {
        // Properly categorize the error type
        let appError;
        
        // Check if it's a network error
        if (supabaseError.message && supabaseError.message.includes('Failed to fetch')) {
          appError = ErrorHandler.handleNetworkError(supabaseError);
        }
        // Check if it's a Supabase database error (has code property)
        else if ('code' in supabaseError && supabaseError.code) {
          appError = ErrorHandler.handleSupabaseError(supabaseError);
        }
        // Handle any other unexpected error types
        else {
          appError = ErrorHandler.handleGenericError(supabaseError);
        }
        
        throw new Error(appError.userMessage);
      }

      const formattedSkills = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        proficiency: row.proficiency,
        status: row.verified ? 'verified' : 'planned',
        years_experience: row.years_experience || 0,
        verified: row.verified || false,
        endorsements: row.endorsements || 0,
        video_demo_url: row.video_demo_url,
        description: row.description,
        ai_rating: row.ai_rating,
        ai_feedback: row.ai_feedback,
        video_verified: row.video_verified || false,
        video_uploaded_at: row.video_uploaded_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
      setSkills(formattedSkills);
      setRetryCount(0);
      
      // Set the first skill as current if none selected
      if (formattedSkills.length > 0 && !currentSkill) {
        setCurrentSkill(formattedSkills[0]);
      }

    } catch (error) {
      console.error('Error fetching skills:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load skills';
      setError(errorMessage);
      showError('Loading Failed', errorMessage);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkill = async (skillId: string, updates: Partial<Skill>) => {
    try {
      const { data, error: supabaseError } = await withRetry(
        () => supabase
          .from('skills')
          .update({
            years_experience: updates.years_experience,
            description: updates.description,
            video_demo_url: updates.video_demo_url,
          })
          .eq('id', skillId)
          .select()
          .single(),
        2
      );

      if (supabaseError) {
        // Properly categorize the error type
        let appError;
        
        if (supabaseError.message && supabaseError.message.includes('Failed to fetch')) {
          appError = ErrorHandler.handleNetworkError(supabaseError);
        }
        else if ('code' in supabaseError && supabaseError.code) {
          appError = ErrorHandler.handleSupabaseError(supabaseError);
        }
        else {
          appError = ErrorHandler.handleGenericError(supabaseError);
        }
        
        throw new Error(appError.userMessage);
      }

      if (data) {
        const updatedSkill = { ...currentSkill, ...updates, updated_at: data.updated_at };
        setCurrentSkill(updatedSkill);
        setSkills(prev => prev.map(skill => 
          skill.id === skillId ? updatedSkill : skill
        ));
        showSuccess('Skill Updated', 'Your changes have been saved');
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update skill';
      showError('Update Failed', errorMessage);
      throw error;
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    const skillToDelete = skills.find(s => s.id === skillId);
    if (!skillToDelete) return;

    try {
      const { error: supabaseError } = await withRetry(
        () => supabase
          .from('skills')
          .delete()
          .eq('id', skillId),
        2
      );

      if (supabaseError) {
        // Properly categorize the error type
        let appError;
        
        if (supabaseError.message && supabaseError.message.includes('Failed to fetch')) {
          appError = ErrorHandler.handleNetworkError(supabaseError);
        }
        else if ('code' in supabaseError && supabaseError.code) {
          appError = ErrorHandler.handleSupabaseError(supabaseError);
        }
        else {
          appError = ErrorHandler.handleGenericError(supabaseError);
        }
        
        throw new Error(appError.userMessage);
      }

      // Remove from local state
      setSkills(prev => prev.filter(skill => skill.id !== skillId));
      
      // If this was the current skill, select another one or clear
      if (currentSkill?.id === skillId) {
        const remainingSkills = skills.filter(skill => skill.id !== skillId);
        setCurrentSkill(remainingSkills.length > 0 ? remainingSkills[0] : null);
      }

      showSuccess('Skill Deleted', `"${skillToDelete.name}" has been removed`);
    } catch (error) {
      console.error('Error deleting skill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete skill';
      showError('Delete Failed', errorMessage);
      throw error;
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [profile?.id]);

  const handleSave = async ({ name, category, proficiency }: Omit<Skill, 'id' | 'status' | 'years_experience' | 'verified' | 'endorsements' | 'video_verified'>) => {
    if (!profile?.id) {
      showError('Authentication Error', 'Profile not found. Please refresh the page.');
      return;
    }

    // Validation
    if (!name.trim()) {
      showError('Validation Error', 'Skill name is required');
      throw new Error('Skill name is required');
    }

    if (name.trim().length < 2) {
      showError('Validation Error', 'Skill name must be at least 2 characters');
      throw new Error('Skill name must be at least 2 characters');
    }

    // Check for duplicates
    const existingSkill = skills.find(skill => 
      skill.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingSkill) {
      showError('Duplicate Skill', 'You already have this skill in your portfolio');
      throw new Error('Skill already exists');
    }

    try {
      const { data, error: supabaseError } = await withRetry(
        () => supabase
          .from('skills')
          .insert({
            profile_id: profile.id,
            name: name.trim(),
            category,
            proficiency,
            years_experience: 0,
            description: null,
            verified: false,
          })
          .select()
          .single(),
        2
      );

      if (supabaseError) {
        // Properly categorize the error type
        let appError;
        
        if (supabaseError.message && supabaseError.message.includes('Failed to fetch')) {
          appError = ErrorHandler.handleNetworkError(supabaseError);
        }
        else if ('code' in supabaseError && supabaseError.code) {
          appError = ErrorHandler.handleSupabaseError(supabaseError);
        }
        else {
          appError = ErrorHandler.handleGenericError(supabaseError);
        }
        
        throw new Error(appError.userMessage);
      }

      if (data) {
        const newSkill: Skill = {
          id: data.id,
          name: data.name,
          category: data.category,
          proficiency: data.proficiency,
          status: 'planned',
          years_experience: data.years_experience || 0,
          verified: data.verified || false,
          endorsements: data.endorsements || 0,
          video_demo_url: data.video_demo_url,
          description: data.description,
          ai_rating: data.ai_rating,
          ai_feedback: data.ai_feedback,
          video_verified: data.video_verified || false,
          video_uploaded_at: data.video_uploaded_at,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setSkills(prev => [newSkill, ...prev]);
        setCurrentSkill(newSkill);
        showSuccess('Skill Added', `"${name}" has been added to your portfolio`);
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save skill';
      showError('Save Failed', errorMessage);
      throw error;
    }
  };

  const handleVideoAnalyzed = async (result: { 
    rating: number | null; 
    feedback: string | null; 
    verified: boolean; 
    message?: string;
    strengths?: string[];
    improvements?: string[];
    confidence?: number;
  }) => {
    if (!currentSkill) return;
    
    try {
      const updateData: any = {
        video_uploaded_at: new Date().toISOString(),
      };

      // Only update AI fields if they have actual values (not null)
      if (result.rating !== null) {
        updateData.ai_rating = result.rating;
      }
      if (result.feedback !== null) {
        updateData.ai_feedback = result.feedback;
      }
      if (result.verified !== null) {
        updateData.video_verified = result.verified;
      }

      const { data, error: supabaseError } = await withRetry(
        () => supabase
          .from('skills')
          .update(updateData)
          .eq('id', currentSkill.id)
          .select()
          .single(),
        2
      );

      if (supabaseError) {
        // Properly categorize the error type
        let appError;
        
        if (supabaseError.message && supabaseError.message.includes('Failed to fetch')) {
          appError = ErrorHandler.handleNetworkError(supabaseError);
        }
        else if ('code' in supabaseError && supabaseError.code) {
          appError = ErrorHandler.handleSupabaseError(supabaseError);
        }
        else {
          appError = ErrorHandler.handleGenericError(supabaseError);
        }
        
        throw new Error(appError.userMessage);
      }

      if (data) {
        const updatedSkill = { ...currentSkill, ...data };
        setCurrentSkill(updatedSkill);
        setSkills(prev => prev.map(skill => 
          skill.id === currentSkill.id ? updatedSkill : skill
        ));

        if (result.verified) {
          showSuccess('ReelSkill Verified!', `Your ${currentSkill.name} demonstration has been AI-verified`);
        } else {
          showInfo('Analysis Complete', 'Your ReelSkill has been analyzed');
        }
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      showError('Update Failed', 'Failed to save analysis results');
    }
  };

  const handleHeroUploadClick = () => {
    if (skills.length === 0) {
      // If no skills, open add skill modal first
      setIsModalOpen(true);
    } else if (currentSkill) {
      // If there's a current skill, open video upload
      setShowVideoUpload(true);
    } else {
      // Set first skill as current and open video upload
      setCurrentSkill(skills[0]);
      setShowVideoUpload(true);
    }
  };

  // Retry button component
  const RetryButton = () => (
    <Button
      onClick={fetchSkills}
      variant="outline"
      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
      disabled={loading}
    >
      <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Retrying...' : 'Retry'}
    </Button>
  );

  // If user exists but no profile, show profile creation
  if (user && !profile && !creatingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <div className="text-center max-w-sm mx-auto">
          <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6">
            <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Profile Setup Required</h2>
            <p className="text-slate-400 mb-6 text-sm">
              We need to set up your profile to get started with ReelSkills.
            </p>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <Button 
              onClick={handleCreateProfile}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              disabled={creatingProfile}
            >
              {creatingProfile ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Creating Profile...</span>
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while creating profile
  if (creatingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
        backgroundAttachment: 'fixed'
      }}>
        <LoadingSpinner size="large" message="Setting up your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'radial-gradient(ellipse at center, #1E293B 0%, #0F172A 100%)',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent mb-2">
            ReelSkills
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Showcase your expertise with video demonstrations
          </p>
        </div>

        {/* MERGED HERO SECTION - Upload Button + Current Skill Display */}
        <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6 mb-8">
          {/* Hero Upload Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleHeroUploadClick}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xl px-12 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Brain size={28} className="mr-4" />
              Upload & Analyze with AI
            </Button>
            <p className="text-slate-400 text-sm mt-3">
              {skills.length === 0 
                ? 'Add your first skill and create a ReelSkill demonstration'
                : currentSkill 
                  ? `Upload a video to get AI-powered analysis for ${currentSkill.name}`
                  : 'Upload a video to get AI-powered skill analysis'
              }
            </p>
          </div>

          {/* Current Skill Display - Only show if there's a current skill */}
          {currentSkill && (
            <>
              {/* Current Skill Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentSkill.name}</h2>
                <div className="flex flex-wrap items-center justify-center gap-2 text-slate-400 text-sm">
                  <span className="capitalize">{currentSkill.category}</span>
                  <span>•</span>
                  <span className="capitalize">{currentSkill.proficiency}</span>
                  <span>•</span>
                  <span>{currentSkill.years_experience} years</span>
                </div>
                
                {/* AI Rating - only show if exists */}
                {currentSkill.ai_rating && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-slate-400 text-sm">AI Rating:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < currentSkill.ai_rating! ? 'text-yellow-400' : 'text-slate-600'}
                          fill={i < currentSkill.ai_rating! ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className="text-yellow-400 ml-1 text-sm">{currentSkill.ai_rating}/5</span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Feedback - only show if exists */}
              {currentSkill.ai_feedback && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain size={18} className="text-purple-400" />
                    <h3 className="font-semibold text-white text-sm">AI Feedback</h3>
                  </div>
                  <p className="text-slate-300 text-sm">{currentSkill.ai_feedback}</p>
                </div>
              )}

              {/* Quick Actions - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSkillDetail(true)}
                  className="border-slate-600/50 text-slate-300"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Details
                </Button>
                {currentSkill.video_demo_url && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowVideoUpload(true)}
                      className="border-purple-500/30 text-purple-300"
                    >
                      <Brain size={16} className="mr-2" />
                      Re-analyze with AI
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(currentSkill.video_demo_url, '_blank')}
                      className="border-blue-500/30 text-blue-300"
                    >
                      <Play size={16} className="mr-2" />
                      View ReelSkill
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Error Display with Retry */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-red-300 font-medium text-sm">Something went wrong</p>
                  <p className="text-red-300 text-sm break-words">{error}</p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <RetryButton />
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="large" message="Loading your skills..." />
            {retryCount > 0 && (
              <p className="text-slate-400 text-sm mt-2">
                Retry attempt {retryCount}
              </p>
            )}
          </div>
        ) : skills.length === 0 ? (
          /* No Skills State - Mobile Optimized */
          <div className="text-center py-12">
            <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-8 max-w-sm mx-auto">
              <Target size={48} className="text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-4">Start Your Journey</h3>
              <p className="text-slate-400 mb-8 text-sm">
                Add your first skill and create ReelSkills to showcase your expertise with AI-powered video analysis.
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-base px-6 py-3"
              >
                <Plus size={18} className="mr-2" />
                Add Your First Skill
              </Button>
            </div>
          </div>
        ) : (
          /* Skills Grid - Mobile Optimized */
          <LoadingOverlay isLoading={loading && skills.length > 0} message="Refreshing skills...">
            <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Your Skills</h2>
                <Button 
                  size="small"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600/80 hover:bg-blue-700/80 text-sm px-3 py-2"
                >
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`relative group p-4 rounded-xl border transition-all ${
                      currentSkill?.id === skill.id
                        ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                        : 'border-slate-600/30 bg-slate-800/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700/40'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentSkill(skill)}
                      className="w-full text-left"
                    >
                      <div className="font-medium mb-1 text-sm sm:text-base">{skill.name}</div>
                      <div className="text-xs opacity-75 capitalize mb-2">{skill.proficiency}</div>
                      <div className="flex flex-wrap gap-2">
                        {skill.video_verified && (
                          <div className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-green-400" />
                            <span className="text-xs text-green-400">AI Verified</span>
                          </div>
                        )}
                        {skill.video_demo_url && !skill.video_verified && (
                          <div className="flex items-center gap-1">
                            <Video size={12} className="text-blue-400" />
                            <span className="text-xs text-blue-400">ReelSkill</span>
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {/* Quick Actions Menu - Mobile Optimized */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentSkill(skill);
                            setShowSkillDetail(true);
                          }}
                          className="p-1.5 bg-slate-700/80 hover:bg-blue-600/80 rounded-lg transition-colors"
                          title="Edit skill"
                        >
                          <Edit size={12} className="text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${skill.name}"?`)) {
                              handleDeleteSkill(skill.id);
                            }
                          }}
                          className="p-1.5 bg-slate-700/80 hover:bg-red-600/80 rounded-lg transition-colors"
                          title="Delete skill"
                        >
                          <Trash2 size={12} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </LoadingOverlay>
        )}

        {/* Add Skill Modal */}
        <AddSkillModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />

        {/* Video Upload Modal */}
        {currentSkill && (
          <VideoUploadModal
            isOpen={showVideoUpload}
            onClose={() => setShowVideoUpload(false)}
            skillId={currentSkill.id}
            skillName={currentSkill.name}
            onVideoAnalyzed={handleVideoAnalyzed}
          />
        )}

        {/* Skill Detail Modal */}
        {currentSkill && (
          <SkillDetailModal
            skill={currentSkill}
            isOpen={showSkillDetail}
            onClose={() => setShowSkillDetail(false)}
            onUpdate={handleUpdateSkill}
            onDelete={handleDeleteSkill}
          />
        )}
      </div>
    </div>
  );
};

export default ReelSkillsDashboard;