import { Router } from 'express';
import { 
  getDocuments, 
  getDocumentById, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  getDocumentVersions,
  restoreDocumentVersion
} from '../controllers/documentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All document routes require authentication
router.use(authMiddleware);

router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.post('/', createDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

// Versioning routes
router.get('/:id/versions', getDocumentVersions);
router.post('/:id/restore', restoreDocumentVersion);

export default router;
