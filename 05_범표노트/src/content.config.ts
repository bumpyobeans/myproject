import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  // `_`로 시작하는 파일(예: _템플릿.md)은 글로 취급하지 않음
  loader: glob({ pattern: ['*.md', '!_*.md'], base: './src/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum([
      '커피 수다',
      '가맹점 이야기',
      '입점 이야기',
      '프로젝트 이야기',
      '일기',
    ]),
    // 기본값 true: 별도로 지정하지 않으면 공개 글
    public: z.boolean().default(true),
    description: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
