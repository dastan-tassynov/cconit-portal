/**
 * Импорт уроков из Word (.docx) прямо в браузере (библиотека mammoth, грузится только при импорте).
 * Сохраняется смысловое оформление: заголовки, абзацы, жирный/курсив, списки, таблицы, картинки (внутри HTML).
 */

export interface WordLesson {
  title: string;
  html: string;
}

export class WordImportError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}

/** .doc (старый формат Word 97–2003) mammoth не читает — просим пересохранить в .docx. */
export function checkWordFile(file: File): void {
  const name = file.name.toLowerCase();
  if (name.endsWith('.doc')) throw new WordImportError('WORD_OLD_FORMAT');
  if (!name.endsWith('.docx')) throw new WordImportError('WORD_NOT_DOCX');
}

export async function docxToHtml(file: File): Promise<string> {
  checkWordFile(file);
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async image => ({ src: await compactImage(await image.read('base64'), image.contentType) })),
      // заголовки Word на русском/казахском называются по-разному — сводим к h1–h3
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Заголовок'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ],
    },
  );
  const html = cleanHtml(result.value);
  if (!html.replace(/<[^>]+>/g, '').trim() && !/<img/i.test(html)) throw new WordImportError('WORD_EMPTY');
  return html;
}

/**
 * Разбить документ на модули по заголовкам: по «Заголовку 1» (если их нет — по «Заголовку 2»).
 * Текст до первого заголовка присоединяется к первому модулю.
 */
export function splitByHeadings(html: string): WordLesson[] {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root')!;
  const level = root.querySelector(':scope > h1') ? 'H1' : root.querySelector(':scope > h2') ? 'H2' : null;
  if (!level) return [];

  const lessons: WordLesson[] = [];
  let intro = '';
  let current: { title: string; parts: string[] } | null = null;
  for (const node of Array.from(root.children)) {
    if (node.tagName === level) {
      if (current) lessons.push({ title: current.title, html: current.parts.join('') });
      current = { title: node.textContent?.trim() || '—', parts: [] };
    } else if (current) {
      current.parts.push(node.outerHTML);
    } else {
      intro += node.outerHTML;
    }
  }
  if (current) lessons.push({ title: current.title, html: current.parts.join('') });
  if (intro && lessons.length) lessons[0].html = intro + lessons[0].html;
  return lessons.filter(l => l.title !== '—' || l.html.trim());
}

/** Текст урока — HTML (из Word) или простой текст (введён вручную раньше). */
export function isHtml(text: string | null | undefined): boolean {
  return !!text && /^\s*<(p|h[1-6]|ul|ol|table|div|img|strong|em|blockquote)[\s>]/i.test(text);
}

/** Картинки до этого размера оставляем как есть (схемы с текстом не мылим). */
const KEEP_IMAGE_BYTES = 300 * 1024;
const MAX_IMAGE_SIDE = 1400;

/**
 * Фото и сканы из Word бывают по несколько мегабайт — ужимаем до 1400 px и JPEG,
 * чтобы урок быстро открывался у студента. Небольшие картинки и векторные форматы не трогаем.
 */
async function compactImage(base64: string, contentType: string): Promise<string> {
  const original = `data:${contentType};base64,${base64}`;
  const bytes = base64.length * 0.75;
  if (bytes <= KEEP_IMAGE_BYTES || !/^image\/(png|jpe?g|bmp|gif|tiff|webp)$/i.test(contentType)) return original;
  try {
    const img = new Image();
    img.src = original;
    await img.decode();
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // прозрачный фон PNG → белый (JPEG без прозрачности)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const compact = canvas.toDataURL('image/jpeg', 0.82);
    return compact.length < original.length ? compact : original;
  } catch {
    return original; // формат, который браузер не умеет показать (например, EMF), — оставляем как есть
  }
}

/** Убираем пустые абзацы, которые Word оставляет для отступов, и пустые якоря закладок. */
function cleanHtml(html: string): string {
  return html
    .replace(/<a id="[^"]*"><\/a>/g, '')
    .replace(/<p>(\s|&nbsp;)*<\/p>/g, '')
    .trim();
}
