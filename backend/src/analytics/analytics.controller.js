import * as analyticsService from "./analytics.service.js";

export async function overview(req, res) {
  try {
    const data = await analyticsService.overviewAnalytics(req.tenant.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function tenant(req, res) {
  try {
    const data = await analyticsService.tenantAnalytics(req.tenant.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function usage(req, res) {
  try {
    const data = await analyticsService.usageAnalytics(req.tenant.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
