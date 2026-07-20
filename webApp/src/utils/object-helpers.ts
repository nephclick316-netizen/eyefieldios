"use client";

import { assignWith } from 'lodash';

/**
 * Custom assigner for assignWith that prioritizes non-null/non-undefined values
 * during object merging.
 */
const customAssigner = (objValue: any, srcValue: any) => {
  if (srcValue === undefined || srcValue === null) {
    return objValue;
  }
  return srcValue;
};

/**
 * Safely merges source objects into a target object using custom logic.
 * This ensures that existing data isn't overwritten by null or undefined values.
 */
export const safeMerge = (target: any, ...sources: any[]) => {
  return sources.reduce((acc, source) => {
    return assignWith(acc, source, customAssigner);
  }, target);
};

export default safeMerge;