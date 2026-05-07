import * as planService from "./plan.service.js";

export function listPlans(_req, res) {
  res.json({ plans: planService.listPublicPlans() });
}
