/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export default async function Preview(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<unknown> {
  const { documentId, token: ref } = req.query;
  const prismic = getPrismicClient();

  const redirectUrl = await prismic
    .getPreviewResolver(String(ref), String(documentId))
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.write(`<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
  <script>window.location.href = '${redirectUrl}'</script>
  </head>`);
  res.end();
}
