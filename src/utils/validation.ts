export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRecipeTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'Recipe title is required';
  }
  if (title.length > 200) {
    return 'Recipe title is too long';
  }
  return null;
};

export const validateIngredient = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Ingredient name is required';
  }
  return null;
};

export const validateInstruction = (text: string): string | null => {
  if (!text || text.trim().length === 0) {
    return 'Instruction text is required';
  }
  if (text.length < 10) {
    return 'Instruction is too short';
  }
  return null;
};
