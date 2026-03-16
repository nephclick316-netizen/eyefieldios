export const hapticImpact = async (style: any = 'light') => {
  // Browser haptics (vibrate) is inconsistently supported and often requires user interaction
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};

export const hapticSuccess = async () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([10, 30, 10]);
  }
};

export const hapticSelection = async () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(5);
  }
};