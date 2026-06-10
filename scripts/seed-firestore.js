/**
 * Firestore Database Seeder for PULSE
 * Run this script to populate your Firestore database with default users,
 * group chats, and initial messages so that the application is fully functional.
 * 
 * Usage:
 *   node scripts/seed-firestore.js
 */

const fs = require('fs');
const path = require('path');
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// 1. Load configuration from .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('[-] Error: .env file not found in the workspace root.');
  console.log('[*] Please create a .env file with your Firebase credentials first.');
  process.exit(1);
}

console.log('[*] Parsing .env file configuration...');
const envContent = fs.readFileSync(envPath, 'utf8');
const config = {};
envContent.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^\s*EXPO_PUBLIC_([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (match) {
    config[match[1]] = match[2].trim();
  }
});

const requiredKeys = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];

const missingKeys = requiredKeys.filter((key) => !config[key]);
if (missingKeys.length > 0) {
  console.error(`[-] Error: Missing required Firebase keys in .env: ${missingKeys.map(k => `EXPO_PUBLIC_${k}`).join(', ')}`);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_AUTH_DOMAIN,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID,
};

// 2. Initialize Firebase
console.log('[*] Connecting to Firestore database at project:', firebaseConfig.projectId);
let app;
try {
  app = firebase.default.initializeApp(firebaseConfig);
} catch (e) {
  console.error('[-] Firebase Initialization Error:', e);
  process.exit(1);
}
const db = app.firestore();

// 3. Define seed data
const SEED_USERS = [
  {
    uid: 'coach-sarah',
    name: 'COACH SARAH',
    username: 'coach_sarah',
    email: 'sarah.trainer@pulse.com',
    bio: 'Certified Strength & Conditioning Coach. Kettlebell enthusiast.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL40S2aGC_J6AYPUSZ-IvFLMzAJJ8jjiyg38PCvhPwsr8ZUuPJDROayW0iNcuVZEZoMAfJVd0pKkGgZN0sJGCRAQvZoALlD8dQ1aljmR1m_jU1ZFlnYsp-huMlPnb7cqMP-La1W9U5vo38JCQPVH9L7vRcLjB3HYN0vMnlOt8UdduR4B8_X-9tKt9-MBYmCtSlfv0gYQmCvNuVU1Q42TTOKvSqa4lw7R9ONZ7PDeg3FBvCs9gMJ9N2wQFXlwOUeuJcQhUmlkWRx1c5',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'james-wilson',
    name: 'JAMES WILSON',
    username: 'jwilson_lifts',
    email: 'jwilson@pulse.com',
    bio: 'Powerlifter. Bench: 315lb, Squat: 495lb, Deadlift: 550lb. LFG!',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2WT75WonBAgxNvPK93Obhl0mrljui45Ba1ZRoJm6eKiPtFVhULwbczmFD8VFHn3wyS0zVXEQdyoJua6auzYQZF-mYWLCLMvuXb3xEPeoC5e4S1UzuQv2XRyhxIQsg-h3rxNwfmiCTlSfW2dsImNeNOF-_mJpR_MQG4qNBANHJ8eK4gpFA-OMP6CJ5Ul4A9tKRGT-g3K-L12PIRlwZRHCe8DGJ1T16jv9xllD0Wo4HI1y9DZ_rIqZHrdPTdqT9LnsqG3oQ2G8PNA-M',
    settings: { pushNotifications: true, emailReports: false, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'nutrition',
    name: '1-ON-1 NUTRITION',
    username: 'pulse_nutrition',
    email: 'nutrition.bot@pulse.com',
    bio: 'PULSE Diet & Macronutrient assistant. Ask me anything about meal tracking!',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'emma-watson',
    name: 'EMMA WATSON',
    username: 'emma_runs',
    email: 'emma@pulse.com',
    bio: 'Marathoner in training. Yoga and mobility instructor.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'david-beckham',
    name: 'DAVID BECKHAM',
    username: 'david_beckham',
    email: 'beckham@pulse.com',
    bio: 'Footballer. Fitness, style, and conditioning.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    settings: { pushNotifications: false, emailReports: false, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'chris-hemsworth',
    name: 'CHRIS HEMSWORTH',
    username: 'thor_fitness',
    email: 'chris@pulse.com',
    bio: 'Thor conditioning programs. High intensity functional training.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'serena-williams',
    name: 'SERENA WILLIAMS',
    username: 'serena_w',
    email: 'serena@pulse.com',
    bio: '23 Grand Slams. Champion mentality. Hard work pays off.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  },
  {
    uid: 'marcus-chen',
    name: 'MARCUS CHEN',
    username: 'marcus_chen',
    email: 'marcus.chen@pulse.com',
    bio: 'Athlete • Strength Team',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpD2kh56DTxuXNZru_ypU6fp1vhMPBe7HmLtF-5DYPEZFG-hvzHHSircLkY_dtN-E3gZYybE0AzSIOK_pnQRbN1tNGY4MOlbpKDtIGssJVjtrN6e7BRKVBk9snjXG85eqLljffRMouUUUtBlAglVWF2_4VRjlDsmvMgP4Lujb0_qcPZdKtsT28MFX-EHuIaxCN4RCxiwvCs5PtIoNeFpVwI5S-ThqmMsB5JoeWgp6b9vjql6li4CAl2HDihZSJn615vXrXmy7YBH-k',
    settings: { pushNotifications: true, emailReports: true, darkMode: true, profileVisibility: true },
    createdAt: new Date().toISOString()
  }
];

const SEED_GROUPS = [
  {
    id: 'strength-team',
    type: 'group',
    participants: ['coach-sarah', 'james-wilson', 'chris-hemsworth'],
    name: 'Strength Team',
    subtitle: 'Heavy lifting, big gains.',
    emoji: '💪',
    accentColor: '#CCFF00',
    memberCount: 24,
    lastMessage: 'Marcus: Thanks guys!! The Shred Challenge consistency is paying off. Keep pushing!',
    lastMessageTime: new Date(Date.now() - 2 * 3600000),
    messages: [
      { text: 'Morning crew! Who\'s hitting the gym today?', senderId: 'coach-sarah', senderName: 'Coach Sarah', time: new Date(Date.now() - 4 * 3600000) },
      { text: 'Me! Leg day. Dreading it but let\'s go 💀', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 3.9 * 3600000) },
      { text: 'Marcus just hit 225lbs bench press for reps! New group record!! 🏆', senderId: 'coach-sarah', senderName: 'Coach Sarah', time: new Date(Date.now() - 2.5 * 3600000), isPinned: true },
      { text: 'Thanks guys!! The Shred Challenge consistency is paying off. Keep pushing!', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 2 * 3600000) }
    ]
  },
  {
    id: 'shred-challenge',
    type: 'group',
    participants: ['coach-sarah', 'emma-watson', 'serena-williams'],
    name: '6-Week Shred Challenge',
    subtitle: '1,240 athletes. One goal.',
    emoji: '⚡',
    accentColor: '#FF9500',
    memberCount: 1240,
    lastMessage: 'Marcus: YES. Coach tweaked the rest intervals. Way harder!',
    lastMessageTime: new Date(Date.now() - 24 * 3600000),
    messages: [
      { text: 'Week 3 check-in! How\'s everyone\'s progress?', senderId: 'admin', senderName: 'Challenge Admin', time: new Date(Date.now() - 3.5 * 24 * 3600000) },
      { text: 'Down 4lbs from week 1! Nutrition discipline is everything 💯', senderId: 'jordan', senderName: 'Jordan K.', time: new Date(Date.now() - 3.4 * 24 * 3600000) },
      { text: 'Cardio every morning is brutal but worth it', senderId: 'priya', senderName: 'Priya M.', time: new Date(Date.now() - 2 * 24 * 3600000) },
      { text: 'YES. Coach tweaked the rest intervals. Way harder!', senderId: 'marcus-chen', senderName: 'Marcus Chen', time: new Date(Date.now() - 22 * 3600000) }
    ]
  },
  {
    id: 'morning-run',
    type: 'group',
    participants: ['emma-watson', 'david-beckham'],
    name: 'Morning Run Club',
    subtitle: '5AM crew. No excuses.',
    emoji: '🏃',
    accentColor: '#00E5FF',
    memberCount: 58,
    lastMessage: 'Alex T.: Let\'s do 8km this time. We\'ve been slacking at 6km',
    lastMessageTime: new Date(Date.now() - 48 * 3600000),
    messages: [
      { text: '5AM tomorrow. Riverside route. Who\'s in?', senderId: 'run-lead', senderName: 'Run Lead', time: new Date(Date.now() - 2 * 24 * 3600000) },
      { text: 'Let\'s do 8km this time. We\'ve been slacking at 6km', senderId: 'alex-t', senderName: 'Alex T.', time: new Date(Date.now() - 25 * 3600000) }
    ]
  }
];

// 4. Seeding process
const seed = async () => {
  try {
    // A. Seed Registered Users
    console.log('[+] Seeding users into Firestore...');
    for (const u of SEED_USERS) {
      await db.collection('users').doc(u.uid).set(u);
      console.log(`    [+] Seeded user: ${u.name} (@${u.username})`);
    }

    // B. Seed Groups and Messages
    console.log('[+] Seeding default group chats and messages...');
    for (const grp of SEED_GROUPS) {
      const { messages, ...grpData } = grp;
      const grpRef = db.collection('chats').doc(grp.id);
      
      await grpRef.set({
        ...grpData,
        lastMessageTime: firebase.default.firestore.Timestamp.fromDate(grpData.lastMessageTime)
      });
      console.log(`    [+] Seeded chat group: ${grpData.name}`);

      const msgsColRef = grpRef.collection('messages');
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        await msgsColRef.add({
          text: msg.text,
          senderId: msg.senderId,
          senderName: msg.senderName || 'Athlete',
          time: firebase.default.firestore.Timestamp.fromDate(msg.time),
          isPinned: msg.isPinned || false
        });
      }
      console.log(`        [+] Seeded ${messages.length} messages for ${grpData.name}`);
    }

    console.log('[+] Firestore seeding completed successfully! 🎉');
    process.exit(0);
  } catch (err) {
    console.error('[-] Seeding failed with error:', err);
    process.exit(1);
  }
};

seed();
