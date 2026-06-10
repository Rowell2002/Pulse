export interface Exercise {
  id: string;
  name: string;
  category: 'Strength' | 'HIIT' | 'Yoga' | 'Mobility';
  muscleGroup: 'Chest' | 'Back' | 'Quads' | 'Hamstrings' | 'Shoulders' | 'Arms' | 'Core';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[];
  intensity: number;
  duration: string;
  image: string;
  videoImage?: string;
  steps: { num: string; title: string; desc: string }[];
  primaryHotspot?: { top: number; left: number; label: string };
  secondaryHotspot?: { top: number; left: number; label: string };
}

export interface Program {
  id: string;
  title: string;
  category: 'Strength' | 'HIIT' | 'Yoga' | 'Mobility';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  focus: string;
  progress?: number;
  weekText?: string;
  image: string;
  exercises: string[]; // List of exercise IDs
}

export const EXERCISES: Exercise[] = [
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    category: 'Strength',
    muscleGroup: 'Quads',
    difficulty: 'Advanced',
    equipment: ['Barbell', 'Power Rack'],
    intensity: 8.5,
    duration: '45 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn3kGdXbGLF6PwfeuEzV1XIud4h-DRY6trZVw5Z5PuBynLqI8Sixutg8gyninV-P_ytR7d8rfLORc91Ad9ePWV1Cfi34jJYhfH5Fzp95p2mjrxvFSnGzhiNPstoE_8E39j6Q7IOGWNIQeds-Zkb-S0XOv50-yp-p36VKdbb6GQo2ji-HT6elp4_h3ZrP7YQyyIpp8chwkgmmffc4CkrzFWFwtVN2cfuMfPq5OSMDicptSJ2RlqTjzg_8ept6OOLlPNLU8WfVqjkaFB',
    videoImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn3kGdXbGLF6PwfeuEzV1XIud4h-DRY6trZVw5Z5PuBynLqI8Sixutg8gyninV-P_ytR7d8rfLORc91Ad9ePWV1Cfi34jJYhfH5Fzp95p2mjrxvFSnGzhiNPstoE_8E39j6Q7IOGWNIQeds-Zkb-S0XOv50-yp-p36VKdbb6GQo2ji-HT6elp4_h3ZrP7YQyyIpp8chwkgmmffc4CkrzFWFwtVN2cfuMfPq5OSMDicptSJ2RlqTjzg_8ept6OOLlPNLU8WfVqjkaFB',
    steps: [
      {
        num: '01',
        title: 'Setup the Bar',
        desc: 'Position the barbell on a power rack at about mid-chest height. Step under the bar and place it across your upper back.',
      },
      {
        num: '02',
        title: 'Unrack & Brace',
        desc: 'Grip the bar firmly, lift it off the rack, and take two small steps back. Brace your core and keep your chest up.',
      },
      {
        num: '03',
        title: 'The Descent',
        desc: 'Hinge at your hips and bend your knees simultaneously. Lower yourself until your thighs are at least parallel to the floor.',
      },
      {
        num: '04',
        title: 'Drive Up',
        desc: 'Push through your mid-foot to return to the starting position. Keep your knees aligned with your toes.',
      },
    ],
    primaryHotspot: { top: 212, left: 45, label: 'Primary: Quadriceps' },
    secondaryHotspot: { top: 221, left: 60, label: 'Secondary: Gluteus Maximus' },
  },
  {
    id: 'dumbbell-chest-press',
    name: 'Dumbbell Chest Press',
    category: 'Strength',
    muscleGroup: 'Chest',
    difficulty: 'Intermediate',
    equipment: ['Dumbbells', 'Flat Bench'],
    intensity: 7.5,
    duration: '40 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2NRdLXej0zuPG0oLQpBosq0ZuMCZbARsVfvi-KBPzLRYUrIbu38ndJfUCya-axwxE3-pqmZQdzZeqs8VVWff64bDpqBxumIVKc6Kkmgs7lGVxvibdUR6T8HUPwWvlMtoYIH8NMUKed5xicesmDjB9yCA9lybIWMtc7Xba753T09uovn93KIx14d_FdKXTd7ozZaib4EsWgtUyIXYcRnIP9wyG0hLS4kwyyNOwV7izlyY33TBlrRGDeQ6juZYa37d_eGnt0C5ZAVvn',
    videoImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2NRdLXej0zuPG0oLQpBosq0ZuMCZbARsVfvi-KBPzLRYUrIbu38ndJfUCya-axwxE3-pqmZQdzZeqs8VVWff64bDpqBxumIVKc6Kkmgs7lGVxvibdUR6T8HUPwWvlMtoYIH8NMUKed5xicesmDjB9yCA9lybIWMtc7Xba753T09uovn93KIx14d_FdKXTd7ozZaib4EsWgtUyIXYcRnIP9wyG0hLS4kwyyNOwV7izlyY33TBlrRGDeQ6juZYa37d_eGnt0C5ZAVvn',
    steps: [
      {
        num: '01',
        title: 'Positioning',
        desc: 'Sit on the end of a flat bench with a dumbbell in each hand resting on your knees. Lie back, bringing the weights to your chest.',
      },
      {
        num: '02',
        title: 'Initial Press',
        desc: 'Press the dumbbells straight up above your chest, locking your arms at the top with palms facing away.',
      },
      {
        num: '03',
        title: 'Lowering Phase',
        desc: 'Slowly lower the weights until your elbows form a 90-degree angle, level with your chest.',
      },
      {
        num: '04',
        title: 'The Push',
        desc: 'Drive the weights back up using your chest muscles, maintaining a controlled path.',
      },
    ],
    primaryHotspot: { top: 120, left: 45, label: 'Primary: Pectoralis Major' },
    secondaryHotspot: { top: 130, left: 35, label: 'Secondary: Anterior Deltoids' },
  },
  {
    id: 'deadlift',
    name: 'Conventional Barbell Deadlift',
    category: 'Strength',
    muscleGroup: 'Hamstrings',
    difficulty: 'Advanced',
    equipment: ['Barbell', 'Weight Plates'],
    intensity: 9.0,
    duration: '50 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs',
    steps: [
      {
        num: '01',
        title: 'The Stance',
        desc: 'Stand with feet hip-width apart, shins about an inch from the bar. Hinge forward and grab the bar.',
      },
      {
        num: '02',
        title: 'Set the Spine',
        desc: 'Flatten your back, drop your hips slightly, engage your lats, and brace your core.',
      },
      {
        num: '03',
        title: 'The Pull',
        desc: 'Drive through your feet and pull the bar straight up, keeping it close to your body as you stand tall.',
      },
      {
        num: '04',
        title: 'Lockout',
        desc: 'Squeeze your glutes at the top without hyperextending your lower back, then reverse in control.',
      },
    ],
    primaryHotspot: { top: 220, left: 55, label: 'Primary: Hamstrings & Glutes' },
    secondaryHotspot: { top: 160, left: 50, label: 'Secondary: Erector Spinae' },
  },
  {
    id: 'kettlebell-swing',
    name: 'Russian Kettlebell Swing',
    category: 'HIIT',
    muscleGroup: 'Hamstrings',
    difficulty: 'Intermediate',
    equipment: ['Kettlebell'],
    intensity: 7.8,
    duration: '30 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGI8XnqpxM0rZJwn03sD81iJi4hAn1fK45oMAWBrHzH58j05YAmwCc-1Umd7rcAX6bVu7tMnfTBPl4g4ULzXxHSgSTbATqHknXWBcJnq-KUsDbPi50mYsz01j2mZMsu6fOa-VSX-rcRcfe0QsGem43VPW7Y0p5PdTZEHKWdvzLzrUrgC34xU-JJNuxr1BiL5j08fAnXXiiKeIM8bVnTMk2-QvkjeZsahTO768eDjqmpwFKBNyaIY8S2v_CmP1CjFGWi4SlN145xH0B',
    steps: [
      {
        num: '01',
        title: 'Setup Hike',
        desc: 'Place the kettlebell two feet in front of you. Hinge at the hips, grip the handle, and tilt it toward you.',
      },
      {
        num: '02',
        title: 'The Hike',
        desc: 'Hike the kettlebell back between your legs close to your groin, keeping your forearms against your thighs.',
      },
      {
        num: '03',
        title: 'Hip Snap',
        desc: 'Snap your hips forward aggressively, locking your knees and squeezing your glutes to swing the bell to chest height.',
      },
      {
        num: '04',
        title: 'Return Hinge',
        desc: 'Let gravity bring the kettlebell back down, hinging at the hips once your upper arms connect with your rib cage.',
      },
    ],
    primaryHotspot: { top: 220, left: 55, label: 'Primary: Hamstrings & Glutes' },
    secondaryHotspot: { top: 180, left: 50, label: 'Secondary: Shoulders' },
  },
  {
    id: 'pull-up',
    name: 'Bodyweight Pull-Up',
    category: 'Strength',
    muscleGroup: 'Back',
    difficulty: 'Intermediate',
    equipment: ['Pull-Up Bar'],
    intensity: 8.0,
    duration: '35 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs',
    steps: [
      {
        num: '01',
        title: 'Grip & Hang',
        desc: 'Hang from a pull-up bar with a pronated grip (palms facing away), hands slightly wider than shoulder-width.',
      },
      {
        num: '02',
        title: 'Scapular Pull',
        desc: 'Depress and retract your shoulder blades to engage the lats before bending your elbows.',
      },
      {
        num: '03',
        title: 'The Ascent',
        desc: 'Pull your chest up toward the bar, driving your elbows down toward your back pockets until your chin clears the bar.',
      },
      {
        num: '04',
        title: 'Controlled descent',
        desc: 'Slowly lower yourself back down to a full dead hang, keeping your core braced throughout.',
      },
    ],
    primaryHotspot: { top: 130, left: 50, label: 'Primary: Latissimus Dorsi' },
    secondaryHotspot: { top: 140, left: 30, label: 'Secondary: Biceps Brachii' },
  },
  {
    id: 'plank',
    name: 'Forearm Core Plank',
    category: 'Mobility',
    muscleGroup: 'Core',
    difficulty: 'Beginner',
    equipment: ['Exercise Mat'],
    intensity: 6.0,
    duration: '20 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs',
    steps: [
      {
        num: '01',
        title: 'Forearm Setup',
        desc: 'Place your forearms on the floor, elbows aligned under shoulders, hands flat or clasped.',
      },
      {
        num: '02',
        title: 'Line Up',
        desc: 'Step your feet back, lifting your hips to create a straight line from your head to your heels.',
      },
      {
        num: '03',
        title: 'Engage Core',
        desc: 'Squeeze your glutes, brace your abs, and push away from the floor through your elbows.',
      },
      {
        num: '04',
        title: 'Hold & Breathe',
        desc: 'Maintain this rigid posture while taking slow, controlled breaths. Keep your neck neutral.',
      },
    ],
    primaryHotspot: { top: 170, left: 50, label: 'Primary: Rectus Abdominis' },
    secondaryHotspot: { top: 190, left: 45, label: 'Secondary: Transversus Abdominis' },
  },
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    category: 'Strength',
    muscleGroup: 'Shoulders',
    difficulty: 'Intermediate',
    equipment: ['Barbell', 'Rack'],
    intensity: 8.0,
    duration: '40 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAn3kGdXbGLF6PwfeuEzV1XIud4h-DRY6trZVw5Z5PuBynLqI8Sixutg8gyninV-P_ytR7d8rfLORc91Ad9ePWV1Cfi34jJYhfH5Fzp95p2mjrxvFSnGzhiNPstoE_8E39j6Q7IOGWNIQeds-Zkb-S0XOv50-yp-p36VKdbb6GQo2ji-HT6elp4_h3ZrP7YQyyIpp8chwkgmmffc4CkrzFWFwtVN2cfuMfPq5OSMDicptSJ2RlqTjzg_8ept6OOLlPNLU8WfVqjkaFB',
    steps: [
      {
        num: '01',
        title: 'The Rack Position',
        desc: 'Set the barbell at upper chest height. Rest the bar on your front shoulders, hands slightly wider than shoulder-width.',
      },
      {
        num: '02',
        title: 'Bracing',
        desc: 'Squeeze your glutes, brace your core, pull your chin back, and prepare to push.',
      },
      {
        num: '03',
        title: 'The Drive',
        desc: 'Press the bar straight up overhead, moving your face out of the path of the bar as it passes.',
      },
      {
        num: '04',
        title: 'Lockout',
        desc: 'Push your head forward slightly at the top, locking out your arms with the bar directly over your mid-foot.',
      },
    ],
    primaryHotspot: { top: 120, left: 50, label: 'Primary: Deltoids' },
    secondaryHotspot: { top: 130, left: 30, label: 'Secondary: Triceps Brachii' },
  },
  {
    id: 'bicep-curl',
    name: 'Dumbbell Bicep Curl',
    category: 'Strength',
    muscleGroup: 'Arms',
    difficulty: 'Beginner',
    equipment: ['Dumbbells'],
    intensity: 6.5,
    duration: '25 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGI8XnqpxM0rZJwn03sD81iJi4hAn1fK45oMAWBrHzH58j05YAmwCc-1Umd7rcAX6bVu7tMnfTBPl4g4ULzXxHSgSTbATqHknXWBcJnq-KUsDbPi50mYsz01j2mZMsu6fOa-VSX-rcRcfe0QsGem43VPW7Y0p5PdTZEHKWdvzLzrUrgC34xU-JJNuxr1BiL5j08fAnXXiiKeIM8bVnTMk2-QvkjeZsahTO768eDjqmpwFKBNyaIY8S2v_CmP1CjFGWi4SlN145xH0B',
    steps: [
      {
        num: '01',
        title: 'Stance & Grip',
        desc: 'Stand straight with a dumbbell in each hand, palms facing forward. Keep elbows close to your torso.',
      },
      {
        num: '02',
        title: 'The Curl',
        desc: 'Contract your biceps to lift the weights, keeping your upper arms stationary until the dumbbells reach shoulder level.',
      },
      {
        num: '03',
        title: 'Squeeze',
        desc: 'Hold the contracted position briefly at the top and squeeze your biceps.',
      },
      {
        num: '04',
        title: 'Lowering',
        desc: 'Slowly lower the dumbbells back to the starting position with full extension.',
      },
    ],
    primaryHotspot: { top: 140, left: 30, label: 'Primary: Biceps Brachii' },
    secondaryHotspot: { top: 145, left: 35, label: 'Secondary: Brachialis' },
  },
  {
    id: 'yoga-downward-dog',
    name: 'Downward Facing Dog',
    category: 'Yoga',
    muscleGroup: 'Hamstrings',
    difficulty: 'Beginner',
    equipment: ['Mat'],
    intensity: 5.0,
    duration: '20 MIN',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuElD0ZoimuCj2EwugeFRYCQSelWolCFiNnF92LDFlNpGvCeKVW0D9ex5GmLvXAdlKVx5Ii1QrqhTm_EzJCBEfsk-KP_hej6le5wKqrx04D7-dM-BPVnSAeqPOKtggdTHPvUy_GGRtMnEpgPpVG7E9z9TnSezcA-MJETD8nyMbNbzxnlsTik7Q0tU1RZuVvsPHl9LlKOffOEAOAlPlTedsSACVboNdNKAd6JWmZGkSWZ7I79GJyN309RgAQBe-d8AfKMSo8XatMMYO',
    steps: [
      {
        num: '01',
        title: 'Plank Start',
        desc: 'Start on your hands and knees or in a high plank position. Spread your fingers wide.',
      },
      {
        num: '02',
        title: 'Hip Lift',
        desc: 'Push through your hands and lift your hips toward the ceiling, straightening your legs.',
      },
      {
        num: '03',
        title: 'Align Spine',
        desc: 'Press your chest back toward your thighs to lengthen your spine. Let your head hang freely.',
      },
      {
        num: '04',
        title: 'Heel Press',
        desc: 'Gently press your heels down toward the mat, stretching your calves and hamstrings.',
      },
    ],
    primaryHotspot: { top: 220, left: 55, label: 'Primary: Hamstrings & Calves' },
    secondaryHotspot: { top: 130, left: 50, label: 'Secondary: Latissimus Dorsi' },
  }
];

export const PROGRAMS: Program[] = [
  {
    id: 'elite-strength-2-0',
    title: 'Elite Strength 2.0',
    category: 'Strength',
    difficulty: 'Advanced',
    duration: '8 Weeks',
    focus: 'Hypertrophy Focus',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAViwHv8c8Oe9bsVKUgCHqIKO0shbrkkNdRJfxTIUuksRoxszVHF8tb7YaU1mEPLpSuYhOCmrVn2F56P3WjEMFxCfNRprbPMbYkB7I7f6v26fqIDWrDFja3ZXBSxbascsi2FV83ZqPClFeVuOpxqXVMTH0k3ZM5_pldFy3MraJUEGv7gzH2grAiRttD0pcDd_86bkayGapAJ4vVKN3pfo4LmC6ePChr97mkstRl4ysNMzlbZjgUTB-FuEekUHiFo8-GLIZYETwzBhAq',
    exercises: ['barbell-back-squat', 'dumbbell-chest-press', 'deadlift', 'overhead-press'],
  },
  {
    id: 'kettlebell-mastery',
    title: 'Kettlebell Mastery',
    category: 'HIIT',
    difficulty: 'Intermediate',
    duration: '6 Weeks',
    focus: 'Full Body Kettlebell Workouts',
    progress: 45,
    weekText: 'Week 3 of 6',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGI8XnqpxM0rZJwn03sD81iJi4hAn1fK45oMAWBrHzH58j05YAmwCc-1Umd7rcAX6bVu7tMnfTBPl4g4ULzXxHSgSTbATqHknXWBcJnq-KUsDbPi50mYsz01j2mZMsu6fOa-VSX-rcRcfe0QsGem43VPW7Y0p5PdTZEHKWdvzLzrUrgC34xU-JJNuxr1BiL5j08fAnXXiiKeIM8bVnTMk2-QvkjeZsahTO768eDjqmpwFKBNyaIY8S2v_CmP1CjFGWi4SlN145xH0B',
    exercises: ['kettlebell-swing', 'bicep-curl', 'plank'],
  },
  {
    id: 'functional-engine',
    title: 'Functional Engine',
    category: 'HIIT',
    difficulty: 'Beginner',
    duration: '4 Weeks',
    focus: 'Functional Conditioning',
    progress: 15,
    weekText: 'Week 1 of 4',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKahpWUjryOS5P0xCh39QVdCKwCavtHgSdLUu6iAyU1LK3Sfg_cMLYXqafEiVRhVFEcHiD63xwSGeL3ijGtrixb5Ah1BMYDj3p41T2y41ep6yhB9wGLJHbxDl46YQnTNCDYTx45FccNuo1KllMiOP0nkISIIU51uo6CY2JPPGW7VCRuY3lEgyA43OJWCZXHX0OzCcoRHpXdEMsCbOmGSMZO9qbEM9xd0ZrBlMl790chJDgTEzKro-3xK522y7zWjfYq4DJeXv_ZmTs',
    exercises: ['plank', 'pull-up', 'bicep-curl', 'yoga-downward-dog'],
  }
];
