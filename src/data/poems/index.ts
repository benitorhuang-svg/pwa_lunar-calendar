export * from './types';
export { SPRING_POEMS } from './spring';
export { SUMMER_POEMS } from './summer';
export { AUTUMN_POEMS } from './autumn';
export { WINTER_POEMS } from './winter';
export { GENERAL_POEMS } from './general';

import { SPRING_POEMS } from './spring';
import { SUMMER_POEMS } from './summer';
import { AUTUMN_POEMS } from './autumn';
import { WINTER_POEMS } from './winter';
import { GENERAL_POEMS } from './general';
import type { Poem } from './types';

export const POEMS: Poem[] = [
    ...SPRING_POEMS,
    ...SUMMER_POEMS,
    ...AUTUMN_POEMS,
    ...WINTER_POEMS,
    ...GENERAL_POEMS,
];
