import { Router } from 'express';
import { PackagesController } from '../controllers/packages.controller.js';

const router = Router();

router.get('/', PackagesController.getPackages);
router.put('/:slug', PackagesController.updatePackage);

export default router;
