import { GetStaticProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { getPrismicClient } from '../services/prismic';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;
  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);

  async function handleLoadPosts() {
    const response = await fetch(next_page);
    const { results: resultsResponse, next_page: newNextPage } =
      await response.json();

    const newPosts = resultsResponse.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: post.data,
      };
    });
    setPosts([...posts, ...newPosts]);
    setNextPage(newNextPage);
  }

  return (
    <>
      <Head>
        <title>spacetraveling.</title>
      </Head>
      <header className={commonStyles.logo}>
        <img src="/Logo.svg" alt="spacetraveling." />
      </header>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => {
            return (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={commonStyles.postInfo}>
                    <time>
                      <img src="/calendar.svg" alt="Data" />
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <span>
                      <img src="/user.svg" alt="Autor" />
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
        {nextPage && (
          <button
            type="button"
            className={styles.loadButton}
            onClick={handleLoadPosts}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [
        'posts.title',
        'posts.subtitle',
        'posts.banner',
        'posts.author',
        'posts.content',
      ],
      pageSize: 2,
    }
  );

  const { next_page } = postsResponse;
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  return {
    props: {
      postsPagination: { results: posts, next_page },
    },
    revalidate: 60 * 30, // 30 minutes;
  };
};
