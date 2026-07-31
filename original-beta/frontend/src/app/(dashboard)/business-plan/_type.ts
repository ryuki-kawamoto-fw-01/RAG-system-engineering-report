import { z } from 'zod';
import { businessPlanSchema } from './_utils/schema';

export type BusinessPlanErrors = z.inferFlattenedErrors<typeof businessPlanSchema>['fieldErrors'];
