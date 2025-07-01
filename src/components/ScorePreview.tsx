import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { 
  TrendingUp, 
  Award, 
  Target, 
  ChevronRight, 
  Info, 
  BarChart3,
  Sparkles,
  X,
  ArrowUp
} from 'lucide-react';
import { calculateReelPassScore, calculatePotentialScore, getScoreLevelInfo } from '../lib/scoreCalculation';

interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'certification';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  years_experience: number;
  verified: boolean;
  endorsements: number;
  video_demo_url?: string;
  ai_rating?: number;
  video_verified: boolean;
}

interface ScorePreviewProps {
  skills: Skill[];
  onAddSkill: () => void;
  onUploadVideo: () => void;
}

export const ScorePreview: React.FC<ScorePreviewProps> = ({ 
  skills, 
  onAddSkill, 
  onUploadVideo 
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const scoreDetails = calculateReelPassScore(skills);
  const potentialScore = calculatePotentialScore(skills);
  const levelInfo = getScoreLevelInfo(scoreDetails.currentScore);

  const ScoreDetailModal = () => (
    <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <Dialog.Title className="text-xl font-bold text-white">ReelPass Score Breakdown</Dialog.Title>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Score Overview */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{scoreDetails.currentScore}</div>
              <div className="text-lg text-slate-300 mb-1">{levelInfo.name}</div>
              <div className="text-sm text-slate-400">out of {scoreDetails.maxScore} points</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-3">
              <div 
                className="bg-primary-500 h-3 rounded-full transition-all duration-1000 relative"
                style={{ width: `${Math.min(100, (scoreDetails.currentScore / scoreDetails.maxScore) * 100)}%` }}
              >
                <div className="absolute -top-6 right-0 text-xs text-slate-400">
                  {Math.round((scoreDetails.currentScore / scoreDetails.maxScore) * 100)}%
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Score Components</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Base Skills ({skills.length} skills)</span>
                  <span className="text-white font-medium">{scoreDetails.breakdown.baseScore}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Proficiency Levels</span>
                  <span className="text-white font-medium">{scoreDetails.breakdown.proficiencyBonus}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Experience Years</span>
                  <span className="text-white font-medium">{scoreDetails.breakdown.experienceBonus}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Category Diversity</span>
                  <span className="text-white font-medium">{scoreDetails.breakdown.diversityBonus}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">Verification Status</span>
                  <span className="text-white font-medium">{scoreDetails.breakdown.verificationBonus}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-slate-300">AI Assessments</span>
                  <span className="text-white font-medium">{Math.round(scoreDetails.breakdown.aiRatingBonus)}</span>
                </div>
              </div>
            </div>

            {/* Potential Score */}
            {potentialScore > scoreDetails.currentScore && (
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={20} className="text-primary-400" />
                  <h3 className="font-semibold text-white">Potential Score</h3>
                </div>
                <p className="text-slate-300 text-sm mb-3">
                  With full verification and AI assessments, your score could reach:
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-400">{potentialScore}</span>
                  <ArrowUp size={16} className="text-success-400" />
                  <span className="text-success-400 text-sm">+{potentialScore - scoreDetails.currentScore} points</span>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
              <div className="space-y-2">
                {scoreDetails.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <Target size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
              <div className="space-y-2">
                {scoreDetails.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-400 text-xs font-medium">{index + 1}</span>
                    </div>
                    <span className="text-slate-300 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-3 p-6 border-t border-slate-700/50">
            <Button
              onClick={onAddSkill}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Add More Skills
            </Button>
            <Button
              onClick={() => {
                setShowDetailModal(false);
                onUploadVideo();
              }}
              variant="outline"
              className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
            >
              Upload ReelSkill Video
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <>
      <div className="bg-slate-800/20 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
              <TrendingUp size={20} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ReelPass Score Preview</h2>
              <p className="text-slate-400 text-sm">Your estimated professional score</p>
            </div>
          </div>
          <Button
            size="small"
            variant="outline"
            onClick={() => setShowDetailModal(true)}
            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
          >
            <BarChart3 size={14} className="mr-1" />
            Details
          </Button>
        </div>

        {skills.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ready to Get Scored?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Add your skills to see your estimated ReelPass score and discover opportunities for improvement.
            </p>
            <Button
              onClick={onAddSkill}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Add Your First Skill
            </Button>
          </div>
        ) : (
          /* Score Display */
          <div className="space-y-6">
            {/* Current Score */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">{scoreDetails.currentScore}</div>
              <div className={`text-lg font-medium mb-1 ${levelInfo.color}`}>{levelInfo.name}</div>
              <div className="text-sm text-slate-400">out of {scoreDetails.maxScore} points</div>
            </div>

            {/* Level Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Level Progress</span>
                <span className="text-sm text-slate-400">{levelInfo.progress}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    levelInfo.progress >= 80 ? 'bg-success-500' :
                    levelInfo.progress >= 60 ? 'bg-warning-500' :
                    'bg-primary-500'
                  }`}
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
              {levelInfo.nextLevel && (
                <div className="text-xs text-slate-400 mt-1">
                  Next: {levelInfo.nextLevel.name} at {levelInfo.nextLevel.min} points
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{skills.length}</div>
                <div className="text-xs text-slate-400">Skills Added</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-success-400">
                  {skills.filter(s => s.video_verified || s.verified).length}
                </div>
                <div className="text-xs text-slate-400">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary-400">
                  {new Set(skills.map(s => s.category)).size}
                </div>
                <div className="text-xs text-slate-400">Categories</div>
              </div>
            </div>

            {/* Potential Score Teaser */}
            {potentialScore > scoreDetails.currentScore && (
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">Potential Score</div>
                    <div className="text-xs text-slate-400">With full verification</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary-400">{potentialScore}</span>
                    <ArrowUp size={16} className="text-success-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Top Recommendation */}
            {scoreDetails.recommendations.length > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-warning-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={12} className="text-warning-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white mb-1">Quick Win</div>
                    <div className="text-sm text-slate-300">{scoreDetails.recommendations[0]}</div>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className="text-slate-400 cursor-pointer hover:text-white transition-colors" 
                    onClick={() => setShowDetailModal(true)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={onAddSkill}
                variant="outline"
                className="flex-1 border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
              >
                Add Skills
              </Button>
              <Button
                onClick={onUploadVideo}
                variant="outline"
                className="flex-1 border-success-500/30 text-success-400 hover:bg-success-500/10"
              >
                Upload Video
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ScoreDetailModal />
    </>
  );
}; 