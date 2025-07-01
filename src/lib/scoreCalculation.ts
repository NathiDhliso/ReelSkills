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

interface ScoreBreakdown {
  baseScore: number;
  proficiencyBonus: number;
  experienceBonus: number;
  diversityBonus: number;
  verificationBonus: number;
  aiRatingBonus: number;
  total: number;
  maxPossible: number;
  percentageComplete: number;
}

interface ScoreDetails {
  currentScore: number;
  maxScore: number;
  breakdown: ScoreBreakdown;
  recommendations: string[];
  nextSteps: string[];
  levelName: string;
  levelProgress: number;
}

// Proficiency level weights
const PROFICIENCY_WEIGHTS = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
  master: 5
};

// Category weights (encourage diversity)
const CATEGORY_WEIGHTS = {
  technical: 1.2,
  soft: 1.1,
  language: 1.0,
  certification: 1.3
};

// Score level definitions
const SCORE_LEVELS = [
  { min: 0, max: 199, name: 'Emerging Professional', color: 'text-slate-400' },
  { min: 200, max: 399, name: 'Developing Professional', color: 'text-primary-400' },
  { min: 400, max: 599, name: 'Competent Professional', color: 'text-success-400' },
  { min: 600, max: 799, name: 'Skilled Professional', color: 'text-warning-400' },
  { min: 800, max: 1000, name: 'Expert Professional', color: 'text-purple-400' }
];

export function calculateReelPassScore(skills: Skill[]): ScoreDetails {
  if (skills.length === 0) {
    return {
      currentScore: 0,
      maxScore: 1000,
      breakdown: {
        baseScore: 0,
        proficiencyBonus: 0,
        experienceBonus: 0,
        diversityBonus: 0,
        verificationBonus: 0,
        aiRatingBonus: 0,
        total: 0,
        maxPossible: 1000,
        percentageComplete: 0
      },
      recommendations: [
        'Add your first skill to get started',
        'Choose skills that showcase your expertise',
        'Include both technical and soft skills'
      ],
      nextSteps: [
        'Add 3-5 core skills',
        'Set realistic proficiency levels',
        'Upload ReelSkill videos for verification'
      ],
      levelName: 'Emerging Professional',
      levelProgress: 0
    };
  }

  // 1. Base Score: Number of skills (up to 15 skills, 20 points each)
  const baseScore = Math.min(skills.length * 20, 300);

  // 2. Proficiency Bonus: Based on proficiency levels (up to 200 points)
  const proficiencyScore = skills.reduce((sum, skill) => {
    return sum + (PROFICIENCY_WEIGHTS[skill.proficiency] * 8);
  }, 0);
  const proficiencyBonus = Math.min(proficiencyScore, 200);

  // 3. Experience Bonus: Years of experience (up to 150 points)
  const totalExperience = skills.reduce((sum, skill) => sum + skill.years_experience, 0);
  const experienceBonus = Math.min(totalExperience * 3, 150);

  // 4. Diversity Bonus: Different categories (up to 100 points)
  const categories = new Set(skills.map(skill => skill.category));
  const diversityBonus = categories.size * 25; // 25 points per unique category

  // 5. Verification Bonus: Verified skills and videos (up to 150 points)
  const verifiedSkills = skills.filter(skill => skill.verified || skill.video_verified).length;
  const videoSkills = skills.filter(skill => skill.video_demo_url).length;
  const verificationBonus = (verifiedSkills * 15) + (videoSkills * 10);

  // 6. AI Rating Bonus: Based on AI assessments (up to 100 points)
  const skillsWithAI = skills.filter(skill => skill.ai_rating);
  const aiRatingSum = skillsWithAI.reduce((sum, skill) => sum + (skill.ai_rating || 0), 0);
  const avgAIRating = skillsWithAI.length > 0 ? aiRatingSum / skillsWithAI.length : 0;
  const aiRatingBonus = avgAIRating * 20; // 20 points per average star

  // Calculate total score
  const total = Math.round(baseScore + proficiencyBonus + experienceBonus + diversityBonus + verificationBonus + aiRatingBonus);
  const maxPossible = 1000;
  const percentageComplete = Math.round((total / maxPossible) * 100);

  // Determine level
  const currentLevel = SCORE_LEVELS.find(level => total >= level.min && total <= level.max) || SCORE_LEVELS[0];
  const levelProgress = currentLevel ? Math.round(((total - currentLevel.min) / (currentLevel.max - currentLevel.min)) * 100) : 0;

  // Generate recommendations
  const recommendations = generateRecommendations(skills, {
    baseScore,
    proficiencyBonus,
    experienceBonus,
    diversityBonus,
    verificationBonus,
    aiRatingBonus,
    total,
    maxPossible,
    percentageComplete
  });

  // Generate next steps
  const nextSteps = generateNextSteps(skills, total);

  return {
    currentScore: total,
    maxScore: maxPossible,
    breakdown: {
      baseScore,
      proficiencyBonus,
      experienceBonus,
      diversityBonus,
      verificationBonus,
      aiRatingBonus,
      total,
      maxPossible,
      percentageComplete
    },
    recommendations,
    nextSteps,
    levelName: currentLevel.name,
    levelProgress
  };
}

function generateRecommendations(skills: Skill[], breakdown: ScoreBreakdown): string[] {
  const recommendations: string[] = [];

  // Skill quantity recommendations
  if (skills.length < 5) {
    recommendations.push(`Add ${5 - skills.length} more skills to increase your base score`);
  } else if (skills.length < 10) {
    recommendations.push('Consider adding more specialized skills to boost your profile');
  }

  // Proficiency recommendations
  const beginnerSkills = skills.filter(s => s.proficiency === 'beginner').length;
  if (beginnerSkills > skills.length * 0.5) {
    recommendations.push('Upgrade proficiency levels as you gain more experience');
  }

  // Category diversity
  const categories = new Set(skills.map(skill => skill.category));
  if (categories.size < 3) {
    recommendations.push('Add skills from different categories (technical, soft skills, languages, certifications)');
  }

  // Verification recommendations
  const unverifiedSkills = skills.filter(s => !s.video_verified && !s.verified).length;
  if (unverifiedSkills > 0) {
    recommendations.push(`Upload ReelSkill videos for ${unverifiedSkills} unverified skills`);
  }

  // Experience recommendations
  const lowExperienceSkills = skills.filter(s => s.years_experience < 1).length;
  if (lowExperienceSkills > skills.length * 0.3) {
    recommendations.push('Update years of experience for skills you\'ve been practicing');
  }

  // AI rating recommendations
  const skillsWithoutAI = skills.filter(s => !s.ai_rating).length;
  if (skillsWithoutAI > 0) {
    recommendations.push('Complete AI assessments for more skills to boost your score');
  }

  return recommendations.slice(0, 4); // Limit to top 4 recommendations
}

function generateNextSteps(skills: Skill[], currentScore: number): string[] {
  const nextSteps: string[] = [];

  if (currentScore < 200) {
    nextSteps.push('Add 5+ core skills to establish your foundation');
    nextSteps.push('Set realistic proficiency levels for each skill');
    nextSteps.push('Create your first ReelSkill demonstration video');
  } else if (currentScore < 400) {
    nextSteps.push('Diversify across technical and soft skills');
    nextSteps.push('Upload ReelSkill videos for top 3 skills');
    nextSteps.push('Add more years of experience details');
  } else if (currentScore < 600) {
    nextSteps.push('Focus on getting AI verifications for key skills');
    nextSteps.push('Add specialized or certification-based skills');
    nextSteps.push('Improve proficiency levels for existing skills');
  } else if (currentScore < 800) {
    nextSteps.push('Complete AI assessments for all skills');
    nextSteps.push('Add master-level skills in your expertise area');
    nextSteps.push('Ensure all skills have video demonstrations');
  } else {
    nextSteps.push('Maintain high-quality skill demonstrations');
    nextSteps.push('Share knowledge through advanced ReelSkills');
    nextSteps.push('Mentor others and build your professional network');
  }

  return nextSteps.slice(0, 3); // Limit to top 3 next steps
}

export function calculatePotentialScore(skills: Skill[]): number {
  // Calculate the potential score if all skills were verified and had AI ratings
  const potentialSkills = skills.map(skill => ({
    ...skill,
    verified: true,
    video_verified: true,
    video_demo_url: skill.video_demo_url || 'potential-video',
    ai_rating: skill.ai_rating || 4 // Assume good AI rating if not available
  }));

  return calculateReelPassScore(potentialSkills).currentScore;
}

export function getScoreLevelInfo(score: number) {
  const level = SCORE_LEVELS.find(l => score >= l.min && score <= l.max) || SCORE_LEVELS[0];
  const progress = Math.round(((score - level.min) / (level.max - level.min)) * 100);
  
  return {
    ...level,
    progress: Math.max(0, Math.min(100, progress)),
    nextLevel: SCORE_LEVELS.find(l => l.min > level.max)
  };
} 