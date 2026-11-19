/**
 * Single source of event-specific content (constitution principle VI).
 * Change names, date, copy and limits here only.
 */
export const config = {
  couple: { first: 'Яна', second: 'Віталій', joiner: 'та' },
  dateLabel: '4 вересня 2027',
  copy: {
    eyebrow: 'Запрошуємо поділитися моментами',
    lead: 'Поділіться тим, що побачили сьогодні — фото й відео потраплять просто до нас.',
    uploadButton: 'Додати фото та відео',
    namePlaceholder: "Ваше ім'я (необов'язково)",
    nameLabel: 'Як вас звати?',
    galleryTitle: 'Ваші моменти',
    galleryEmpty: 'Тут з’являться ваші фото та відео.',
    uploadsTitle: 'Завантаження',
    retry: 'Повторити',
    remove: 'Видалити',
    removeConfirm: 'Видалити цей файл? Це не можна скасувати.',
    close: 'Закрити',
    thanks: 'Дякуємо, що ви з нами ♡',
    connecting: 'Підключаємось…',
    offline: 'Не вдалося підключитися. Перевірте інтернет і оновіть сторінку.',
  },
  /** Must match bucket limits in supabase/migrations/0002_storage.sql */
  maxFileBytes: 2 * 1024 * 1024 * 1024,
  parallelUploads: 2,
  thumbMaxSide: 480,
  signedUrlTtlSec: 3600,
  bucket: 'media',
} as const

export type AppConfig = typeof config
