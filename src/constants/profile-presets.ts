import { DietaryPreference, LivingStatus } from '../types';

// MatchAI Presets
export const INTERESTS_PRESETS = [
  'Soul music', 'Hip hop', 'Skincare', 'Musical theatre', 'J-Pop', 'Cricket',
  'Freelancing', 'K-Pop', 'Skateboarding', 'Pop music', 'Punk rock',
  'Trying new things', 'Photography', 'Bollywood', 'Reading', 'Singing',
  'Rap music', 'Sports', 'Poetry', 'Stand-up comedy', 'Coffee', 'Karaoke',
  'Fortnite', 'Self-development', 'Mental health awareness', 'Food tours',
  'Climate change', 'Walking my dog', 'Feminism', 'Escape rooms', 'Shopping',
  'Brunch', 'Jetskiing', 'Jogging', 'Harry Potter', 'Self-care', 'Heavy metal',
  'House parties', 'Gymnastics', 'Ludo', 'Biryani', 'Meditation', 'Foodie',
  'Sushi', 'Spotify', 'Hockey', 'Basketball', 'Fantasy films', 'Home workouts',
  'Theatre', 'Café hopping', 'Aquarium', 'Instagram', 'Walking', 'Running',
  'Travel', 'Films', 'Gym', 'Social media'
];

export const JOB_PRESETS = [
  'Software Engineer', 'Doctor', 'Designer', 'Student', 'Artist', 'Manager',
  'Entrepreneur', 'Teacher', 'Writer', 'Chef', 'Lawyer', 'Consultant',
  'Photographer', 'Architect', 'Scientist', 'Musician', 'Product Manager',
  'Freelancer', 'Finance Analyst', 'Other'
];

export const EDUCATION_PRESETS = [
  '8th pass', '10th pass', '12th pass', 'High School', 'Bachelors Degree', 'Masters Degree', 'PhD / Doctorate',
  'Stanford University', 'Harvard University', 'MIT', 'Oxford University',
  'Cambridge University', 'University of California', 'Delhi University',
  'IIT', 'IIM', 'BITS Pilani', 'Self-Taught', 'Other'
];

export const SEXUAL_ORIENTATION_PRESETS = [
  'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Asexual', 'Demisexual', 'Pansexual', 'Queer', 'Other'
];

export const GENDER_PRESETS = [
  'Man', 'Woman', 'Non-binary', 'Transgender', 'Agender', 'Bigender', 'Genderfluid', 'Other'
];

export const GENDER_PREFERENCE_PRESETS = [
  'Women', 'Men', 'Everyone', 'Other'
];

export const RELATIONSHIP_INTENT_PRESETS = [
  'Long-term partner',
  'Long-term, open to short',
  'Short-term, open to long',
  'Short-term fun',
  'New friends',
  'Still figuring it out',
  'Other'
];

export const PROMPT_PRESETS = [
  'The key to my heart is...',
  'My most controversial opinion is...',
  'First concert I ever went to was...',
  'I’m looking for someone who...',
  'We’ll get along if...',
  'A boundary of mine is...',
  'My favorite weekend activity is...',
  'A random fact I love is...'
];

export const DIETARY_OPTIONS: { key: DietaryPreference; label: string; emoji: string }[] = [
  { key: 'STRICT_JAIN', label: 'Strict Jain (No Root Veg)', emoji: '🪷' },
  { key: 'PURE_VEG', label: 'Pure Veg', emoji: '🥦' },
  { key: 'VEGAN', label: 'Vegan (Plant-Based)', emoji: '🌱' },
  { key: 'EGGETARIAN', label: 'Eggetarian', emoji: '🍳' },
  { key: 'NON_VEG', label: 'Non-Veg', emoji: '🍗' },
];

export const LANGUAGE_OPTIONS = [
  'English 🇬🇧', 'Hindi 🇮🇳', 'Punjabi 🌾', 'Bengali 🎨', 'Tamil 🛕', 'Telugu 🏛️',
  'Kannada 🌿', 'Malayalam 🌴', 'Marathi 🚩', 'Gujarati 💎', 'Marwari 🏜️', 'Odia ⛵',
  'Assamese 🫖', 'Urdu 📜', 'Sanskrit 🕉️', 'French 🥐', 'Spanish 💃', 'German 🥨'
];

export const LIVING_OPTIONS: { key: LivingStatus; label: string; emoji: string }[] = [
  { key: 'WITH_PARENTS', label: 'Living with Parents', emoji: '👨‍👩‍👧' },
  { key: 'INDEPENDENT_FLAT', label: 'Independent Flat', emoji: '🏙️' },
  { key: 'PG', label: 'PG / Co-Living', emoji: '🏠' },
];

export const SMOKING_OPTIONS = [
  { key: 'NON_SMOKER', label: 'Non-Smoker', emoji: '🚭' },
  { key: 'OCCASIONAL', label: 'Social / Occasional', emoji: '🚬' },
  { key: 'REGULAR', label: 'Regular Smoker', emoji: '🚬' },
  { key: 'TRYING_TO_QUIT', label: 'Trying to Quit', emoji: '🌿' },
];

export const DRINKING_OPTIONS = [
  { key: 'NON_DRINKER', label: 'Non-Drinker / Teetotaler', emoji: '🚫🍺' },
  { key: 'SOCIAL_DRINKER', label: 'Social / Weekend Drinker', emoji: '🍷' },
  { key: 'REGULAR_DRINKER', label: 'Regular Drinker', emoji: '🍻' },
  { key: 'SOBER', label: 'Sober / Mindful', emoji: '🧘' },
];

export const VACATION_OPTIONS = [
  { key: 'MOUNTAINS', label: 'Majestic Mountains', emoji: '🏔️' },
  { key: 'BEACHES', label: 'Sunny Beaches', emoji: '🏖️' },
  { key: 'BOTH', label: 'Both (Mountain Streams & Beach Sunsets)', emoji: '🌊⛰️' },
  { key: 'CITY_BREAKS', label: 'Vibrant City Breaks', emoji: '🏙️' },
];

export const HOBBIES_PRESETS = [
  'Photography 📷', 'Cooking & Baking 🍳', 'Trekking & Hiking 🥾', 'Cycling 🚴',
  'Reading & Books 📚', 'Gym & Fitness 🏋️', 'Yoga & Meditation 🧘', 'Painting & Art 🎨',
  'Gaming 🎮', 'Gardening 🪴', 'Writing & Poetry ✍️', 'Music Production 🎧',
  'Solo Travel ✈️', 'Specialty Coffee ☕', 'Board Games 🎲', 'Swimming 🏊',
  'Badminton 🏸', 'Film Making 🎬', 'Dog Fostering 🐕', 'Pottery 🏺'
];

export const VEDIC_ZODIAC_OPTIONS = [
  { rashi: 'Mesha', western: 'Aries', symbol: '♈', element: 'Fire (Agni)', lord: 'Mars (Mangal)', traits: 'Bold, energetic, fearless pioneer' },
  { rashi: 'Vrishabha', western: 'Taurus', symbol: '♉', element: 'Earth (Prithvi)', lord: 'Venus (Shukra)', traits: 'Patient, grounded, aesthetic lover' },
  { rashi: 'Mithuna', western: 'Gemini', symbol: '♊', element: 'Air (Vayu)', lord: 'Mercury (Budha)', traits: 'Witty, versatile, engaging conversationalist' },
  { rashi: 'Karka', western: 'Cancer', symbol: '♋', element: 'Water (Jala)', lord: 'Moon (Chandra)', traits: 'Deeply intuitive, nurturing, emotional anchor' },
  { rashi: 'Simha', western: 'Leo', symbol: '♌', element: 'Fire (Agni)', lord: 'Sun (Surya)', traits: 'Charismatic, regal, generous heart' },
  { rashi: 'Kanya', western: 'Virgo', symbol: '♍', element: 'Earth (Prithvi)', lord: 'Mercury (Budha)', traits: 'Mindful, articulate, detail-oriented' },
  { rashi: 'Tula', western: 'Libra', symbol: '♎', element: 'Air (Vayu)', lord: 'Venus (Shukra)', traits: 'Harmonious, graceful, charming diplomat' },
  { rashi: 'Vrischika', western: 'Scorpio', symbol: '♏', element: 'Water (Jala)', lord: 'Mars / Ketu', traits: 'Intense, magnetic, fiercely loyal' },
  { rashi: 'Dhanu', western: 'Sagittarius', symbol: '♐', element: 'Fire (Agni)', lord: 'Jupiter (Brihaspati)', traits: 'Free-spirited, philosophical, candid' },
  { rashi: 'Makara', western: 'Capricorn', symbol: '♑', element: 'Earth (Prithvi)', lord: 'Saturn (Shani)', traits: 'Disciplined, ambitious, steady foundation' },
  { rashi: 'Kumbha', western: 'Aquarius', symbol: '♒', element: 'Air (Vayu)', lord: 'Saturn (Shani)', traits: 'Visionary, eccentric, progressive thinker' },
  { rashi: 'Meena', western: 'Pisces', symbol: '♓', element: 'Water (Jala)', lord: 'Jupiter (Brihaspati)', traits: 'Compassionate, dreamy, soulful artist' },
];

export const VOICE_PROMPT_TOPICS = [
  'Say hello & introduce yourself in your mother tongue 🗣️',
  'The way to my heart: Filter coffee vs Cutting chai ☕',
  'My favorite street food guilty pleasure in my city 🥟',
  'My most controversial Indian dating opinion 🌶️',
  'Sing or hum 10 seconds of your favorite song 🎶',
  'Describe your ideal Sunday morning vibe ☀️',
  'A travel story that made you laugh until you cried ✈️',
];

export const MEME_PRESETS = [
  // --- 🌍 GLOBAL INTERNET LEGENDS ---
  {
    title: 'Distracted Boyfriend 👫👀',
    caption: 'When someone with emotional maturity and great communication walks by.',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Woman Yelling at a Cat 🐱🥗',
    caption: 'Her explaining her complex emotional trauma vs Me peacefully eating fries.',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Roll Safe (Big Brain) 🧠💡',
    caption: 'You cannot get heartbroken if you convince yourself you are a lone wolf.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'This Is Fine (Room on Fire) 🔥☕',
    caption: 'Me smiling on a first date while my personal life is in complete shambles.',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Drake Hotline Bling 🕺❌',
    caption: 'Awkward small talk about weather ❌ | Debating if aliens exist at 2 AM ✔️',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Disaster Girl Smirking 👧🔥',
    caption: 'Me leaving the WhatsApp group after dropping one unhinged voice note.',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Spider-Man Pointing 🕷️👉',
    caption: 'Two emotionally guarded introverts wondering why neither is texting first.',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Two Buttons Sweating Hero 🔴😰',
    caption: 'Reply in 3 seconds to show interest vs Wait 4 hours to appear mysterious.',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Leo Laughing Drink 🍸😏',
    caption: 'Watching them ignore the exact red flag I explicitly warned them about.',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Leo Pointing at TV 📺👉',
    caption: 'Me when my date casually mentions my favorite niche obscure indie band.',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Hide The Pain Harold 😬☕',
    caption: 'Smiling pleasantly when the restaurant bill arrives and they forgot their wallet.',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Success Kid Fist Pump 👶✊',
    caption: 'Went to a social gathering, talked to zero strangers, left early with snacks.',
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Grumpy Cat Universal No 😾🚫',
    caption: 'I went outside once. The graphics were good but the people were terrible.',
    imageUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Doge: Much Romance, Very Wow 🐕✨',
    caption: 'Such mutual attraction. Much butterflies. Very situationship. Wow.',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Buff Doge vs Cheems 🐕💪🐕🥺',
    caption: 'Dating in my head: Charming & smooth | Dating in reality: Knocking over water glasses.',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Trade Offer 🤝📜',
    caption: 'I receive: Memes & Sunday cuddles. You receive: Unlimited loyalty & bad jokes.',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Evil Kermit Whisper 🐸🦹',
    caption: 'Healthy me: Do not double text. Inner Kermit: Send a paragraph and a meme.',
    imageUrl: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Confused Travolta Looking Around 🧥🤷',
    caption: 'Me walking into the cafe trying to figure out who matches their profile picture.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Surprised Pikachu Face ⚡😲',
    caption: 'Ignores obvious red flags for 6 months. Gets heartbroken. Surprised Pikachu.',
    imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Bernie Sanders In Mittens 🧤🥶',
    caption: 'I am once again asking for your love, affection, and hand in marriage.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Change My Mind Table 🪑☕',
    caption: 'Leaving a house party at 9:45 PM to sleep is peak self-care. Change my mind.',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Is This a Pigeon? 🦋🙋‍♂️',
    caption: 'Receives standard polite customer service. Brain: Is this my true soulmate?',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Gru Presentation Board 📈🤦',
    caption: 'Match on SwipeAI -> Great witty banter -> Meet in person -> Panic & freeze.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Expanding Brain (Galaxy Brain) 🌌🧠',
    caption: 'Small talk -> Deep trauma dump -> Sending 50 reels -> Lifelong soul bond.',
    imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Waiting Skeleton on Park Bench 💀🪑',
    caption: 'Still sitting on the bench waiting after they texted "Give me 2 minutes".',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Disappointed Cricket Fan 🧍‍♂️👀',
    caption: 'Me standing with hands on my hips after getting ghosted for the third time.',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Side-Eye Chloe 👧😒',
    caption: 'When they claim they do not listen to music while taking a road trip.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Math Lady / Confused Calculation 📐👩',
    caption: 'Calculating the optimal mathematical delay before replying so I do not look desperate.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Panik Kalm Panik 😱😌😱',
    caption: 'They text you: Panik. They like you: Kalm. They ask for your Spotify wrapped: Panik.',
    imageUrl: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },
  {
    title: 'Shaq Sleeping vs Real Alert 😴👀',
    caption: 'Healthy 8 hours of sleep: I sleep. 2 AM gossip about people I barely know: REAL TALK.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    category: 'Global Legends',
  },

  // --- ❤️ DATING & ROMANCE ---
  {
    title: 'Red Flag Carnival 🚩🎪',
    caption: 'My fatal flaw is convincing myself their red flags are just festive carnival decor.',
    imageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Delulu is the Solulu ✨🔮',
    caption: 'Mentally planning our European summer vacation after exchanging exactly four messages.',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Situationship Doctorate 🎓💔',
    caption: 'We are not technically dating, but if I see you smiling at your phone I am shattered.',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Forensic Analyst of "K" 🕵️‍♂️🔍',
    caption: 'Did they type "K" or lowercase "k"? The uppercase letter indicates hostility.',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'The Ghosting Olympics 👻🥇',
    caption: 'Won gold medal in vanishing into thin air 10 minutes after saying "You are amazing".',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Screenshot Sent to the Same Person 📲😱',
    caption: 'Accidentally sent the screenshot of the conversation right back into the chat.',
    imageUrl: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Astrological Birth Chart Audit 🪐✨',
    caption: 'Need their exact birth time, latitude, and hospital room number before date two.',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'First Date Deep Interrogation 🕵️‍♀️☕',
    caption: 'Skip your job title. Tell me your deepest childhood trauma by 8:15 PM.',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Last 2 Brain Cells on a Date 🧠💨',
    caption: 'Waiter: Enjoy your meal! Me: You too, sir! (Soul immediately exits body).',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },
  {
    title: 'Love Language: 45 Reels Daily 📲❤️',
    caption: 'I will never say "I love you", but you will receive 40 Instagram reels before noon.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    category: 'Dating & Romance',
  },

  // --- 🇮🇳 DESI & INDIAN INTERNET CULTURE ---
  {
    title: 'Silk Board Traffic Survivor 🚗🚦',
    caption: 'If I can endure Silk Board junction at 6:30 PM, I can survive any relationship.',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Filter Coffee > Everything Else ☕✨',
    caption: 'My circulatory system is 80% Kumbakonam degree filter coffee and 20% hope.',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Cutting Chai at 2 AM ☕🌙',
    caption: 'Looking for someone who believes tapri cutting chai dates are the pinnacle of romance.',
    imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Relatives: "Shaadi Kab Karoge?" 👵👀',
    caption: 'Neighborhood aunties calculating my biological timeline faster than an ISRO mainframe.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Biryani is my Love Language 🍗❤️',
    caption: 'Order extra mirchi ka salan and raita without being asked and I will propose.',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Auto Driver: "Nahi Jaunga" 🛺💸',
    caption: 'My emotional rejection resilience was forged by Bengaluru and Mumbai auto drivers.',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Babu Bhaiya: "21 Din Mein Double" 💰🎩',
    caption: 'Promising myself I will start sensible mutual fund SIPs immediately after this date.',
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Taarak Mehta: "Chai Piyo Biscuit Khao" ☕🍪',
    caption: 'My universal remedy for existential dread, work stress, and modern dating heartaches.',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Pankaj Tripathi: "Aram Se Dekhiye" 🧘‍♂️📺',
    caption: 'Radiating calm, serene wisdom when the world around is pure unadulterated chaos.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Pawri Hori Hai 🚗🎉',
    caption: 'Ye hum hai, ye hamara match hai, aur yaha bill barabari se split ho raha hai.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'The Goa Trip Plan That Never Was 🏖️✈️',
    caption: 'Seven years, nine WhatsApp groups, four roadmaps, and exactly zero flights boarded.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Swiggy vs Zomato War at 11:45 PM 🍕🛵',
    caption: 'Toggling delivery coupons across both apps like a high-frequency commodities trader.',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Golmaal: "Abhi Hum Zinda Hai" 🎬🔥',
    caption: 'Crawling out alive after back-to-back Monday sprint planning meetings.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'Techie Burnout: Code by Day, Chai by Night 💻☕',
    caption: 'Merging Pull Requests at 8:00 PM, searching for emotional salvation by 8:05 PM.',
    imageUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
  {
    title: 'First Date: Expectation vs Reality 🤡🍕',
    caption: 'Hoping for deep existential dialogue, ended up comparing Swiggy Instamart discounts.',
    imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&auto=format&fit=crop&q=80',
    category: 'Desi Classics',
  },
];
