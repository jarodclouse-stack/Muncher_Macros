export const DEFICIENCY_INFO: Record<string, { name: string; sources: string; desc: string }> = {
  'Vitamin C': { 
    name: 'Scurvy & Collagen Fatigue (PMID: 29099763)', 
    sources: 'Citrus, bell peppers, broccoli, strawberries, kiwi',
    desc: 'Supports collagen synthesis, immune defense, and antioxidant protection. Helps reduce oxidative stress during exercise and improves tissue repair. Deficiency can lead to fatigue, weakened immunity, bleeding gums, and slow wound healing.' 
  },
  'Vitamin B1': { 
    name: 'Beriberi & Metabolic Slump (PMID: 28401095)', 
    sources: 'Pork, sunflower seeds, beans, lentils',
    desc: 'Essential for glucose metabolism and nerve signaling. Fuels brain activity and heart function. Deficiency results in low energy, "brain fog," irritability, and severe nerve damage if left untreated.' 
  },
  'Vitamin B2': { 
    name: 'Ariboflavinosis & Energy Crash (PMID: 27903965)', 
    sources: 'Beef liver, dairy, almonds',
    desc: 'Critical component of FAD/FMN for energy production. Supports cellular respiration and fatty acid breakdown. Deficiency leads to painful mouth sores, light sensitivity, and skin inflammation.' 
  },
  'Vitamin B3': { 
    name: 'Pellagra & DNA Protocol (PMID: 28367323)', 
    sources: 'Tuna, salmon, chicken, peanuts',
    desc: 'Vital for DNA repair and cellular signaling via NAD+. High impact on skin barrier health and brain metabolic efficiency. Deficiency causes dermatitis, digestive distress, and cognitive fatigue.'
  },
  'Vitamin B5': { 
    name: 'Pantothenic Acid Depletion (PMID: 31991823)', 
    sources: 'Chicken liver, sunflower seeds',
    desc: 'Required for coenzyme A (CoA) synthesis to break down fats and carbs. Crucial for hormone production and physical endurance. Lack of B5 leads to fatigue, insomnia, and "burning feet" syndrome.' 
  },
  'Vitamin B6': { 
    name: 'Pyridoxine Neuropathy (PMID: 29023386)', 
    sources: 'Chickpeas, potatoes, tuna',
    desc: 'Synthesizes neurotransmitters like serotonin and dopamine. Regulates sleep, mood, and hemoglobin production. Deficiency causes mood swings, weakened immunity, and poor mental focus during high-stress periods.' 
  },
  'Vitamin B7': { 
    name: 'Biotin & Keratin Synthesis (PMID: 28055028)', 
    sources: 'Egg yolks, liver, salmon',
    desc: 'Metabolizes lipids and amino acids. Directly influences keratin infrastructure for hair, skin, and nail strength. Deficiency leads to brittle hair, scaly skin, and neurological symptoms like lethargy.' 
  },
  'Vitamin B9': { 
    name: 'Folate & Genomic Renewal (PMID: 24376085)', 
    sources: 'Leafy greens, lentils, asparagus',
    desc: 'Drives DNA synthesis and rapid cell division. Essential for red blood cell formation and tissue growth. Low folate causes "megaloblastic anemia," extreme fatigue, and shortness of breath.' 
  },
  'Vitamin B12': { 
    name: 'Cobalamin & Myelin Defense (PMID: 33946251)', 
    sources: 'Beef liver, dairy, eggs, nutritional yeast',
    desc: 'Maintains the myelin sheath around nerves for fast signaling. Critical for DNA production and brain clarity. Deficiency causes permanent nerve tingling, memory loss, and chronic exhaustion.' 
  },
  'Vitamin A': { 
    name: 'Retinoid Ocular Health (PMID: 20200263)', 
    sources: 'Liver, sweet potato, carrots',
    desc: 'Powers vision cycles and epithelial cell differentiation. Essential for night vision and respiratory immune defense. Deficiency leads to "night blindness," dry eyes, and frequent infections.' 
  },
  'Vitamin D': { 
    name: 'Cholecalciferol & Immune State (PMID: 32872303)', 
    sources: 'Salmon, UV mushrooms, sun',
    desc: 'Regulates 1,000+ genes for immune function and calcium absorption. Prevents chronic inflammation and bone softening. Deficiency is linked to bone pain, muscle weakness, and frequent illness.' 
  },
  'Vitamin E': { 
    name: 'Alpha-Tocopherol Protection (PMID: 30987316)', 
    sources: 'Wheat germ, sunflower seeds',
    desc: 'Prevents lipid peroxidation and oxidative damage to cell membranes. Speeds up muscle recovery and protects skin from UV-induced stress. Deficiency leads to muscle damage and vision impairment.' 
  },
  'Vitamin K': { 
    name: 'Phylloquinone & Bone Density (PMID: 30909645)', 
    sources: 'Kale, natto, spinach',
    desc: 'Triggers proteins required for blood clotting and bone mineralization. Helps transport calcium into the skeleton instead of arteries. Low intake causes easy bruising and weakened bone structure.' 
  },
  'Calcium': { 
    name: 'Osteo-Mineralization (PMID: 25856551)', 
    sources: 'Dairy, sardines, tofu, kale',
    desc: 'The building block of bone and teeth. Controls muscle contraction and heartbeat signals. Lack of calcium leads to muscle spasms, bone thinning, and long-term osteoporosis risk.' 
  },
  'Phosphorus': { 
    name: 'ATP & Genomic Integrity (PMID: 29301074)', 
    sources: 'Dairy, meat, legumes',
    desc: 'Works with B vitamins to convert food into ATP (energy). Required for DNA/RNA structure. Deficiency leads to appetite loss, joint pain, and severe muscle weakness.' 
  },
  'Magnesium': { 
    name: 'Enzymatic Conductivity (PMID: 28710195)', 
    sources: 'Pumpkin seeds, almonds, dark chocolate',
    desc: 'Facilitates 300+ biochemical reactions. Regulates muscle relaxation, blood pressure, and sleep cycles. Deficiency causes painful cramps, facial tics, and chronic anxiety or restlessness.' 
  },
  'Sodium': { 
    name: 'Extracellular Osmolarity (PMID: 28403157)', 
    sources: 'Salt, seaweed',
    desc: 'Controls extracellular fluid volume and nerve impulses. Essential for physical performance and hydration. Low sodium (hyponatremia) causes headaches, nausea, and confusion.' 
  },
  'Potassium': { 
    name: 'Intracellular Pressure (PMID: 29477388)', 
    sources: 'Bananas, potatoes, coconut water',
    desc: 'Essential for heart rhythm and countering high sodium levels. Regulates normal blood pressure and muscle signaling. Deficiency leads to muscle paralysis, bloating, and irregular heartbeats.' 
  },
  'Iron': { 
    name: 'Hemoglobin & Oxygenation (PMID: 24778671)', 
    sources: 'Red meat, lentils, spinach',
    desc: 'Core component of hemoglobin which carries oxygen. Powers energy levels and thermoregulation. Deficiency is the #1 cause of fatigue, cold hands, and reduced exercise capacity.' 
  },
  'Zinc': { 
    name: 'Immune & Recovery Catalyst (PMID: 33578183)', 
    sources: 'Oysters, beef, pumpkin seeds',
    desc: 'Critical for T-cell function and wound healing. Drives protein synthesis and testosterone levels. Deficiency slows down tissue repair, stunts growth, and weakens immune defense.' 
  },
  'Iodine': { 
    name: 'Thyroidal Hormonogenesis (PMID: 28323905)', 
    sources: 'Seaweed, iodized salt',
    desc: 'Required for thyroid hormones (T3/T4) which regulate metabolism. Critical for cognitive development and energy. Lack of iodine leads to weight gain, goiter, and extreme lethargy.' 
  },
  'Fiber': {
    name: "Gastro-Metabolic Health (PMID: 29099763)",
    sources: "Oats, beans, chia seeds, fruit skins",
    desc: "Controls blood sugar response and feeds beneficial gut bacteria. Regulates lipid profiles and prevents systemic inflammation. Low fiber leads to digestive sluggishness and insulin spikes."
  },
  'Protein': {
    name: "Amino Recovery Protocol (PMID: 29187311)",
    sources: "Eggs, meat, legumes, Greek yogurt, fish, tofu",
    desc: "Provides essential amino acids for tissue repair and enzyme production. The primary driver of lean muscle growth and immune defense. Deficiency causes muscle wasting and fatigue."
  }
};

export const NUTRIENT_BENEFITS: Record<string, { summary: string; points: string[] }> = {
  'Fiber': {
    summary: "🏥 Systemic metabolic regulator and longevity nutrient.",
    points: [
      "Glycemic Control: Prevents rapid blood sugar spikes by slowing digestion.",
      "Lipid Management: Binds cholesterol in the gut, reducing cardiovascular risk.",
      "Microbiome Fuel: Feeds beneficial gut bacteria to support systemic immunity.",
      "Appetite Regulation: Increases satiety signaling to the brain (GLP-1 pathway).",
      "Digestive Transit: Optimizes intestinal motility and prevents toxin reabsorption."
    ]
  },
  'Protein': {
    summary: "🏗️ Primary driver of muscle protein synthesis and metabolic flexibility.",
    points: [
      "Muscle Preservation: Maintains lean mass even during caloric deficits.",
      "Enzyme Production: Essential for the creation of all metabolic enzymes.",
      "Immune Defense: Building blocks for antibodies and critical for repair.",
      "Structural Integrity: Forms the collagen matrix for skin, hair, and connective tissue.",
      "Thermic Effect: Increases metabolic rate by requiring more energy to digest than fats/carbs."
    ]
  },
  'Complex Carbs': {
    summary: '🚜 Sustained muscular fuel and glycogen replenishment.',
    points: [
      'Steady Fuel: Provides long-lasting energy without the insulin crash.',
      'Glycogen Loading: Required for high-intensity training and endurance caps.',
      'Satiety: Keeps you full longer compared to simple sugar sources.',
      'Fiber Synergies: Often bundled with essential prebiotics for gut health.',
      'Brain Glucose: Provides the primary stable fuel source for cognitive focus.'
    ]
  },
  'Simple (Sugars)': {
    summary: '🚀 Immediate glucose spike for rapid performance needs.',
    points: [
      'Instant Energy: Absorbs in minutes for high-output physical demands.',
      'Glycemic Hit: Use strategically around workouts for peak power.',
      'Risk Factor: High intake without activity triggers fat storage.',
      'Brain Reward: Can trigger dopamine release; use with precision and caution.'
    ]
  },
  'Saturated': {
    summary: '🏗️ Essential for hormone levels but requires moderate intake.',
    points: [
      'Hormonal Support: Base material for steroid hormone synthesis.',
      'Cell Membrane: Provides structural integrity and rigidity to cell walls.',
      'Flavor Profile: Increases satiety and carries fat-soluble vitamins.',
      'Heat Stability: Resistant to oxidation during high-heat cooking.'
    ]
  },
  'Monounsaturated': {
    summary: '💙 The gold-standard fat for heart health and anti-inflammation.',
    points: [
      'Heart Health: Strongly improves blood lipid and HDL/LDL profiles.',
      'Insulin Sensitivity: Helps cells process glucose more efficiently.',
      'Systemic Calm: Reduces markers of long-term cellular inflammation.',
      'Vessel Integrity: Maintains the elasticity of the arterial walls.'
    ]
  },
  'Polyunsaturated': {
    summary: '🌊 Essential Omega-3 & Omega-6 fatty acids for systemic health.',
    points: [
      'Brain Clarity: Omega-3s (DHA/EPA) are vital for cognitive function.',
      'Anti-Inflammatory: Regulates recovery signaling after heavy exercise.',
      'Cell Signaling: Critical for healthy communication between cells.',
      'Skin Barrier: Maintains moisture and prevents trans-epidermal water loss.'
    ]
  },
  'Vitamin C': {
    summary: '🛡️ Collagen & Immunity Protocol',
    points: [
      'Collagen Synthesis: Critical for hydroxyproline production for skin/joints.',
      'Antioxidant Shield: Neutralizes free radicals generated during intense training.',
      'Immune Training: Enhances neutrophil and lymphocyte motility.',
      'Iron Absorption: Dramatically increases the uptake of non-heme (plant) iron.',
      'Adrenal Support: High concentrations found in adrenal glands to manage stress.'
    ]
  },
  'Vitamin D': {
    summary: '☀️ Bone & Immune Master Hormone',
    points: [
      'Calcium Transport: Enables the gut to absorb calcium into the bloodstream.',
      'Gene Modulation: Regulates over 1,000 different genes in human tissue.',
      'Immune Sentinel: Activates the "killer" T-cells to identify pathogens.',
      'Mood Regulation: Linked to serotonin synthesis and Seasonal Affective Disorder.',
      'Muscular Power: Low D levels are correlated with reduced explosive strength.'
    ]
  },
  'Magnesium': {
    summary: '🧘 Signal & Sleep Conductivity',
    points: [
      'ATP Transfer: The "spark plug" that releases energy from ATP molecules.',
      'Nervous System: Blocks NMDA receptors to lower systemic "noise" and anxiety.',
      'Muscle Relaxation: Acts as a natural calcium channel blocker to prevent cramps.',
      'Blood Pressure: Relaxes the walls of blood vessels for better circulation.',
      'Sleep Quality: Regulates melatonin production and GABA signaling.'
    ]
  },
  'Iron': {
    summary: '🎈 Oxygenation & Vitality Surge',
    points: [
      'Heme Delivery: Central atom of hemoglobin for systemic oxygen transport.',
      'Brain Energy: Required for the synthesis of myelin and neurotransmitters.',
      'Metabolic Rate: Essential for thyroid peroxidase and calorie burning.',
      'Immune Function: Powers the enzymes that destroy bacteria and viruses.'
    ]
  },
  'Zinc': {
    summary: '🛡️ T-Cell & Genomic Repair',
    points: [
      'DNA Integrity: Component of "zinc finger" proteins that repair code.',
      'Immune Catalyst: Drives the maturation of the thymus and T-lymphocytes.',
      'Testosterone Support: Essential for male reproductive health and hormones.',
      'Protein Synthesis: Required for muscle repair following micro-tears.',
      'Sense Profile: Critical for maintaining acute taste and smell sensitivity.'
    ]
  },
  'Potassium': {
    summary: '⚖️ Cardiac Pulse & Pressure Control',
    points: [
      'Sodium Balance: Actively pumps sodium out of cells to reduce water retention.',
      'Electrical Signal: Conducts the electrical impulses that trigger heartbeats.',
      'Blood Pressure: Relaxes arterial walls to prevent hypertension.',
      'Kidney Health: Protects against the formation of calcium oxalate stones.',
      'Nerve Firing: Essential for restoring the membrane potential after a signal.'
    ]
  },
  'Vitamin B12': {
    summary: '🛰️ Neuro-Clarity & Nerve Defense',
    points: [
      'Myelin Sheath: Insulates nerve fibers for fast and accurate signaling.',
      'DNA Protocol: Acts as a cofactor for DNA synthesis in every single cell.',
      'Red Blood Cells: Prevents megaloblastic anemia and ensures oxygen flow.',
      'Brain Longevity: Linked to slower rates of age-related brain atrophy.',
      'Homocysteine: Lowers levels to protect the heart and vascular system.'
    ]
  },
  'Calcium': {
    summary: '🦴 Structural Integrity Hub',
    points: [
      'Bone Reservoir: Provides the mineral matrix for skeletal strength.',
      'Muscular Trigger: The signal that causes actin and myosin to contract.',
      'Blood Clotting: Plays a vital role in the coagulation cascade.',
      'Nerve Conduction: Triggers the release of neurotransmitters at synapses.',
      'Enzyme Activation: Works as a co-factor for various metabolic enzymes.'
    ]
  },
  'Vitamin A': {
    summary: '👁️ Ocular & Barrier Immunity',
    points: [
      'Retinal Cycle: Regenerates the visual pigments needed for low-light vision.',
      'Epithelial Health: Maintains the "first line of defense" in skin and lungs.',
      'Stem Cell Signal: Directs the differentiation of cells into specific tissues.',
      'Antioxidant: Protects lipids from oxidative damage in high-oxygen tissue.',
      'Skeletal Growth: Supports bone remodeling and osteoblast activity.'
    ]
  },
  'Sodium': {
    summary: '🧂 Hydration & Signal Osmolarity',
    points: [
      'Fluid Balance: The primary driver of extracellular fluid and hydration.',
      'Muscle Action: Generates the electrical charge needed for contraction.',
      'Nutrient Uptake: Drives the transport of glucose and amino acids into cells.',
      'Nerve Pulse: Required for the rapid depolarization of nerve membranes.'
    ]
  },
  'Vitamin B6': {
    summary: '🧠 Mood & Hormone Balance',
    points: [
      'Neuro-Chemistry: Essential for creating serotonin, dopamine, and GABA.',
      'Heme Production: Required for the first step of hemoglobin synthesis.',
      'Gluconeogenesis: Helps convert stored proteins into glucose for energy.',
      'Anticipatory Stress: Regulates the body\'s response to psychological stress.'
    ]
  },
  'Vitamin B1': {
    summary: '⚡ Energy & Nerve Catalyst',
    points: [
      'Energy Conversion: Converts pyruvate into acetyl-CoA for the Krebs cycle.',
      'Heart Rhythm: Supports the high energy demands of cardiac tissue.',
      'Nerve Conduct: Protective role in the development of the nervous system.',
      'Brain Energy: Essential for glucose metabolism in the cerebral cortex.'
    ]
  },
  'Vitamin B2': {
    summary: '🔋 Cellular Respiration Core',
    points: [
      'FAD/FMN Energy: Core component of flavoproteins for energy capture.',
      'Antioxidant Power: Required for the recycling of glutathione.',
      'Iron Metabolism: Essential for iron processing and hemoglobin health.',
      'Eye Health: Protects the lens of the eye from oxidative clouding.'
    ]
  },
  'Vitamin B3': {
    summary: '🛡️ Lipid & DNA Repair',
    points: [
      'NAD+ Protocol: Critical for the longevity and energy signaling molecule NAD+.',
      'Genomic Repair: Activates PARP enzymes to repair damaged DNA sequences.',
      'Fatty Acid Flux: Regulates the breakdown and synthesis of essential fats.',
      'Mental Focus: Supports brain health by preventing metabolic exhaustion.'
    ]
  }
};

export const getNutrientDescriptions = () => NUTRIENT_BENEFITS;