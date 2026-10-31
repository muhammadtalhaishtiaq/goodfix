export const CATEGORIES = ['Home', 'Kitchen', 'Gadgets', 'DIY', 'Garden'] as const
export type Category = (typeof CATEGORIES)[number]
