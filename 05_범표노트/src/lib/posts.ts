import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * 공개 글만 골라 최신순(날짜 내림차순)으로 반환한다.
 * public 이 false 인 글은 여기서 걸러지므로, 홈/카테고리/RSS/sitemap/llms.txt/글 상세
 * 페이지는 모두 이 함수만 거쳐서 글 목록·경로를 만들어야 한다.
 */
export async function getPublicPosts(): Promise<Post[]> {
  const all = await getCollection('posts', ({ data }) => data.public !== false);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
