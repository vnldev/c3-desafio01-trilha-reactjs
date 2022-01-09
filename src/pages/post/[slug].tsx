/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

import Link from 'next/link';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  nextPost: {
    uid: string | null;
    data: {
      title: string;
    };
  };
  prevPost: {
    uid: string | null;
    data: {
      title: string;
    };
  };
  preview: boolean;
}

export default function Post({
  post,
  nextPost,
  prevPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function readingTime(): number {
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
            <span className={styles.editedAt}>
              * editado em
              {format(
                new Date(post.last_publication_date),
                `dd MMM yyyy, 'às' HH:mm`,
                {
                  locale: ptBR,
                }
              )}
            </span>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(postData => (
              <section key={postData.heading}>
                <h2>{postData.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(postData.body),
                  }}
                />
              </section>
            ))}
          </div>
          <footer className={styles.postFooter}>
            {prevPost && (
              <div>
                <span>{prevPost.data.title}</span>
                <Link href={`/post/${prevPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {nextPost && (
              <div>
                <span>{nextPost.data.title}</span>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}
          </footer>
          <Comments />
          {preview && (
            <aside className={commonStyles.previewButton}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
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

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
  params,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevpostResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextpostResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response?.id,
      orderings: '[document.first_publication_date desc]',
    }
  );
  const prevPost = prevpostResponse?.results[0] || null;
  const nextPost = nextpostResponse?.results[0] || null;

  return {
    props: {
      post: response,
      prevPost,
      nextPost,
      preview,
    },
  };
};
