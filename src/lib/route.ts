import { useEffect, useState } from 'react';

export type Route =
  | { name: 'feed' }
  | { name: 'collection' }
  | { name: 'player'; id: string };

function parse(hash: string): Route {
  const [, section, id] = hash.replace(/^#/, '').split('/');
  if (section === 'colecao') return { name: 'collection' };
  if (section === 'jogador' && id) return { name: 'player', id };
  return { name: 'feed' };
}

export function href(route: Route) {
  if (route.name === 'collection') return '#/colecao';
  if (route.name === 'player') return `#/jogador/${route.id}`;
  return '#/';
}

export function useRoute() {
  const [route, setRoute] = useState(() => parse(location.hash));
  useEffect(() => {
    const onHash = () => {
      setRoute(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export function navigate(route: Route) {
  location.hash = href(route);
}
