import * as z from 'zod';

export const codeExplanationSchema = z.object({
  programmingLanguage: z.string().min(1, {
    message: 'プログラミング言語または製品名を入力してください',
  }),
  code: z.string().min(1, {
    message: 'コードを入力してください',
  }),
});

export type CodeExplanationSchema = z.infer<typeof codeExplanationSchema>;
