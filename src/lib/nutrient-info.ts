export const DEFICIENCY_INFO = {
  'Vitamin C':   { name:'Scurvy & Collagen Fatigue (PMID: 29099763)',          sources:'Citrus, bell peppers, broccoli, strawberries, kiwi',   desc:'Crucial for collagen synthesis and immune resilience. Deficiency leads to bleeding gums, bruising, and slow wound recovery.' },
  'Vitamin B1':  { name:'Low Energy & Nerve Health (PMID: 28401095)',        sources:'Pork, sunflower seeds, beans, lentils',     desc:'Converts carbs into fuel. Low intake causes "brain fog", fatigue, and irritability.' },
  'Vitamin B2':  { name:'Skin & Eye Sensitivity (PMID: 27903965)',                 sources:'Beef liver, dairy, almonds',       desc:'Essential for energy and cellular function. Deficiency results in mouth sores and sensitivity to light.' },
  'Vitamin B3':  { name:'Brain & Skin Barrier (PMID: 28367323)',       sources:'Tuna, salmon, chicken, peanuts',   desc:'Critical for cellular energy. Deficiency can lead to skin issues and cognitive fatigue.' },
  'Vitamin B5':  { name:'Stress & Fat Metabolism (PMID: 31991823)',        sources:'Chicken liver, sunflower seeds',   desc:'Required for fat breakdown. Signs of deficiency include "burning feet" syndrome and high stress.' },
  'Vitamin B6':  { name:'Neurotransmitter Balance (PMID: 29023386)',            sources:'Chickpeas, potatoes, tuna',        desc:'Vital for mood and muscle. Low levels affect sleep, mood, and mental focus.' },
  'Vitamin B7':  { name:'Keratin & Lipid Health (PMID: 28055028)',          sources:'Egg yolks, liver, salmon',         desc:'Essential for hair and nail growth. Deficiency leads to brittle hair and thinning skin.' },
  'Vitamin B9':  { name:'DNA Synthesis & Renewal (PMID: 24376085)',   sources:'Leafy greens, lentils, asparagus', desc:'Vital for cell production. Low levels cause fatigue and short breath.' },
  'Vitamin B12': { name:'Myelin & Nerve Clarity (PMID: 33946251)',     sources:'Beef liver, dairy, eggs, nutritional yeast',         desc:'Protects the nervous system. Common causes of fatigue and tingling in extremities.' },
  'Vitamin A':   { name:'Ocular & Epithelial Health (PMID: 20200263)',             sources:'Liver, sweet potato, carrots',     desc:'Critical for night vision and immune defense. Deficiency causes dry eyes and skin.' },
  'Vitamin D':   { name:'Osteo-Immune Protocol (PMID: 32872303)',           sources:'Salmon, UV mushrooms, sun',     desc:'Regulates calcium and immune status. Low levels linked to bone pain and frequent illness.' },
  'Vitamin E':   { name:'Lipid Peroxidation Defense (PMID: 30987316)',              sources:'Wheat germ, sunflower seeds',      desc:'Protects cell membranes from damage. Essential for skin and muscle recovery.' },
  'Vitamin K':   { name:'Skeletal Mineralization (PMID: 30909645)',          sources:'Kale, natto, spinach',             desc:'Critical for bone density and healthy recovery. Signs of low intake include easy bruising.' },
  'Calcium':     { name:'Bone Density & Cardiac Signal (PMID: 25856551)',                sources:'Dairy, sardines, tofu, kale',            desc:'Primary structural mineral. Deficiency leads to muscle spasms and weakened skeletal integrity.' },
  'Phosphorus':  { name:'ATP & Cellular Energy (PMID: 29301074)',             sources:'Dairy, meat, legumes',             desc:'Key part of the body\'s energy storage (ATP). Required for strong bone formation.' },
  'Magnesium':   { name:'Signal Conductivity & Sleep (PMID: 28710195)',        sources:'Pumpkin seeds, almonds, dark chocolate',  desc:'Facilitates over 300 enzyme actions. Deficiency causes muscle cramps and restless sleep.' },
  'Sodium':      { name:'Electrolytic Balance (PMID: 28403157)',        sources:'Salt, seaweed',            desc:'Regulates fluid levels. Imbalances can cause headaches and mental confusion.' },
  'Potassium':   { name:'Intracellular Pressure (PMID: 29477388)',         sources:'Potassium-rich foods (Bananas, potatoes)',         desc:'Counters sodium to protect heart health. Low intake leads to bloating and muscle weakness.' },
  'Iron':        { name:'Hemoglobin & Vitality (PMID: 24778671)',      sources:'Red meat, lentils, spinach',       desc:'Carries oxygen in blood. Deficiency is the primary cause of fatigue and cold sensitivity.' },
  'Zinc':        { name:'T-Cell & Recovery Support (PMID: 33578183)',     sources:'Oysters, beef, pumpkin seeds',     desc:'Critical for immunity and wound healing. Deficiency slows tissue repair.' },
  'Iodine':      { name:'Thyroidal Hormonogenesis (PMID: 28323905)',                 sources:'Seaweed, iodized salt',     desc:'Essential for thyroid function. Low levels cause sluggish metabolism and weight changes.' },
  'Fiber': {
    name: "Gastro-Metabolic Health (PMID: 29099763)",
    desc: "Crucial for glycemic control and lowering systemic inflammation. Low fiber causes digestive sluggishness.",
    sources: "Oats, beans, chia seeds, fruit skins"
  },
  'Protein': {
    name: "Anabolic Recovery & Nitrogen Balance (PMID: 29187311)",
    desc: "Building blocks for all tissue. Deficiency causes muscle wasting and compromised immune response.",
    sources: "Eggs, meat, legumes, Greek yogurt, fish, tofu"
  }
};

export const NUTRIENT_BENEFITS: Record<string, any> = {
  'Fiber': {
    summary: "🏥 Fiber is a systemic metabolic regulator and longevity nutrient.",
    points: [
      "Glycemic Control: Prevents rapid blood sugar spikes by slowing digestion.",
      "Lipid Management: Binds cholesterol in the gut, reducing cardiovascular risk."
    ]
  },
  'Protein': {
    summary: "🏗️ The primary driver of muscle protein synthesis and metabolic flexibility.",
    points: [
      "Muscle Preservation: Maintains lean mass during caloric deficits.",
      "Immune Defense: Essential for the production of antibodies and enzymes."
    ]
  },
  'Complex Carbs': {
    summary: '🚜 Sustained muscular fuel and glycogen replenishment.',
    points: [
      'Steady Fuel: Provides long-lasting energy without the insulin crash.',
      'Glycogen Loading: Required for high-intensity training and endurance.'
    ]
  },
  'Simple (Sugars)': {
    summary: '🚀 Immediate glucose spike for rapid performance.',
    points: [
      'Instant Energy: Absorbs in minutes for emergency fuel needs.',
      'Risk Factor: Excessive intake without activity leads to fat storage.'
    ]
  },
  'Saturated': {
    summary: '🏗️ Essential for hormone levels but requires moderation.',
    points: [
      'Hormonal Support: Necessary for steroid hormone synthesis.',
      'Cell Membrane: Provides structural integrity to cell walls.'
    ]
  },
  'Monounsaturated': {
    summary: '💙 The gold-standard fat for heart health and anti-inflammation.',
    points: [
      'Heart Health: Strongly improves blood lipid profiles.',
      'Insulin Sensitivity: Helps cells process glucose efficiently.'
    ]
  },
  'Polyunsaturated': {
    summary: '🌊 Essential Omega-3 & Omega-6 fatty acids for brain function.',
    points: [
      'Brain Clarity: Omega-3s are vital for cognitive function.',
      'Cell Recovery: Essential for systemic anti-inflammatory signaling.'
    ]
  },
  'Vitamin C': { summary: '🛡️ Collagen & Immunity', points: ['Essential for skin and tissue integrity.', 'Protects cells from damage.'] },
  'Vitamin D': { summary: '☀️ Bone & Immune Hormone', points: ['Regulates 1000+ genes for health.', 'Triggers calcium absorption.'] },
  'Magnesium': { summary: '🧘 Signal & Sleep Regulator', points: ['Master mineral for muscle relaxation.', 'Improves sleep quality.'] },
  'Iron': { summary: '🎈 Oxygen & Vitality Support', points: ['Carries oxygen to your cells.', 'Prevents chronic fatigue.'] },
  'Zinc': { summary: '🛡️ T-Cell & Repair Catalyst', points: ['Triggers heavy immune responses.', 'Essential for protein synthesis.'] },
  'Potassium': { summary: '⚖️ Heart Rhythm & Pressure Control', points: ['Regulates electrical signals for the heart.', 'Counters sodium to lower pressure.'] },
  'Vitamin B12': { summary: '🛰️ Neuro-Protection & Energy', points: ['Protects your nervous system.', 'Prevents brain fog.'] },
  'Calcium': { summary: '🦴 Skeletal Strength', points: ['Primary structural mineral for bones.', 'Critical for muscle signal conductivity.'] },
  'Vitamin A': { summary: '👁️ Vision & Immunity', points: ['Critical for night vision.', 'Keeps skin and immune system healthy.'] },
  'Sodium': { summary: '🧂 Fluid Balance', points: ['Regulates blood volume and pressure.', 'Essential for nerve impulse transmission.'] },
  'Vitamin B6': { summary: '🧠 Mood & Brain Health', points: ['Aids in neurotransmitter production.', 'Supports energy metabolism.'] },
  'Vitamin B1': { summary: '⚡ Carbohydrate Metabolism', points: ['Converts food into usable energy.', 'Supports nervous system health.'] },
  'Vitamin B2': { summary: '🔋 Energy Production', points: ['Essential for ATP production.', 'Supports healthy skin and eyes.'] },
  'Vitamin B3': { summary: '🛡️ Cellular Defense', points: ['Supports DNA repair and skin health.', 'Vital for energy metabolism.'] }
};

export const getNutrientDescriptions = () => NUTRIENT_BENEFITS;