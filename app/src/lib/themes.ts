import type { DecorKind } from './decor'

export type PatternKind =
  | 'none' | 'dots' | 'gingham' | 'stripes' | 'hearts' | 'stars' | 'floral'
  | 'checker' | 'clouds' | 'grid' | 'sprinkles' | 'waves' | 'diagonal' | 'leopard'

export type Category =
  | 'Cute' | 'Y2K' | 'Floral' | 'Vintage' | 'Minimal' | 'Musim' | 'Party' | 'Alam' | 'Dark'

export interface Theme {
  id: string
  name: string
  cat: Category
  strip: string
  strip2?: string // gradient end
  pattern: PatternKind
  patternColor: string
  footerBand?: { color: string; pattern: PatternKind; patternColor: string }
  slotBorder?: string
  slotFill: string
  radius: number // relative to slot width
  font: string
  caption: string
  captionColor: string
  decor: [DecorKind, string, string][]
  decorCount: number
  bg: string // suggested virtual background id
}

const T = (t: Partial<Theme> & Pick<Theme, 'id' | 'name' | 'cat' | 'strip' | 'decor' | 'bg'>): Theme => ({
  pattern: 'none', patternColor: 'rgba(255,255,255,0.25)', slotFill: '#fdf8f5', radius: 0,
  font: 'Fredoka', caption: 'camora', captionColor: '#ffffff', decorCount: 6, ...t,
})

export const THEMES: Theme[] = [
  // ---- inspired by the provided templates ----
  T({ id: 'cherry-pin', name: 'Cherry Pin', cat: 'Y2K', strip: '#7a0d1e', decor: [['pin', '', ''], ['star', '#8f1d26', '#f3d6c8'], ['lips', '#b5323f', ''], ['star3d', '', ''], ['star3d', '', '']], decorCount: 6, bg: 'rose-velvet', font: 'Playfair Display', caption: 'xoxo', captionColor: '#f7dfe0' }),
  T({ id: 'joy-of-being', name: 'Joy of Being', cat: 'Floral', strip: '#fbf3e8', slotBorder: '#7f8f55', radius: 0.08, footerBand: { color: '#f7efe2', pattern: 'floral', patternColor: '#f2a7b8' }, decor: [['lily', '#f7a1b8', '#fde6ec'], ['butterfly', '#f3b6c6', '#a9cf98'], ['pixelHeart', '#f4b4c9', ''], ['daisy', '#a7cf8f', '#f7d36b']], decorCount: 7, bg: 'sky-hills', font: 'Pacifico', caption: 'the joy of being', captionColor: '#e0738f' }),
  T({ id: 'sage-garden', name: 'Sage Garden', cat: 'Floral', strip: '#a9b98f', slotBorder: '#fbf3e8', radius: 0.06, pattern: 'floral', patternColor: 'rgba(255,255,255,0.35)', decor: [['tulip', '#f29bb0', ''], ['butterfly', '#fff1c1', '#f6b8c8'], ['leaf', '#6f8a4a', '#4e6634']], bg: 'meadow', font: 'Caveat', caption: 'bloom where you are', captionColor: '#fffaf0' }),
  T({ id: 'coquette', name: 'Coquette Bow', cat: 'Cute', strip: '#fde2e7', pattern: 'stripes', patternColor: 'rgba(255,255,255,0.6)', slotBorder: '#ffffff', radius: 0.04, decor: [['bow', '#f48fb1', '#e06c93'], ['heart', '#ff8fab', ''], ['sparkle', '#ffffff', ''], ['pin', '', '']], bg: 'pink-satin', font: 'Playfair Display', caption: 'darling', captionColor: '#d0607f' }),
  T({ id: 'berry-gingham', name: 'Berry Picnic', cat: 'Cute', strip: '#ffffff', pattern: 'gingham', patternColor: 'rgba(230,57,80,0.28)', slotBorder: '#e63950', radius: 0.03, decor: [['strawberry', '#e63950', ''], ['cherry', '#d62839', ''], ['daisy', '#ffffff', '#ffd23f']], bg: 'picnic', font: 'Pacifico', caption: 'berry sweet', captionColor: '#e63950' }),
  T({ id: 'baby-blue', name: 'Baby Blue', cat: 'Cute', strip: '#bfe0ff', pattern: 'clouds', patternColor: 'rgba(255,255,255,0.7)', radius: 0.07, slotBorder: '#ffffff', decor: [['cloud', '#ffffff', ''], ['sparkle', '#fff7b0', ''], ['star', '#ffe27a', '#ffffff']], bg: 'pastel-sky', font: 'Fredoka', caption: 'on cloud nine', captionColor: '#4d86c6' }),
  T({ id: 'lavender-dream', name: 'Lavender Dream', cat: 'Cute', strip: '#d9c7f2', strip2: '#f6d9ef', pattern: 'sprinkles', patternColor: 'rgba(255,255,255,0.7)', radius: 0.05, decor: [['moon', '#fff6c9', ''], ['sparkle', '#ffffff', ''], ['star', '#b79be6', '#ffffff'], ['butterfly', '#c9a7f5', '#f7c6e0']], bg: 'lavender', font: 'Pacifico', caption: 'sweet dreams', captionColor: '#7a5aa8' }),
  T({ id: 'kitty', name: 'Kitty Club', cat: 'Cute', strip: '#ffe9d6', pattern: 'dots', patternColor: 'rgba(255,170,140,0.35)', radius: 0.05, slotBorder: '#ffb38a', decor: [['cat', '#ffffff', ''], ['cat', '#ffc78f', ''], ['heart', '#ff8fa3', ''], ['note', '#ff9b73', '']], bg: 'peach-dots', font: 'Fredoka', caption: 'meow meow', captionColor: '#ff7f50' }),
  T({ id: 'mint-choco', name: 'Mint Choco', cat: 'Cute', strip: '#bff0dc', pattern: 'checker', patternColor: 'rgba(110,70,50,0.12)', radius: 0.04, slotBorder: '#6e4632', decor: [['heart', '#6e4632', ''], ['sparkle', '#ffffff', ''], ['dot', '#6e4632', '']], bg: 'mint', font: 'Fredoka', caption: 'mint to be', captionColor: '#6e4632' }),
  // ---- Y2K ----
  T({ id: 'y2k-chrome', name: 'Y2K Chrome', cat: 'Y2K', strip: '#c9c9d6', strip2: '#f3f3f8', pattern: 'stars', patternColor: 'rgba(255,255,255,0.7)', decor: [['star3d', '', ''], ['sparkle', '#ffffff', ''], ['butterfly', '#b9c2ff', '#ffc2f0']], bg: 'chrome', font: 'Bebas Neue', caption: 'Y2K FOREVER', captionColor: '#5a5a7a' }),
  T({ id: 'bubblegum', name: 'Bubblegum Pop', cat: 'Y2K', strip: '#ff6fb5', strip2: '#ffb3dc', pattern: 'hearts', patternColor: 'rgba(255,255,255,0.3)', radius: 0.08, decor: [['bubble', '#ffffff', ''], ['heart', '#ff2e93', ''], ['lightning', '#fff35c', ''], ['sparkle', '#ffffff', '']], bg: 'bubblegum', font: 'Fredoka', caption: 'pop it!', captionColor: '#ffffff' }),
  T({ id: 'cyber-butterfly', name: 'Cyber Butterfly', cat: 'Y2K', strip: '#1b1440', strip2: '#3d1f73', pattern: 'grid', patternColor: 'rgba(120,200,255,0.25)', decor: [['butterfly', '#73f0ff', '#ff73e6'], ['sparkle', '#b7f7ff', ''], ['star', '#ff73e6', '#ffffff']], bg: 'synthwave', font: 'Press Start 2P', caption: 'LOADING...', captionColor: '#73f0ff' }),
  T({ id: 'leopard', name: 'Wild Leopard', cat: 'Y2K', strip: '#d9a066', pattern: 'leopard', patternColor: 'rgba(60,35,15,0.6)', slotBorder: '#2b1a0f', decor: [['lips', '#c2185b', ''], ['diamond', '#ffd1f0', ''], ['sparkle', '#ffffff', '']], bg: 'hot-pink', font: 'Playfair Display', caption: 'wild thing', captionColor: '#2b1a0f' }),
  T({ id: 'gamer', name: 'Pixel Gamer', cat: 'Y2K', strip: '#20203a', pattern: 'checker', patternColor: 'rgba(255,255,255,0.05)', slotBorder: '#7dff7a', decor: [['pixelHeart', '#ff4f6d', ''], ['pixelHeart', '#7dff7a', ''], ['lightning', '#ffe14f', ''], ['star', '#4fc3ff', '#ffffff']], bg: 'arcade', font: 'Press Start 2P', caption: 'PLAYER 1', captionColor: '#7dff7a' }),
  // ---- Vintage ----
  T({ id: 'classic-film', name: 'Classic Film', cat: 'Vintage', strip: '#161616', decor: [['film', '#2a2a2a', ''], ['tape', '#e9dcc0', '']], decorCount: 3, slotFill: '#ececec', bg: 'studio-grey', font: 'Bebas Neue', caption: 'PHOTO BOOTH', captionColor: '#f1e7d0' }),
  T({ id: 'kraft', name: 'Kraft Scrapbook', cat: 'Vintage', strip: '#c8a27a', pattern: 'grid', patternColor: 'rgba(90,60,30,0.15)', slotBorder: '#fffaf0', decor: [['tape', '#f5e6c8', ''], ['tape', '#d8e8c8', ''], ['leaf', '#7a8a4a', '#5a6a34'], ['note', '#5a3a1a', '']], bg: 'retro-room', font: 'Caveat', caption: 'memories', captionColor: '#3d2a14' }),
  T({ id: 'sepia-love', name: 'Sepia Love', cat: 'Vintage', strip: '#efe2c9', pattern: 'diagonal', patternColor: 'rgba(140,100,60,0.1)', slotBorder: '#8c643c', decor: [['heart', '#a0522d', ''], ['ribbon', '#b5835a', ''], ['daisy', '#fff8e8', '#c69a5b']], bg: 'sepia-wall', font: 'Dancing Script', caption: 'forever yours', captionColor: '#7a4f2a' }),
  T({ id: 'retro-70s', name: 'Groovy 70s', cat: 'Vintage', strip: '#f2a541', pattern: 'waves', patternColor: 'rgba(196,77,44,0.35)', radius: 0.06, decor: [['daisy', '#ffffff', '#f2a541'], ['sun', '#ffd166', ''], ['rainbow', '', '']], bg: 'groovy', font: 'Lobster', caption: 'groovy baby', captionColor: '#7a2e12' }),
  T({ id: 'diner', name: 'Retro Diner', cat: 'Vintage', strip: '#ffffff', pattern: 'checker', patternColor: 'rgba(0,0,0,0.1)', footerBand: { color: '#111111', pattern: 'checker', patternColor: '#ffffff' }, slotBorder: '#e63946', decor: [['cherry', '#e63946', ''], ['star', '#4cc9f0', '#ffffff'], ['note', '#e63946', '']], bg: 'diner', font: 'Lobster', caption: 'shake it!', captionColor: '#e63946' }),
  // ---- Minimal ----
  T({ id: 'clean-white', name: 'Clean White', cat: 'Minimal', strip: '#ffffff', decor: [], decorCount: 0, slotFill: '#eeeeee', bg: 'studio-white', font: 'Playfair Display', caption: 'camora', captionColor: '#222222' }),
  T({ id: 'jet-black', name: 'Jet Black', cat: 'Minimal', strip: '#0f0f0f', decor: [], decorCount: 0, slotFill: '#222', bg: 'studio-black', font: 'Bebas Neue', caption: 'CAMORA', captionColor: '#ffffff' }),
  T({ id: 'beige-latte', name: 'Latte', cat: 'Minimal', strip: '#e8d8c3', radius: 0.03, decor: [['sparkle', '#ffffff', '']], decorCount: 3, bg: 'latte', font: 'Playfair Display', caption: 'but first, coffee', captionColor: '#6b4f3a' }),
  T({ id: 'navy-gold', name: 'Navy Gold', cat: 'Minimal', strip: '#14213d', slotBorder: '#d4af37', decor: [['sparkle', '#d4af37', ''], ['star', '#d4af37', '#14213d']], decorCount: 4, bg: 'gold-bokeh', font: 'Playfair Display', caption: 'golden hour', captionColor: '#d4af37' }),
  T({ id: 'olive', name: 'Olive Linen', cat: 'Minimal', strip: '#6b7046', pattern: 'diagonal', patternColor: 'rgba(255,255,255,0.06)', decor: [['leaf', '#a3a86b', '#4e5233']], decorCount: 3, bg: 'olive-studio', font: 'Caveat', caption: 'slow days', captionColor: '#f3ecd6' }),
  // ---- Musim / Seasonal ----
  T({ id: 'sakura', name: 'Sakura', cat: 'Musim', strip: '#ffd6e3', strip2: '#fff0f5', pattern: 'floral', patternColor: 'rgba(255,150,180,0.35)', radius: 0.05, decor: [['daisy', '#ffb7c9', '#ffffff'], ['butterfly', '#ffffff', '#ffc2d4'], ['sparkle', '#ffffff', '']], bg: 'sakura', font: 'Dancing Script', caption: 'haru', captionColor: '#d1497a' }),
  T({ id: 'summer-beach', name: 'Summer Beach', cat: 'Musim', strip: '#48cae4', strip2: '#ade8f4', pattern: 'waves', patternColor: 'rgba(255,255,255,0.35)', radius: 0.05, decor: [['shell', '#ffd6c4', '#f4a28c'], ['sun', '#ffd166', ''], ['bubble', '#ffffff', '']], bg: 'beach', font: 'Pacifico', caption: 'summer vibes', captionColor: '#ffffff' }),
  T({ id: 'autumn', name: 'Autumn Leaves', cat: 'Musim', strip: '#a0522d', strip2: '#d2691e', decor: [['leaf', '#ffb347', '#7a3d14'], ['leaf', '#e8743b', '#6a2e0c'], ['mushroom', '#c0392b', '']], bg: 'autumn', font: 'Caveat', caption: 'sweater weather', captionColor: '#fff2d8' }),
  T({ id: 'winter', name: 'Winter Snow', cat: 'Musim', strip: '#dbeafe', strip2: '#ffffff', pattern: 'sprinkles', patternColor: 'rgba(150,180,230,0.5)', radius: 0.04, decor: [['snowflake', '#7aa7e6', ''], ['snowflake', '#ffffff', ''], ['sparkle', '#bcd4ff', '']], bg: 'snow', font: 'Fredoka', caption: 'let it snow', captionColor: '#3c6fb4' }),
  T({ id: 'xmas', name: 'Merry Xmas', cat: 'Musim', strip: '#1e5631', pattern: 'stripes', patternColor: 'rgba(255,255,255,0.07)', slotBorder: '#c0392b', decor: [['star', '#ffd700', '#ffffff'], ['bow', '#c0392b', '#8e1e14'], ['snowflake', '#ffffff', '']], bg: 'xmas', font: 'Lobster', caption: 'merry & bright', captionColor: '#ffd700' }),
  T({ id: 'lebaran', name: 'Lebaran', cat: 'Musim', strip: '#0f5132', strip2: '#198754', pattern: 'diagonal', patternColor: 'rgba(255,215,0,0.12)', slotBorder: '#d4af37', decor: [['moon', '#ffd700', ''], ['star', '#ffd700', '#0f5132'], ['sparkle', '#fff6c2', '']], bg: 'lebaran', font: 'Playfair Display', caption: 'mohon maaf lahir & batin', captionColor: '#ffd700' }),
  T({ id: 'merdeka', name: 'Merdeka', cat: 'Musim', strip: '#ce1126', footerBand: { color: '#ffffff', pattern: 'none', patternColor: '' }, decor: [['star', '#ffffff', '#ce1126'], ['ribbon', '#ffffff', ''], ['sparkle', '#ffffff', '']], bg: 'merdeka', font: 'Bebas Neue', caption: 'MERDEKA!', captionColor: '#ce1126' }),
  T({ id: 'halloween', name: 'Spooky', cat: 'Musim', strip: '#2b1b3d', pattern: 'stars', patternColor: 'rgba(255,140,0,0.2)', decor: [['moon', '#ffcf6b', ''], ['flame', '#ff8c00', '#ffd166'], ['cat', '#111111', '']], bg: 'spooky', font: 'Lobster', caption: 'boo!', captionColor: '#ff8c00' }),
  T({ id: 'valentine', name: 'Valentine', cat: 'Musim', strip: '#ff4d6d', strip2: '#ff8fa3', pattern: 'hearts', patternColor: 'rgba(255,255,255,0.25)', radius: 0.08, decor: [['heart', '#ffffff', ''], ['heart', '#c9184a', ''], ['lips', '#a4133c', ''], ['sparkle', '#ffffff', '']], bg: 'hearts', font: 'Dancing Script', caption: 'be mine', captionColor: '#ffffff' }),
  // ---- Party ----
  T({ id: 'birthday', name: 'Happy Birthday', cat: 'Party', strip: '#ffd6e0', pattern: 'sprinkles', patternColor: 'rgba(255,120,160,0.55)', radius: 0.06, decor: [['star', '#ffd166', '#ffffff'], ['bubble', '#ff8fab', ''], ['heart', '#8ecae6', ''], ['sparkle', '#ffffff', '']], bg: 'confetti', font: 'Pacifico', caption: 'happy birthday!', captionColor: '#ef476f' }),
  T({ id: 'disco', name: 'Disco Night', cat: 'Party', strip: '#3a0ca3', strip2: '#7209b7', pattern: 'stars', patternColor: 'rgba(255,255,255,0.18)', decor: [['diamond', '#e0c3ff', ''], ['sparkle', '#ffffff', ''], ['star3d', '', ''], ['note', '#f72585', '']], bg: 'disco', font: 'Lobster', caption: 'dancing queen', captionColor: '#ffd6ff' }),
  T({ id: 'graduation', name: 'Graduation', cat: 'Party', strip: '#1d3557', slotBorder: '#f1c40f', decor: [['star', '#f1c40f', '#1d3557'], ['ribbon', '#f1c40f', ''], ['sparkle', '#ffffff', '']], bg: 'gold-bokeh', font: 'Playfair Display', caption: 'class of ' + new Date().getFullYear(), captionColor: '#f1c40f' }),
  T({ id: 'wedding', name: 'Wedding', cat: 'Party', strip: '#fffaf3', slotBorder: '#d8c3a5', radius: 0.02, decor: [['lily', '#ffffff', '#f6e7d8'], ['leaf', '#a3b18a', '#588157'], ['sparkle', '#e6ccb2', '']], bg: 'wedding', font: 'Dancing Script', caption: 'happily ever after', captionColor: '#9c7a54' }),
  T({ id: 'besties', name: 'Besties', cat: 'Party', strip: '#ffe066', pattern: 'dots', patternColor: 'rgba(255,255,255,0.6)', radius: 0.06, slotBorder: '#ff6b6b', decor: [['smiley', '#ffd43b', ''], ['heart', '#ff6b6b', ''], ['lightning', '#4dabf7', ''], ['star', '#ff922b', '#ffffff']], bg: 'pop-yellow', font: 'Fredoka', caption: 'besties 4ever', captionColor: '#ff6b6b' }),
  // ---- Alam ----
  T({ id: 'forest', name: 'Forest', cat: 'Alam', strip: '#2d6a4f', strip2: '#40916c', decor: [['leaf', '#95d5b2', '#1b4332'], ['mushroom', '#e63946', ''], ['butterfly', '#ffd166', '#f4978e']], bg: 'forest', font: 'Caveat', caption: 'into the woods', captionColor: '#d8f3dc' }),
  T({ id: 'ocean', name: 'Deep Ocean', cat: 'Alam', strip: '#03045e', strip2: '#0077b6', pattern: 'waves', patternColor: 'rgba(144,224,239,0.2)', radius: 0.05, decor: [['bubble', '#90e0ef', ''], ['shell', '#ffcad4', '#f4acb7'], ['star', '#ffb703', '#ffffff']], bg: 'underwater', font: 'Pacifico', caption: 'ocean eyes', captionColor: '#caf0f8' }),
  T({ id: 'sunflower', name: 'Sunflower', cat: 'Alam', strip: '#ffe8a3', pattern: 'dots', patternColor: 'rgba(255,190,11,0.3)', slotBorder: '#6b4423', radius: 0.04, decor: [['daisy', '#ffbe0b', '#6b4423'], ['leaf', '#6a994e', '#386641'], ['butterfly', '#fb8500', '#ffb703']], bg: 'sunflower', font: 'Pacifico', caption: 'sunny side up', captionColor: '#6b4423' }),
  T({ id: 'clover', name: 'Lucky Clover', cat: 'Alam', strip: '#d8f3dc', pattern: 'gingham', patternColor: 'rgba(82,183,136,0.25)', radius: 0.05, decor: [['clover', '#52b788', ''], ['sparkle', '#ffffff', ''], ['daisy', '#ffffff', '#ffd166']], bg: 'meadow', font: 'Fredoka', caption: 'lucky you', captionColor: '#2d6a4f' }),
  // ---- Dark ----
  T({ id: 'galaxy', name: 'Galaxy', cat: 'Dark', strip: '#0b0b2b', strip2: '#2e1a5e', pattern: 'stars', patternColor: 'rgba(255,255,255,0.35)', radius: 0.05, decor: [['planet', '#ffb4a2', '#e5989b'], ['moon', '#fff3b0', ''], ['sparkle', '#ffffff', ''], ['star', '#ffd166', '#0b0b2b']], bg: 'galaxy', font: 'Fredoka', caption: 'over the moon', captionColor: '#e0d4ff' }),
  T({ id: 'gothic', name: 'Gothic Rose', cat: 'Dark', strip: '#1a0a0f', pattern: 'diagonal', patternColor: 'rgba(120,0,30,0.25)', slotBorder: '#5c0a1e', decor: [['heart', '#5c0a1e', ''], ['diamond', '#9d0208', ''], ['pin', '', ''], ['star3d', '', '']], bg: 'rose-velvet', font: 'Playfair Display', caption: 'darkly yours', captionColor: '#c9a0a8' }),
  T({ id: 'neon', name: 'Neon City', cat: 'Dark', strip: '#0d0221', pattern: 'grid', patternColor: 'rgba(255,0,170,0.2)', slotBorder: '#00f0ff', decor: [['lightning', '#00f0ff', ''], ['heart', '#ff00aa', ''], ['star', '#fffb00', '#0d0221']], bg: 'city-night', font: 'Bebas Neue', caption: 'NIGHT OUT', captionColor: '#ff00aa' }),
]

export type LayoutId = 'strip2' | 'strip3' | 'strip4' | 'grid4' | 'grid6' | 'polaroid'

export const LAYOUTS: { id: LayoutId; name: string; shots: number }[] = [
  { id: 'strip3', name: 'Strip 3', shots: 3 },
  { id: 'strip4', name: 'Strip 4', shots: 4 },
  { id: 'strip2', name: 'Strip 2', shots: 2 },
  { id: 'grid4', name: 'Grid 2×2', shots: 4 },
  { id: 'grid6', name: 'Grid 2×3', shots: 6 },
  { id: 'polaroid', name: 'Polaroid', shots: 1 },
]

export const CATEGORIES: Category[] = ['Cute', 'Y2K', 'Floral', 'Vintage', 'Minimal', 'Musim', 'Party', 'Alam', 'Dark']
