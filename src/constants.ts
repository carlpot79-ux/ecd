export const SUBDISTRICT_HIERARCHY = {
  'Rural East': ['CKD', 'Knysna', 'George', 'Oudtshoorn', 'Mosselbay', 'Hessequa'],
  'Rural Central': ['Witzenberg', 'Breede Valley', 'Langeberg', 'Swellendam', 'Cape Agulhas', 'Overstrand', 'Theewaterskloof'],
  'Rural West': ['Stellenbosch', 'Drakenstein', 'Swartland', 'Saldanha', 'Bergrivier', 'Cederberg', 'Matzikamma']
} as const;

export type Region = keyof typeof SUBDISTRICT_HIERARCHY;
