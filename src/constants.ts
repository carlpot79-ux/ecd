export const SUBDISTRICT_HIERARCHY = {
  'Rural East': ['George', 'Oudtshoorn', 'CKD', 'Knysna'],
  'Rural West': ['Saldana', 'Bergrivier', 'Matzikamma'],
  'Rural Central': ['Drakenstein', 'Witzenberg', 'Aghallas', 'Swellendam']
} as const;

export type Region = keyof typeof SUBDISTRICT_HIERARCHY;
