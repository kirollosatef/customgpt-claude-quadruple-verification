import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  content: z.string().min(1, "Content is required"),
  author: z
    .string()
    .min(1, "Author is required")
    .max(100, "Author must be 100 characters or fewer"),
  published: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(255, "Title must be 255 characters or fewer")
    .optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  author: z
    .string()
    .min(1, "Author cannot be empty")
    .max(100, "Author must be 100 characters or fewer")
    .optional(),
  published: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
