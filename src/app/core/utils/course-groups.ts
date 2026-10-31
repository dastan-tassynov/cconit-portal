import { PublicCourse } from '../api/models';

/** Ключ группы для курсов, код которых не найден в справочнике Өрлеу. */
export const OTHER_GROUP = 'OTHER';

export interface CourseGroup {
  key: string;
  /** Предмет из Өрлеу; для «Других курсов» — пусто (подпись из словаря CATALOG_OTHER). */
  title: string;
  courses: PublicCourse[];
}

/**
 * Группы каталога: курсы с кодом программы из Өрлеу — по предмету (Физика, Математика…),
 * курсы с «ручным» кодом — отдельной группой «Другие курсы» в конце.
 */
export function groupCourses(courses: PublicCourse[]): CourseGroup[] {
  const groups = new Map<string, CourseGroup>();
  // В справочнике Өрлеу у разных кодов бывает одинаковое название («Педагоги») — такие группы объединяем
  const keyByTitle = new Map<string, string>();
  for (const course of courses) {
    let key = course.groupKey || OTHER_GROUP;
    const title = key === OTHER_GROUP ? '' : (course.groupTitle ?? '').trim();
    if (key !== OTHER_GROUP && title) {
      const norm = title.toLocaleLowerCase('ru').replace(/\s+/g, ' ');
      key = keyByTitle.get(norm) ?? key;
      keyByTitle.set(norm, key);
    }
    const group = groups.get(key) ?? { key, title, courses: [] };
    group.courses.push(course);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (a.key === OTHER_GROUP) return 1;
    if (b.key === OTHER_GROUP) return -1;
    return a.title.localeCompare(b.title, 'ru');
  });
}
