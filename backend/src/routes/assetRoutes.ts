import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { authMiddleware } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);

// GET /api/assets - Fetch all assets for the tenant/workspace
router.get('/', async (req: any, res: any) => {
  try {
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';
    
    // For simplicity, we'll fetch assets by tenantId
    // In a full RBAC system, we'd also filter by workspaceId
    const assetsResult = await db.run(sql`
      SELECT * FROM creative_assets 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      assets: assetsResult.rows
    });
  } catch (error: any) {
    console.error('Fetch assets error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
});

// POST /api/assets/upload - Upload a new asset (Base64 for MVP persistence)
router.post('/upload', async (req: any, res: any) => {
  try {
    const { name, fileType, size, fileUrl, category } = req.body;
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';
    const userId = req.user?.id || 'unknown';
    const workspaceId = req.user?.workspaceId || req.user?.workspace_id || null;

    if (!name || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Name and file data are required'
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(sql`
      INSERT INTO creative_assets (
        id, tenant_id, workspace_id, uploaded_by,
        name, file_url, file_type, size, category,
        created_at, updated_at
      ) VALUES (
        ${id}, ${tenantId}, ${workspaceId}, ${userId},
        ${name}, ${fileUrl}, ${fileType}, ${size}, ${category},
        ${now}, ${now}
      )
    `);

    const newAsset = {
      id,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      uploaded_by: userId,
      name,
      file_url: fileUrl,
      file_type: fileType,
      size,
      category,
      created_at: now,
      updated_at: now
    };

    return res.status(201).json({
      success: true,
      asset: newAsset
    });
  } catch (error: any) {
    console.error('Upload asset error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload asset',
      error: error.message
    });
  }
});

// DELETE /api/assets/:id - Delete an asset
router.delete('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || req.user?.tenant_id || '';

    await db.run(sql`
      DELETE FROM creative_assets 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `);

    return res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete asset error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
});

export default router;
