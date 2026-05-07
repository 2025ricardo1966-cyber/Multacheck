import { Router } from "express";
import * as tenantController from "./tenant.controller.js";
import { requireTenantAdmin } from "../core/access.control.js";

const router = Router();

router.get("/tenants/current", tenantController.getCurrentTenant);
router.patch(
  "/tenants/settings",
  requireTenantAdmin,
  tenantController.patchTenantSettings
);
router.post(
  "/tenants/members",
  requireTenantAdmin,
  tenantController.createTenantMember
);

export default router;
