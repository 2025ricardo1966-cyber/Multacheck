import * as planService from "./plan.service.js";

export function listPlans(_req, res) {
  const plans = planService.listPublicPlans();
  res.json({ success: true, data: plans, plans });
}
