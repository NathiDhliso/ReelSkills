import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useToast } from './ui/Toast';
import { Plus, X, Code, Users, Globe, AlignCenterVertical as Certificate, AlertTriangle } from 'lucide-react';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: {
    name: string;
    category: 'technical' | 'soft' | 'language' | 'certification';
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  }) => Promise<void>;
}

const categories = [
  { value: 'technical', label: 'Technical', icon: Code, description: 'Programming, tools, frameworks' },
  { value: 'soft', label: 'Soft Skills', icon: Users, description: 'Leadership, communication, teamwork' },
  { value: 'language', label: 'Languages', icon: Globe, description: 'Spoken and written languages' },
  { value: 'certification', label: 'Certifications', icon: Certificate, description: 'Professional certifications' }
] as const;

const proficiencies = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'advanced', label: 'Advanced', description: 'Solid expertise' },
  { value: 'expert', label: 'Expert', description: 'Deep knowledge' },
  { value: 'master', label: 'Master', description: 'Industry leader' }
] as const;

export const AddSkillModal: React.FC<AddSkillModalProps> = ({ isOpen, onClose, onSave }) => {
  const { showError } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'technical' | 'soft' | 'language' | 'certification'>('technical');
  const [proficiency, setProficiency] = useState<typeof proficiencies[number]['value']>('beginner');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Skill name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Skill name must be at least 2 characters';
    } else if (name.trim().length > 50) {
      errors.name = 'Skill name must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-\+\#\.]+$/.test(name.trim())) {
      errors.name = 'Skill name contains invalid characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await onSave({ 
        name: name.trim(), 
        category, 
        proficiency 
      });
      
      // Reset form on successful save
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving skill:', error);
      // Error handling is done in the parent component via toast
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('technical');
    setProficiency('beginner');
    setValidationErrors({});
  };

  const handleClose = () => {
    if (!isSaving) {
      resetForm();
      onClose();
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Clear validation error when user starts typing
    if (validationErrors.name) {
      setValidationErrors(prev => ({ ...prev, name: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" aria-hidden="true" />
      
      {/* Dialog Container - Full screen on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Panel className="w-full max-w-lg bg-slate-800/95 backdrop-blur-sm border-0 sm:border border-slate-700/50 rounded-t-xl sm:rounded-xl shadow-2xl transform transition-all">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50">
              <Dialog.Title className="text-lg sm:text-xl font-bold text-white">Add New Skill</Dialog.Title>
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Scrollable Content */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] sm:max-h-none">
                {/* Skill Name */}
                <div>
                  <label htmlFor="skill-name" className="block text-sm font-medium text-slate-300 mb-2">
                    Skill Name *
                  </label>
                  <input
                    id="skill-name"
                    type="text"
                    className={`w-full px-3 sm:px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all text-base ${
                      validationErrors.name 
                        ? 'border-red-500/50 focus:border-red-500/50' 
                        : 'border-slate-600/50 focus:border-blue-500/50'
                    }`}
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., React, Python, Leadership, Spanish"
                    autoFocus
                    disabled={isSaving}
                    required
                    maxLength={50}
                  />
                  {validationErrors.name && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle size={14} className="text-red-400" />
                      <p className="text-red-300 text-xs">{validationErrors.name}</p>
                    </div>
                  )}
                  <p className="text-slate-400 text-xs mt-1">
                    {name.length}/50 characters
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Category *
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          disabled={isSaving}
                          className={`p-4 rounded-xl border transition-all text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            category === cat.value
                              ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                              : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700/50'
                          }`}
                          aria-pressed={category === cat.value}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Icon size={20} />
                            <span className="font-medium text-base">{cat.label}</span>
                          </div>
                          <p className="text-sm opacity-75">{cat.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Proficiency Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Proficiency Level *
                  </label>
                  <div className="space-y-2">
                    {proficiencies.map((prof) => (
                      <button
                        key={prof.value}
                        type="button"
                        onClick={() => setProficiency(prof.value)}
                        disabled={isSaving}
                        className={`w-full p-3 rounded-lg border transition-all text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          proficiency === prof.value
                            ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500/50 hover:bg-slate-700/50'
                        }`}
                        aria-pressed={proficiency === prof.value}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-base">{prof.label}</span>
                          <span className="text-sm opacity-75">{prof.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">💡 Skill Tips</h4>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Be specific (e.g., "React.js" instead of "Frontend")</li>
                    <li>• Use commonly recognized names</li>
                    <li>• You can always update proficiency later</li>
                    <li>• Add ReelSkill videos to showcase your expertise</li>
                  </ul>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex flex-col gap-3 p-4 sm:p-6 border-t border-slate-700/50 bg-slate-800/95">
                <Button 
                  type="submit"
                  disabled={isSaving || !name.trim() || Object.keys(validationErrors).length > 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 py-3 text-base"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Add Skill
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isSaving}
                  className="w-full border-slate-600/50 text-slate-300 hover:bg-slate-700/50 py-3 text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};