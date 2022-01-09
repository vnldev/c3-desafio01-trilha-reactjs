import { useEffect } from 'react';

export default function Comments(): JSX.Element {
  useEffect(() => {
    const commentsElement = document.getElementById('comments');
    if (!commentsElement) {
      return;
    }
    const utterances = document.getElementsByClassName('utterances')[0];
    if (utterances) {
      utterances.remove();
    }

    const script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('label', 'comment');
    script.setAttribute('repo', 'vnl13/c3-desafio01-trilha-reactjs');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'dark-blue');

    commentsElement.appendChild(script);
  });

  return <div id="comments" />;
}
