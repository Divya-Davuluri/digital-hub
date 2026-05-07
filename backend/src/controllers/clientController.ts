import { Request, Response } from 'express';
import { db } from '../db';
import { clients, workspaces } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getClients = async (req: Request, res: Response) => {
  try {
    const { tenantId, role, workspaceId } = req.user as any;
    
    // Strict isolation
    const allClients = await db.select().from(clients).where(
      role === 'client' 
        ? and(eq(clients.tenantId, tenantId), eq(clients.workspaceId, workspaceId))
        : eq(clients.tenantId, tenantId)
    );
    res.json(allClients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId, role, workspaceId } = req.user as any;

    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id), 
        eq(clients.tenantId, tenantId),
        role === 'client' ? eq(clients.workspaceId, workspaceId) : eq(clients.tenantId, tenantId)
      ),
    });

    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching client' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user as any;
    const { name, email, companyName, status } = req.body;

    // 1. Provision Workspace
    const workspaceId = uuidv4();
    const clientId = uuidv4();
    const slug = (companyName || name).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    await db.insert(workspaces).values({
      id: workspaceId,
      tenantId,
      clientId: clientId,
      clientName: name,
      name: companyName || name,
      slug,
    });

    // 2. Create Client
    const newClient = {
      id: clientId,
      tenantId,
      workspaceId,
      name,
      email,
      companyName: companyName || null,
      status: status || 'active',
    };

    await db.insert(clients).values(newClient);
    res.status(201).json(newClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating client' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user as any;
    const updates = req.body;

    await db.update(clients)
      .set({ ...updates })
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)));

    res.json({ message: 'Client updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user as any;

    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, id), eq(clients.tenantId, tenantId))
    });

    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Workspace deletion will cascade to client and users
    await db.delete(workspaces).where(eq(workspaces.id, client.workspaceId));

    res.json({ message: 'Client and workspace deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting client' });
  }
};
