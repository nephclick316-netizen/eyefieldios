import { profileService } from './profileService';
import { statsService } from './statsService';
import { followService } from './followService';
import { storageService } from './storageService';
import { pulseService } from './pulseService';
import { echoService } from './echoService';
import { productService } from './productService';

export const dataService = {
  ...profileService,
  ...statsService,
  ...followService,
  ...storageService,
  ...pulseService,
  ...echoService,
  ...productService,
};