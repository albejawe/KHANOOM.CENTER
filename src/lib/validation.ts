import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "اسم القسم مطلوب").max(100),
  parentId: z.number().int().positive().nullable().optional(),
  imageKey: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const sizeSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1, "اسم القياس مطلوب").max(50),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  id: z.number().int().positive().optional(),
  categoryId: z.number().int().positive("يرجى اختيار الفئة الفرعية"),
  price: z.number().int().nonnegative("السعر يجب أن يكون 0 أو أكثر"),
  description: z.string().max(1000).optional().nullable(),
  imageKey: z.string().min(1, "صورة المنتج مطلوبة"),
  isHidden: z.boolean().default(false),
  sizeIds: z.array(z.number().int().positive()).default([]),
});

export const bulkProductSchema = z.object({
  categoryId: z.number().int().positive("يرجى اختيار الفئة الفرعية"),
  price: z.number().int().nonnegative("السعر يجب أن يكون 0 أو أكثر"),
  description: z.string().max(1000).optional().nullable(),
  imageKeys: z.array(z.string().min(1)).min(1, "يجب تحديد صورة واحدة على الأقل"),
  sizeIds: z.array(z.number().int().positive()).default([]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SizeInput = z.infer<typeof sizeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type BulkProductInput = z.infer<typeof bulkProductSchema>;
