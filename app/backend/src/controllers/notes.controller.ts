import { Response, NextFunction } from 'express';
import { db } from '../../../../db';
import { notes, customers } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export async function getCustomerNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id: customerId } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Check customer exists and belongs to this matchmaker
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.matchmakerId, matchmakerId)));

    if (!customer) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const customerNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.customerId, customerId))
      .orderBy(desc(notes.createdAt));

    return res.status(200).json({
      data: customerNotes
    });
  } catch (err) {
    next(err);
  }
}

export async function createCustomerNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { id: customerId } = req.params;
    const { content, noteType } = req.body;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Check customer ownership
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.matchmakerId, matchmakerId)));

    if (!customer) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Customer not found or not assigned to you' }
      });
    }

    const [newNote] = await db
      .insert(notes)
      .values({
        customerId,
        matchmakerId,
        content,
        noteType: noteType || 'general'
      })
      .returning();

    logger.info(`Note created for customer ${customerId}: ${newNote.id}`);

    return res.status(201).json({
      data: newNote
    });
  } catch (err) {
    next(err);
  }
}

export async function updateNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { noteId } = req.params;
    const { content, noteType } = req.body;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Verify ownership via inner join with customers
    const [existing] = await db
      .select({ noteId: notes.id })
      .from(notes)
      .innerJoin(customers, eq(notes.customerId, customers.id))
      .where(and(eq(notes.id, noteId), eq(customers.matchmakerId, matchmakerId)));

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Note not found or not authorized' }
      });
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        content,
        noteType: noteType || undefined,
        updatedAt: new Date()
      })
      .where(eq(notes.id, noteId))
      .returning();

    logger.info(`Note updated: ${noteId}`);

    return res.status(200).json({
      data: updatedNote
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const matchmakerId = req.user?.matchmakerId;
    const { noteId } = req.params;

    if (!matchmakerId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    // Verify ownership
    const [existing] = await db
      .select({ noteId: notes.id })
      .from(notes)
      .innerJoin(customers, eq(notes.customerId, customers.id))
      .where(and(eq(notes.id, noteId), eq(customers.matchmakerId, matchmakerId)));

    if (!existing) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Note not found or not authorized' }
      });
    }

    await db
      .delete(notes)
      .where(eq(notes.id, noteId));

    logger.info(`Note deleted: ${noteId}`);

    return res.status(200).json({
      message: 'Note deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}
