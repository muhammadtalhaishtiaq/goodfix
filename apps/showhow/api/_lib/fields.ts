// Creator-provided title/category: both optional. Blank title or 'auto' category → the safety review fills them (F5, F6).
import { z } from 'zod'
import { CATEGORIES } from '../../src/lib/categories.js'

export const TitleField = z.string().trim().max(120).default('')
export const CategoryField = z.enum([...CATEGORIES, 'auto']).default('auto')
export const PLACEHOLDER_TITLE = 'Untitled guide'
