import { Response } from 'express';
import { db } from '../db';
import { clients } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const allClients = await db.select().from(clients).where(eq(clients.tenantId, tenantId));
    res.json(allClients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients' });
  }
};

export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, id), eq(clients.tenantId, tenantId)),
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, email, industry, status } = req.body;

    const newClient = {
      id: uuidv4(),
      tenantId,
      name,
      email,
      industry,
      status: status || 'active',
      createdBy: req.user.userId,
    };

    await db.insert(clients).values(newClient);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ message: 'Error creating client' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const updates = req.body;

    await db.update(clients)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating client' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    await db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client' });
  }
};
