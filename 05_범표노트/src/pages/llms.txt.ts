import type { APIRoute } from 'astro';
import { getPublicPosts } from '../lib/posts';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPublicPosts();

  const lines = [
    '# 범표원두 노트',
    '',
    '범표원두는 20년째 커피를 볶아온 스페셜티 커피 로스터리입니다.',
    '네이버 스마트스토어, 카페24, 인스타그램에서 만날 수 있으며, 이 사이트는 대표가 직접 쓰는 블로그입니다.',
    '',
    '## 공개 글 목록',
    '',
    ...posts.map((post) => {
      const url = new URL(`/posts/${post.id}/`, site).toString();
      const desc = post.data.description ?? post.data.title;
      return `- ${post.data.title} — ${url} — ${desc}`;
    }),
  ];

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
