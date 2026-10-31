// Realms, map stops and which mini-game + skill each stop plays.

export type Game = 'tenframe' | 'bubbles' | 'feed' | 'cherry' | 'hop' | 'beads' | 'mirror' | 'memory';
export type Part = { game: Game; skill: string; mode?: 'add' | 'sub' | 'part' | 'whole' | 'make' | 'double' | 'half' };
/** A map stop. Boss stops have `parts`: a short run of each game in turn. */
export type MapNode = Part & { id: string; animal: string; x: number; y: number; parts?: Part[] };
/** icon: the signpost emoji that leads into this realm. */
export type Realm = { id: string; bg: string; icon: string; intro: string; done: string; nodes: MapNode[] };

const boss = (parts: Part[]) => ({ game: parts[0].game, skill: parts[0].skill, mode: parts[0].mode, parts });

export const REALMS: Realm[] = [
  {
    id: 'meadow', bg: 'bg-map', icon: '🌼', intro: 'map_intro', done: 'meadow_done',
    nodes: [
      { id: 'meadow-1', game: 'tenframe', skill: 'bonds5', animal: 'lamb', x: 230, y: 790 },
      { id: 'meadow-2', game: 'tenframe', skill: 'bonds10', animal: 'duckling', x: 520, y: 830 },
      { id: 'meadow-3', game: 'bubbles', skill: 'bonds10', animal: 'hedgehog', x: 800, y: 720 },
      { id: 'meadow-4', game: 'feed', skill: 'bonds10', animal: 'piglet', x: 1080, y: 800 },
      { id: 'meadow-5', game: 'hop', skill: 'oneMore', mode: 'add', animal: 'chick', x: 1340, y: 670 },
      { id: 'meadow-6', animal: 'calf', x: 1130, y: 460, ...boss([
        { game: 'tenframe', skill: 'bonds10' }, { game: 'feed', skill: 'bonds10' }, { game: 'hop', skill: 'oneMore', mode: 'add' }]) },
    ],
  },
  {
    id: 'forest', bg: 'bg-forest', icon: '🌲', intro: 'forest_intro', done: 'forest_done',
    nodes: [
      { id: 'forest-1', game: 'cherry', skill: 'within10', mode: 'part', animal: 'squirrel', x: 260, y: 800 },
      { id: 'forest-2', game: 'hop', skill: 'within10', mode: 'add', animal: 'owl', x: 560, y: 690 },
      { id: 'forest-3', game: 'hop', skill: 'within10', mode: 'sub', animal: 'badger', x: 860, y: 800 },
      { id: 'forest-4', game: 'cherry', skill: 'within10', mode: 'whole', animal: 'fawn', x: 1150, y: 690 },
      { id: 'forest-5', game: 'feed', skill: 'within10', animal: 'mouse', x: 1390, y: 560 },
      { id: 'forest-6', animal: 'bearcub', x: 1080, y: 420, ...boss([
        { game: 'cherry', skill: 'within10', mode: 'part' }, { game: 'hop', skill: 'within10', mode: 'sub' }, { game: 'feed', skill: 'within10' }]) },
    ],
  },
  {
    id: 'river', bg: 'bg-rivermap', icon: '🌊', intro: 'river_intro', done: 'river_done',
    nodes: [
      { id: 'river-1', game: 'beads', skill: 'teens', mode: 'make', animal: 'frog', x: 230, y: 790 },
      { id: 'river-2', game: 'tenframe', skill: 'bonds20', animal: 'otter', x: 520, y: 830 },
      { id: 'river-3', game: 'hop', skill: 'bridge', mode: 'add', animal: 'kingfisher', x: 800, y: 720 },
      { id: 'river-4', game: 'bubbles', skill: 'bonds20', animal: 'beaver', x: 1080, y: 800 },
      { id: 'river-5', game: 'beads', skill: 'bridge', mode: 'add', animal: 'turtle', x: 1340, y: 670 },
      { id: 'river-6', animal: 'cygnet', x: 1130, y: 460, ...boss([
        { game: 'tenframe', skill: 'bonds20' }, { game: 'hop', skill: 'bridge', mode: 'add' }, { game: 'beads', skill: 'teens', mode: 'make' }]) },
    ],
  },
  {
    id: 'mountains', bg: 'bg-mountain', icon: '⛰️', intro: 'mountains_intro', done: 'mountains_done',
    nodes: [
      { id: 'mountains-1', game: 'mirror', skill: 'doubles', mode: 'double', animal: 'goatkid', x: 260, y: 800 },
      { id: 'mountains-2', game: 'memory', skill: 'doubles', animal: 'marmot', x: 560, y: 690 },
      { id: 'mountains-3', game: 'mirror', skill: 'doubles', mode: 'half', animal: 'cria', x: 860, y: 800 },
      { id: 'mountains-4', game: 'memory', skill: 'nearDoubles', animal: 'redpanda', x: 1150, y: 690 },
      { id: 'mountains-5', game: 'feed', skill: 'doubles', animal: 'yak', x: 1390, y: 560 },
      { id: 'mountains-6', animal: 'leopardcub', x: 1080, y: 420, ...boss([
        { game: 'mirror', skill: 'doubles', mode: 'double' }, { game: 'memory', skill: 'nearDoubles' }, { game: 'feed', skill: 'doubles' }]) },
    ],
  },
];

export const ALL_NODES = REALMS.flatMap(r => r.nodes);
export const realmOf = (nodeId: string) => REALMS.find(r => r.nodes.some(n => n.id === nodeId))!;
export const realmDone = (r: Realm, nodes: Record<string, number>) => r.nodes.every(n => nodes[n.id]);
export const realmOpen = (r: Realm, nodes: Record<string, number>) => {
  const i = REALMS.indexOf(r);
  return i === 0 || realmDone(REALMS[i - 1], nodes);
};
