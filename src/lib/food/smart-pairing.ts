/**
 * Smart Pairing Dictionary
 * Maps common ingredients to suggested pairings.
 */
export const SMART_PAIRINGS: Record<string, string[]> = {
  'chicken': ['Rice', 'Broccoli', 'Sweet Potato', 'Spinach', 'Quinoa', 'Asparagus'],
  'beef': ['Potato', 'Carrots', 'Onion', 'Rice', 'Peas', 'Cheese'],
  'eggs': ['Toast', 'Bacon', 'Butter', 'Avocado', 'Cheese', 'Spinach'],
  'salmon': ['Asparagus', 'Lemon', 'Quinoa', 'Brussels Sprouts', 'Rice'],
  'oats': ['Milk', 'Berries', 'Peanut Butter', 'Honey', 'Banana', 'Chia Seeds'],
  'toast': ['Butter', 'Egg', 'Avocado', 'Jam', 'Honey'],
  'rice': ['Chicken', 'Beef', 'Soy Sauce', 'Egg', 'Beans'],
  'pasta': ['Tomato Sauce', 'Cheese', 'Ground Beef', 'Garlic', 'Basil'],
  'yogurt': ['Granola', 'Berries', 'Honey', 'Nuts', 'Banana'],
  'whey': ['Milk', 'Banana', 'Oats', 'Berries', 'Peanut Butter'],
  'avocado': ['Egg', 'Toast', 'Lemon', 'Lime', 'Tomato', 'Cilantro'],
  'spinach': ['Egg', 'Chicken', 'Feta', 'Garlic', 'Onion'],
  'broccoli': ['Chicken', 'Beef', 'Cheese', 'Garlic', 'Rice'],
  'banana': ['Oats', 'Yogurt', 'Peanut Butter', 'Milk', 'Honey'],
  'peanut butter': ['Banana', 'Oats', 'Apple', 'Toast', 'Jam'],
  'apple': ['Peanut Butter', 'Cinnamon', 'Oats', 'Walnuts'],
  'blueberries': ['Oats', 'Yogurt', 'Banana', 'Whey'],
  'strawberry': ['Yogurt', 'Oats', 'Whey', 'Chocolate'],
};

/**
 * Returns suggested pairings based on current ingredients.
 */
export function getPairingSuggestions(currentIngredients: any[]): string[] {
  const suggestions = new Set<string>();
  const currentNames = currentIngredients.map(i => (i.food?.name || '').toLowerCase());

  currentNames.forEach(name => {
    Object.keys(SMART_PAIRINGS).forEach(key => {
      if (name.includes(key)) {
        SMART_PAIRINGS[key].forEach(p => {
          if (!currentNames.some(cn => cn.includes(p.toLowerCase()))) {
            suggestions.add(p);
          }
        });
      }
    });
  });

  return Array.from(suggestions).slice(0, 5);
}
