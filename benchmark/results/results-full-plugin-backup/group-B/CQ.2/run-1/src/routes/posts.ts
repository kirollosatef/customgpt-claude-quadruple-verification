import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { validate } from "../middleware/validate";
import { createPostSchema, updatePostSchema } from "../schemas/post";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// GET /posts — list all posts with optional filtering
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { published, author } = req.query;

    const where: Record<string, unknown> = {};
    if (published === "true") where.published = true;
    if (published === "false") where.published = false;
    if (typeof author === "string") where.author = author;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(posts);
  } catch (error) {
    next(error);
  }
});

// GET /posts/:id — get a single post
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new AppError(400, "Post ID must be an integer");
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new AppError(404, `Post with ID ${id} not found`);
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// POST /posts — create a new post
router.post(
  "/",
  validate(createPostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await prisma.post.create({ data: req.body });
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /posts/:id — update an existing post
router.put(
  "/:id",
  validate(updatePostSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new AppError(400, "Post ID must be an integer");
      }

      // Verify post exists before updating
      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(404, `Post with ID ${id} not found`);
      }

      const post = await prisma.post.update({
        where: { id },
        data: req.body,
      });

      res.json(post);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /posts/:id — delete a post
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        throw new AppError(400, "Post ID must be an integer");
      }

      // Verify post exists before deleting
      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError(404, `Post with ID ${id} not found`);
      }

      await prisma.post.delete({ where: { id } });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
