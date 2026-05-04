import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient, deleteClient } from '../controllers/clientController';
import { authMiddleware, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', authorize('admin', 'team'), createClient);
router.put('/:id', authorize('admin', 'team'), updateClient);
router.delete('/:id', authorize('admin'), deleteClient);

export default router;
