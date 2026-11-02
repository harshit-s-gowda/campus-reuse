import { Router } from 'express';
import { createProduct, getProduct, listProducts, addNotification } from '../db/index.js';
import { asyncRoute } from '../middleware/errors.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { productSchema } from '../middleware/schemas.js';
import { persistImages } from '../services/integrations.js';
const router = Router();
router.get('/', asyncRoute(async (req, res) => {
  const q = req.query; const result = await listProducts({ search:String(q.search||''), category:q.category as string, department:q.department as string, semester:q.semester as string, condition:q.condition as string, transactionType:q.transactionType as string, minPrice:q.minPrice ? Number(q.minPrice):undefined, maxPrice:q.maxPrice ? Number(q.maxPrice):undefined, sort:q.sort as string, page:q.page ? Number(q.page):1, limit:q.limit ? Number(q.limit):12 });
  res.json(result);
}));
router.get('/:id', asyncRoute(async (req, res) => { const product = await getProduct(Number(req.params.id)); if (!product) return res.status(404).json({ message:'Listing not found' }); res.json({ product }); }));
router.post('/', requireAuth, asyncRoute(async (req: AuthRequest, res) => { const input=productSchema.parse(req.body); const images=await persistImages(input.images); const product=await createProduct({ ...input, images, sellerId:req.user!.id }); await addNotification(req.user!.id,'Listing submitted','Your listing is now pending admin review.','LISTING_SUBMITTED'); res.status(201).json({ product, message:'Listing submitted for review' }); }));
export default router;
