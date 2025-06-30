import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { VideoUploadModal } from './VideoUploadModal';
import { X, Star, Award, Clock, TrendingUp, Video, FileText, Users, Calendar, Upload, Play, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'certification';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
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

interface SkillDetailModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (skillId: string, updates: Partial<Skill>) => Promise<void>;
  onDelete?: (skillId: string) => Promise<void>;
}

export const SkillDetailModal: React.FC<SkillDetailModalProps> = ({
  skill,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  // Update local state when skill changes
  useEffect(() => {
    if (skill) {
      setYearsExperience(skill.years_experience || 0);
      setDescription(skill.description || '');
      setVideoUrl(skill.video_demo_url || '');
    }
  }, [skill]);

  if (!skill) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(skill.id, {
        years_experience: yearsExperience,
        description: description.trim() || undefined,
        video_demo_url: videoUrl.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('Failed to update skill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setYearsExperience(skill.years_experience || 0);
    setDescription(skill.description || '');
    setVideoUrl(skill.video_demo_url || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(skill.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert('Failed to delete skill. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVideoAnalyzed = async (result: { rating: number; feedback: string; verified: boolean }) => {
    // Update the skill with AI analysis results
    await onUpdate(skill.id, {
      ai_rating: result.rating,
      ai_feedback: result.feedback,
      video_verified: result.verified,
      video_demo_url: videoUrl || skill.video_demo_url,
    });
  };

  const getProficiencyDescription = (proficiency: string) => {
    switch (proficiency) {
      case 'beginner': return 'Just starting out, basic understanding';
      case 'intermediate': return 'Some experience, can work with guidance';
      case 'advanced': return 'Solid expertise, can work independently';
      case 'expert': return 'Deep knowledge, can mentor others';
      case 'master': return 'Industry leader, recognized expertise';
      default: return '';
    }
  };

  const getAIRatingColor = (rating?: number) => {
    if (!rating) return 'text-slate-400';
    if (rating >= 4) return 'text-green-400';
    if (rating >= 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => (
    <Dialog open={showDeleteConfirm} onClose={() => !isDeleting && setShowDeleteConfirm(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" aria-hidden="true" />
      
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Skill</h3>
                <p className="text-slate-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong className="text-white">"{skill.name}"</strong>? 
              This will permanently remove the skill, including any ReelSkill videos and AI analysis data.
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 border-slate-600/50 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Delete Skill
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <>
      <Dialog open={isOpen} onClose={onClose}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
        
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div>
                <Dialog.Title className="text-2xl font-bold text-white">{skill.name}</Dialog.Title>
                <p className="text-slate-400 capitalize">{skill.category} skill</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setIsEditing(true)}
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                      disabled={isSaving}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        disabled={isSaving}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    )}
                  </>
                )}
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Proficiency Level */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">Proficiency Level</h3>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 font-medium capitalize">{skill.proficiency}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mb-3">{getProficiencyDescription(skill.proficiency)}</p>
                <div className="w-full bg-slate-600/50 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${
                        skill.proficiency === 'beginner' ? 20 :
                        skill.proficiency === 'intermediate' ? 40 :
                        skill.proficiency === 'advanced' ? 60 :
                        skill.proficiency === 'expert' ? 80 : 100
                      }%` 
                    }}
                  />
                </div>
              </div>

              {/* Experience & Verification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <Calendar size={24} className="text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-600/50 border border-slate-500/50 rounded text-center text-white"
                        disabled={isSaving}
                      />
                    ) : (
                      yearsExperience
                    )}
                  </div>
                  <div className="text-sm text-slate-400">Years Experience</div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <Users size={24} className="text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-300">{skill.endorsements}</div>
                  <div className="text-sm text-slate-400">Endorsements</div>
                </div>

                <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                  <Award size={24} className={skill.verified ? "text-emerald-400" : "text-slate-400"} />
                  <div className="text-sm font-medium text-white">
                    {skill.verified ? 'Verified' : 'Not Verified'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {skill.verified ? 'Skill verified' : 'Pending verification'}
                  </div>
                </div>
              </div>

              {/* AI Assessment */}
              {skill.ai_rating && (
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp size={20} className="text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">AI ReelSkill Assessment</h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < skill.ai_rating! ? getAIRatingColor(skill.ai_rating) : 'text-slate-600'}
                          fill={i < skill.ai_rating! ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className={`ml-2 font-medium ${getAIRatingColor(skill.ai_rating)}`}>
                        {skill.ai_rating}/5
                      </span>
                    </div>
                  </div>
                  {skill.ai_feedback && (
                    <p className="text-slate-300 text-sm">{skill.ai_feedback}</p>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={20} className="text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Description</h3>
                </div>
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your experience with this skill..."
                    className="w-full h-24 bg-slate-600/50 border border-slate-500/50 rounded-lg p-3 text-white placeholder-slate-400 resize-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="text-slate-300 text-sm">
                    {skill.description || 'No description provided yet.'}
                  </p>
                )}
              </div>

              {/* ReelSkill Video Demo */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Video size={20} className="text-red-400" />
                    <h3 className="text-lg font-semibold text-white">ReelSkill Demonstration</h3>
                    {skill.video_verified && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Award size={16} />
                        <span className="text-sm">AI Verified</span>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <Button
                      size="small"
                      onClick={() => setShowVideoUpload(true)}
                      className="bg-purple-600/80 hover:bg-purple-700/80"
                    >
                      <Upload size={14} className="mr-1" />
                      {skill.video_demo_url ? 'Update' : 'Add'} ReelSkill
                    </Button>
                  )}
                </div>
                
                {isEditing ? (
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-slate-600/50 border border-slate-500/50 rounded-lg p-3 text-white placeholder-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    disabled={isSaving}
                  />
                ) : skill.video_demo_url ? (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <a
                        href={skill.video_demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <Play size={16} />
                        Watch ReelSkill Demo
                      </a>
                    </div>
                    {skill.video_uploaded_at && (
                      <p className="text-slate-400 text-xs">
                        Uploaded: {new Date(skill.video_uploaded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    No ReelSkill demonstration yet. Add one to get AI verification and boost your profile!
                  </p>
                )}
              </div>

              {/* Learning Recommendations */}
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  {skill.proficiency === 'beginner' && (
                    <>
                      <p>• Complete foundational courses and tutorials</p>
                      <p>• Practice with small projects</p>
                      <p>• Create your first ReelSkill demonstration</p>
                    </>
                  )}
                  {skill.proficiency === 'intermediate' && (
                    <>
                      <p>• Work on more complex projects</p>
                      <p>• Seek peer endorsements</p>
                      <p>• Consider certification</p>
                      <p>• Upload advanced ReelSkill videos</p>
                    </>
                  )}
                  {skill.proficiency === 'advanced' && (
                    <>
                      <p>• Lead projects using this skill</p>
                      <p>• Mentor others</p>
                      <p>• Contribute to open source</p>
                      <p>• Create expert-level ReelSkills</p>
                    </>
                  )}
                  {(skill.proficiency === 'expert' || skill.proficiency === 'master') && (
                    <>
                      <p>• Share knowledge through content creation</p>
                      <p>• Speak at conferences</p>
                      <p>• Develop new methodologies</p>
                      <p>• Create master-class ReelSkills</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="border-slate-600/50 text-slate-300"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal />

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showVideoUpload}
        onClose={() => setShowVideoUpload(false)}
        skillId={skill.id}
        skillName={skill.name}
        onVideoAnalyzed={handleVideoAnalyzed}
      />
    </>
  );
};