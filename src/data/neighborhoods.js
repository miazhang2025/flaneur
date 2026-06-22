/**
 * The 5 Music-section locations, in scroll order.
 * Songs/videos are placeholders until the real assets are supplied
 * (drop into public/audio and public/videos with these filenames).
 * `grad` is the stand-in "video" gradient shown until a real .mp4 loads.
 */
export const neighborhoods = [
  {
    id: 'chinatown',
    name: 'Chinatown',
    coord: '40.715°N 73.997°W',
    tag: 'Cantopop · HK film scores',
    line: 'Where the city first became a film.',
    song: { title: "Yumeji's Theme", artist: 'Shigeru Umebayashi', src: '/audio/china-town.mp3' },
    video: '/videos/china-town.mp4',
    grad: ['#5a1414', '#c8861f'],
  },
  {
    id: 'les',
    name: 'Lower East Side',
    coord: '40.715°N 73.984°W',
    tag: 'Punk · indie · underground',
    line: 'Three chords and the truth, after dark.',
    song: { title: 'Marquee Moon', artist: 'Television', src: '/audio/low-east-side.mp3' },
    video: '/videos/low-east-side.mp4',
    grad: ['#241d33', '#c0455a'],
  },
  {
    id: 'soho',
    name: 'SoHo',
    coord: '40.723°N 74.000°W',
    tag: 'French electronic · fashion-forward',
    line: 'Cast-iron facades and a synthetic glow.',
    song: { title: "La Femme d'Argent", artist: 'Air', src: '/audio/soho.mp3' },
    video: '/videos/soho.mp4',
    grad: ['#2f3c52', '#aebccb'],
  },
  {
    id: 'greenwich',
    name: 'Greenwich Village',
    coord: '40.733°N 74.003°W',
    tag: 'Jazz · folk · singer-songwriter',
    line: 'Every doorway once held a song.',
    song: { title: 'Waltz for Debby', artist: 'Bill Evans', src: '/audio/greenwich-village.mp3' },
    video: '/videos/greenwich-village.mp4',
    grad: ['#2a1c10', '#caa15e'],
  },
  {
    id: 'harlem',
    name: 'Harlem',
    coord: '40.811°N 73.946°W',
    tag: 'Soul · gospel · hip-hop',
    line: 'The uptown pulse that never stopped.',
    song: { title: 'Sinnerman', artist: 'Nina Simone', src: '/audio/harlem.mp3' },
    video: '/videos/harlem.mp4',
    grad: ['#241433', '#e0a92e'],
  },
]
