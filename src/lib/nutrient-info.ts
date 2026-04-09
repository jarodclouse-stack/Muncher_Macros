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
  'Vitamin C': {
    summary: '🛡️ Collagen & Tissue Repair Protocol',
    points: [
      'Collagen Synthesis: Essential cofactor for prolyl hydroxylase in skin and joint repair.',
      'Antioxidant Shield: Neutralizes superoxide and hydroxyl radicals during metabolic stress.',
      'Immune Training: Highly concentrated in leukocytes to drive phagocytic activity.',
      'Catecholamine Synthesis: Required for the conversion of dopamine to norepinephrine.',
      'Iron Bioavailability: Reduces non-heme iron to the ferrous state for optimal absorption.'
    ]
  },
  'Vitamin D': {
    summary: '☀️ Steroid Hormone & Immune Sentinel',
    points: [
      'VDR Support: Binds to Vitamin D Receptors (VDR) to regulate 1,000+ gene sequences.',
      'Calcium Partitioning: Calcitriol signals the gut to upregulate calcium binding proteins.',
      'T-Cell Activation: Converts naive T-cells into "active" killers of intracellular pathogens.',
      'Muscle Fiber Size: Linked to the maintenance of Type II (fast-twitch) muscle fibers.',
      'Cardiovascular Health: Regulates the Renin-Angiotensin system for blood pressure control.'
    ]
  },
  'Magnesium': {
    summary: '🧘 Neuromuscular Conductivity Catalyst',
    points: [
      'ATP Kinase: Required for the stability and activation of every ATP-dependent enzyme.',
      'GABA Agonist: Binds to GABA receptors to lower CNS excitability and improve sleep.',
      'Ion Channel Gate: Regulates calcium and potassium flux across cell membranes.',
      'Blood Sugar Control: Directly influences insulin receptor sensitivity and glucose flux.',
      'Structural Mineral: 60% of systemic magnesium is stored in the bone mineral matrix.'
    ]
  },
  'Iron': {
    summary: '🎈 Heme-Delivery & Mitochondrial Respiration',
    points: [
      'Hemoglobin Core: The central functional unit of red blood cells for oxygen transport.',
      'Myoglobin Storage: Facilitates oxygen diffusion into myocyte mitochondria during load.',
      'ETC Complex: Essential component of cytochromes for oxidative phosphorylation.',
      'DNA Synthesis: Serves as a cofactor for ribonucleotide reductase during cell division.',
      'Thermoregulation: Vital for thyroidal activity and maintaining core body temperature.'
    ]
  },
  'Zinc': {
    summary: '🛡️ Genomic Repair & Hormonal Catalyst',
    points: [
      'Zinc Fingers: Structural component of DNA-binding proteins that direct genetic repair.',
      'Thymic Hormone: Critical for the biological activity of thymulin (T-cell maturation).',
      'Aromatase Context: Helps maintain healthy testosterone-to-estrogen ratios.',
      'Superoxide Dismutase (SOD): Vital for neutralizing superoxide radicals in the cytosol.',
      'Protein Translation: Drives the ribosomal activity needed for muscle tissue synthesis.'
    ]
  },
  'Potassium': {
    summary: '⚖️ Cardiac Potential & Intracellular Balance',
    points: [
      'Membrane Re-Polarization: Critical for the "reset" phase of muscle and nerve signals.',
      'Na+/K+ Pump: Actively drives sodium out of cells to prevent edema and hypertension.',
      'Aldosterone Escape: Counteracts the blood-pressure raising effects of high sodium intake.',
      'Glycogen Synthesis: Increases the rate of glucose conversion to stored glycogen.',
      'Renal Protection: High intake reduces the risk of kidney stone formation (calcium stones).'
    ]
  },
  'Vitamin B12': {
    summary: '🛰️ Neuro-Protection & One-Carbon Flux',
    points: [
      'Myelin Integrity: Required for the synthesis of the fatty sheath around nerve fibers.',
      'Methionine Cycle: Converts homocysteine to methionine to protect the vascular walls.',
      'Hematopoiesis: Drives the maturation of red blood cells in the bone marrow.',
      'Cognitive Speed: High B12 status is correlated with faster information processing.',
      'SAMe Synthesis: Essential for the production of SAMe, the body\'s main methyl donor.'
    ]
  },
  'Calcium': {
    summary: '🦴 Skeletal Matrix & Signal Trigger',
    points: [
      'Hydroxyapatite Flux: Maintains the mineral "bank" needed for dense bone tissue.',
      'Troponin Activation: The specific trigger that allows muscle fibers to contract.',
      'Neurotransmission: Triggers the exocytosis of neurotransmitters at the synapse.',
      'Coagulation Cascade: Factor IV in the blood clotting process for wound closure.',
      'Secondary Messenger: Coordinates intracellular signaling for hormones and enzymes.'
    ]
  },
  'Vitamin A': {
    summary: '👁️ Retinoid Shield & Genetic Differentiation',
    points: [
      'Rhodopsin Cycle: Regenerates visual pigments needed for scotopic (low-light) vision.',
      'Epithelial Defense: Prevents keratinization of mucous membranes (skin/lung health).',
      'Stem Cell Signal: Directs the fate of stem cells into specific specialized tissues.',
      'T-Cell Homing: Influences the movement of immune cells to the gut and lungs.',
      'Antioxidant Function: Quenches singlet oxygen and protects cell membrane lipids.'
    ]
  },
  'Sodium': {
    summary: '🧂 Osmotic Pressure & Signal Potential',
    points: [
      'Action Potential: The primary ion responsible for the "upstroke" of nerve signals.',
      'Blood Volume: Controls the amount of water retained in the circulatory system.',
      'SGLT-1 Transport: Required for the active transport of glucose into the intestines.',
      'Extracellular Base: Maintains the principal cation balance of interstitial fluid.',
      'Hydration Status: Directly dictates the thirst signal and systemic water balance.'
    ]
  },
  'Vitamin B1': {
    summary: '⚡ Pyruvate Flux & Mitochondrial Ignition',
    points: [
      'TDP Cofactor: Required for pyruvate dehydrogenase to extract energy from carbs.',
      'BCAAs Metabolism: Essential for breaking down branched-chain amino acids (leucine).',
      'Neurotransmission: Supports the synthesis of acetylcholine for muscle control.',
      'Pentose Pathway: Essential for creating the pentose sugars used in DNA and RNA.'
    ]
  },
  'Vitamin B2': {
    summary: '🔋 FAD Energy Capture & Redox Balance',
    points: [
      'FAD Synthesis: Transports high-energy electrons to the mitochondrial ETC.',
      'Glutathione Recycling: Required for glutathione reductase to fight oxidative stress.',
      'B6/Folate Support: Essential for activating other B-vitamins into their final forms.',
      'Lipid Breakdown: Drives the beta-oxidation of fatty acids for cellular fuel.'
    ]
  },
  'Vitamin B3': {
    summary: '🛡️ NAD+ Fuel & Genomic Integrity',
    points: [
      'NAD+/NADP+ Catalyst: The primary molecule for 200+ redox energy reactions.',
      'Sirtuin Activation: Powers the "longevity" proteins that repair cellular damage.',
      'Skin Barrier: Boosts ceramide production for extreme moisture and defense.',
      'Lipid Profile: High dosages can improve HDL-C and lower triglyceride levels.'
    ]
  },
  'Vitamin B5 (Pantothenic Acid)': {
    summary: '🚜 Coenzyme A & Steroid synthesis',
    points: [
      'CoA Production: The gateway molecule for carb, fat, and protein metabolism.',
      'Adrenal Support: Essential fuel for the production of cortisol and stress hormones.',
      'Heme Synthesis: Required for the creation of porphyrin in red blood cells.',
      'Fatty Acid Flux: Drives the creation of sphingolipids for healthy nerve cells.'
    ]
  },
  'Vitamin B6': {
    summary: '🧠 Neuro-Synthesis & Heme Creation',
    points: [
      'Amine Transfer: Required to create serotonin, dopamine, and norepinephrine.',
      'Glycogenolysis: The key to unlocking stored muscle glycogen during exercise.',
      'Heme Production: Directly triggers the incorporation of iron into hemoglobin.',
      'Fluid Balance: Helps regulate sodium/potassium levels across cell membranes.'
    ]
  },
  'Vitamin B7 (Biotin)': {
    summary: '💅 Carbon Selection & Keratin Flux',
    points: [
      'Gluconeogenesis: A vital cofactor for enzymes that create glucose from protein.',
      'Lipid Synthesis: Drives the creation of fatty acids for skin and brain health.',
      'Keratin Infrastructure: Directly enhances the structural integrity of hair/nails.',
      'Epigenetic Control: Plays a role in histone biotinylation for gene expression.'
    ]
  },
  'Vitamin B9 (Folate)': {
    summary: '🧬 DNA Methylation & Genomic Renewal',
    points: [
      'Nucleotide Synthesis: Required for create the "building blocks" of DNA and RNA.',
      'One-Carbon Metabolism: Vital for cellular division and rapid tissue growth.',
      'Neural Development: Prevents major defects and supports brain signaling.',
      'Vascular Health: Regulates homocysteine to prevent arterial inflammation.'
    ]
  },
  'Vitamin E': {
    summary: '🛡️ Non-Polar Anti-Oxidation Shield',
    points: [
      'Lipid Protection: Prevents oxidative rancidity of fats within cell membranes.',
      'Vascular Elasticity: Prevents the oxidation of LDL to protect heart health.',
      'Immune Maintenance: Protects the delicate membranes of immune cells.',
      'Muscle Recovery: Reduces damage to myocytes after intense resistance load.'
    ]
  },
  'Vitamin K': {
    summary: '🦴 Coagulation & Mineral Partitioning',
    points: [
      'Coagulation Cascade: Triggers the conversion of prothrombin to thrombin.',
      'Gla-Protein Flux: Activates Osteocalcin to bind calcium into the bone matrix.',
      'Arterial Defense: Prevents calcium from depositing in soft tissue and arteries.',
      'Insulin Sensitivity: Emerging evidence links K-status to better glucose control.'
    ]
  },
  'Phosphorus': {
    summary: '🔋 ATP Mineral & Structural Base',
    points: [
      'Phosphorylation: The fundamental mechanism for "activating" protein enzymes.',
      'Hydroxyapatite Matrix: Works with calcium to provide 90% of bone strength.',
      'Cell Membrane: The primary component of phospholipid bilayers in every cell.',
      'Acid-Base Buffer: Maintains blood pH levels during intense lactic acid buildup.'
    ]
  },
  'Chloride': {
    summary: '🌊 Hydrochloric Acid & pH Balance',
    points: [
      'Digestive Acid: The "Cl" in HCl—required for stomach acid and protein breakdown.',
      'Anion Gap: Maintains electrical neutrality and osmotic pressure in fluids.',
      'CO2 Transport: Facilitates the "chloride shift" to remove carbon dioxide.',
      'Muscle Signaling: Regulates cell volume and membrane potential in nerve cells.'
    ]
  },
  'Iodine': {
    summary: '🔥 Thyroidal BMR Ignition',
    points: [
      'T3/T4 Synthesis: The only biological use for iodine is thyroid hormone creation.',
      'Metabolic Rate: Directly dictates the speed at which you burn calories.',
      'Cognitive Development: High impact on brain maturational speed and IQ.',
      'Apoptosis Control: Helps the body clear damaged or unnecessary cells.'
    ]
  },
  'Copper': {
    summary: '⚡ Electron Flux & Collagen Cross-Linking',
    points: [
      'Cytochrome C Type: Drives the final step of the mitochondrial ETC for energy.',
      'Lysyl Oxidase: Essential for cross-linking collagen/elastin for joint strength.',
      'Iron Processing: Required for ferroxidase to release stored iron into the blood.',
      'Melanin Synthesis: Necessary for the production of skin and hair pigments.'
    ]
  },
  'Selenium': {
    summary: '🛑 Selenoprotein Antioxidant Defense',
    points: [
      'Glutathione Peroxidase: The body\'s primary engine for flushing toxins.',
      'Thyroid Conversion: Required to convert inactive T4 into the active T3 hormone.',
      'Immune Regulation: Reduces the excessive inflammation of a runaway immune system.',
      'DNA Protection: Acts as a "firewall" against oxidative damage to the genome.'
    ]
  },
  'Manganese': {
    summary: '🦴 Enzyme Activator & Glycan Flux',
    points: [
      'SOD-2 Activation: Key cofactor for the manganese-dependent SOD in mitochondria.',
      'Bone Cartilage: Drives the enzymes that create proteoglycans for joints.',
      'Metabolism: Supports gluconeogenesis and amino acid nitrogen disposal.',
      'Wound Recovery: Potentiates the early stages of the tissue healing response.'
    ]
  },
  'Chromium': {
    summary: '🔑 Insulin Receptor Sensitizer',
    points: [
      'Glucose Tolerance: Enhances the binding of insulin to its cell receptors.',
      'Carb Metabolism: Optimizes the clearing of glucose from the bloodstream.',
      'Cravings Control: High status is linked to better appetite and hunger control.',
      'Lipid Flux: Supports the healthy clearance of fats from the blood.'
    ]
  },
  'Molybdenum': {
    summary: '🧪 Sulfur Amino Acid Metabolism',
    points: [
      'Sulfite Oxidase: Crucial for converting reactive sulfites into harmless sulfates.',
      'Xanthine Oxidase: Breaks down nucleotides into uric acid for safe excretion.',
      'Aldehyde Oxidase: Detoxifies various drugs and toxins in the liver.',
      'Enzyme Cofactor: Part of the "Moco" cofactor needed for metabolic health.'
    ]
  },
  'Fluoride': {
    summary: '🛡️ Enamel Matrix Reinforcement',
    points: [
      'Fluoroapatite: Integrates into tooth enamel to make it resistant to acid.',
      'Remineralization: Accelerates the repair of micro-porosity in teeth.',
      'Antibacterial: Interferes with the metabolism of plaque-causing bacteria.',
      'Skeletal Stability: Can influence the rate of bone mineral density flux.'
    ]
  }
};

export const getNutrientDescriptions = () => NUTRIENT_BENEFITS;