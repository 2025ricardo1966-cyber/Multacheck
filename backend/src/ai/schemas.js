import { z } from "zod";

export const RuleEngineOutputSchema = z.object({
  case_id: z.string(),
  final_score: z.number().min(0).max(100),
  decision: z.enum(["invalid_fine", "questionable", "likely_valid_fine"]),
  risk_profile: z.object({
    legal_risk: z.number(),
    economic_risk: z.number(),
    appeal_success_probability: z.number(),
  }),
  rules_applied: z.array(z.any()),
  explanation: z.array(z.string()),
});
