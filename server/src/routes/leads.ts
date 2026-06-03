import { Router } from 'express';
import { 
  getLeads, 
  getLeadById, 
  createLead, 
  updateLead, 
  patchLeadStage, 
  deleteLead, 
  bulkDeleteLeads, 
  bulkUpdateLeadsStage, 
  convertLeadToCustomer,
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
  bulkDeleteSchema,
  bulkUpdateStageSchema
} from '../controllers/leads';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate); // Secure all lead routes

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', validate(createLeadSchema), createLead);
router.put('/:id', validate(updateLeadSchema), updateLead);
router.patch('/:id/stage', validate(updateStageSchema), patchLeadStage);
router.delete('/:id', deleteLead);
router.post('/bulk-delete', validate(bulkDeleteSchema), bulkDeleteLeads);
router.post('/bulk-update-stage', validate(bulkUpdateStageSchema), bulkUpdateLeadsStage);
router.post('/:id/convert', convertLeadToCustomer);

export default router;
