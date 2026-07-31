import { z } from 'zod';
import { productionTechListSchema } from './_utils/schema';

export type ProductionTechListErrors = z.inferFlattenedErrors<
  typeof productionTechListSchema
>['fieldErrors'];
