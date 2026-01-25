import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return rss({
    title: 'Blog - Horas Líquidas',
    description: 'Dicas de produtividade, técnicas de estudo e como aproveitar melhor seu tempo de foco.',
    site: context.site || 'https://horasliquidas.com',
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
        author: post.data.author,
      })),
    customData: `<language>pt-BR</language>`,
  });
}
