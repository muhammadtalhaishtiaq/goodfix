// Guide categories. Muse Spark picks one of these when the creator chooses "Let AI choose" (F5).
export const CATEGORIES = ['Home', 'Kitchen', 'Cooking', 'Cleaning', 'Laundry', 'Gadgets', 'DIY', 'Garden', 'Car care', 'Bikes', 'Beauty', 'Fitness', 'Learning', 'Crafts', 'Pets', 'Kids', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]
