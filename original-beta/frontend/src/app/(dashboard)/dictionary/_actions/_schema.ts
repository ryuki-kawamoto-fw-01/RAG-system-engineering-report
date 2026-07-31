import { z } from 'zod';
import { dictionaryContainer } from '../../../../../cosmos';

const MAX_STRING_LENGTH = 255;
const MAX_TEXT_LENGTH = 1000;
const MAX_TERM = 10;

export const dictionarySchema = z
  .object({
    id: z.string(),
    uniform_name: z
      .string()
      .min(1, {
        message: '統一名称を入力してください',
      })
      .max(MAX_STRING_LENGTH, {
        message: `統一名称は${MAX_STRING_LENGTH}文字以内で入力してください`,
      }),
    category: z.string().min(1, {
      message: 'カテゴリーを選択してください',
    }),
    terms: z
      .custom<string[]>()
      .transform((terms) => terms.filter((term) => term.trim() !== ''))
      .superRefine((terms, ctx) => {
        if (terms.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '用語は1つ以上登録してください',
          });
          return;
        }

        if (terms.length > MAX_TERM) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `登録できる用語は${MAX_TERM}個までです`,
          });
          return;
        }

        const uniqueTerms = new Set(terms);
        if (uniqueTerms.size !== terms.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '用語が重複しています',
          });
        }

        terms.forEach((term) => {
          if (term.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '用語を入力してください',
            });
            return;
          }

          if (term.length > MAX_STRING_LENGTH) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `用語は${MAX_STRING_LENGTH}文字以内で入力してください`,
            });
            return;
          }
        });
      }),
    description: z
      .string()
      .min(1, {
        message: '説明を入力してください',
      })
      .max(MAX_TEXT_LENGTH, {
        message: `説明は${MAX_TEXT_LENGTH}文字以内で入力してください`,
      }),
  })
  .superRefine(async (values, ctx) => {
    const { resources: existingDictionaries } = await dictionaryContainer.items
      .query({
        query:
          'SELECT * FROM c WHERE c.uniform_name = @uniformName AND c.id != @id AND NOT IS_DEFINED(c.deletedAt)',
        parameters: [
          { name: '@uniformName', value: values.uniform_name },
          { name: '@id', value: values.id },
        ],
      })
      .fetchAll();

    if (existingDictionaries.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['uniform_name'],
        message: 'この統一名称は既に使用されています',
      });
    }
  });
