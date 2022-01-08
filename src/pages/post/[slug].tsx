import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function readingTime() {
    const totalWords = post.data.content.reduce((acc, value) => {
      const words = RichText.asText(value.body).split(/[\w-]+/);
      return acc + words.length;
    }, 0);
    const timeReading = Math.ceil(totalWords / 200);
    return timeReading;
  }
  const minutesToRead = readingTime();

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <Header />
        <article className={styles.post}>
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt="Banner" />
          </div>
          <div className={styles.postHeader}>
            <h1>{post.data.title}</h1>
            <div className={commonStyles.postInfo}>
              <time>
                <img src="/calendar.svg" alt="Data" />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
              <span>
                <img src="/user.svg" alt="Autor" />
                {post.data.author}
              </span>
              <span>
                <img src="/clock.svg" alt="Relogio" />
                {minutesToRead} min
              </span>
            </div>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(postData => {
              return (
                <section key={postData.heading}>
                  <h2>{postData.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(postData.body),
                    }}
                  />
                </section>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
      pageSize: 4,
    }
  );

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
