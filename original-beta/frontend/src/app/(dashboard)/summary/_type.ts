import { z } from 'zod';
import { summarySchema } from './_utils/schema';

export type SummaryErrors = z.inferFlattenedErrors<typeof summarySchema>['fieldErrors'];
