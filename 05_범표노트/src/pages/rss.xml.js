import rss from '@astrojs/rss';
import { getPublicPosts } from '../lib/posts';

export async function GET(context) {
  const posts = await getPublicPosts();
  return rss({
    title: '범표원두 노트',
    description: '범표원두가 20년째 커피를 볶으며 쓰는 노트.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? post.data.title,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: [post.data.category],
    })),
    customData: `<language>ko</language>`,
  });
}
