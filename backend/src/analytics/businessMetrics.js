/**
 * KPIs de negocio sobre datos persistidos (sin tabla Payment en Prisma).
 * Ingresos: estimación STRIPE_DISCHARGE_UNIT_AMOUNT × descargos pagados en el período.
 */
export default class BusinessMetrics {
  constructor(prisma) {
    this.prisma = prisma;
  }

  daysBetween(d1, d2) {
    const ms = Math.max(0, d2.getTime() - d1.getTime());
    return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  dischargeUnitAmountCents() {
    const raw = process.env.STRIPE_DISCHARGE_UNIT_AMOUNT?.trim();
    const n = raw ? Number.parseInt(raw, 10) : 1000;
    return Number.isFinite(n) && n > 0 ? n : 1000;
  }

  dischargeCurrency() {
    return (
      process.env.STRIPE_DISCHARGE_CURRENCY?.trim().toLowerCase() || "usd"
    );
  }

  /** Pagos de descargo confirmados en el rango (webhook → tracePaidAt). */
  paidDischargesWhere(startDate, endDate) {
    return {
      tracePaidAt: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  async getConversionRate(start, end) {
    const analyses = await this.prisma.multa.count({
      where: { createdAt: { gte: start, lte: end } },
    });

    const payments = await this.prisma.multa.count({
      where: this.paidDischargesWhere(start, end),
    });

    return analyses > 0 ? (payments / analyses) * 100 : 0;
  }

  async getDashboard(startDate, endDate) {
    const paidWhere = this.paidDischargesWhere(startDate, endDate);

    const [totalUsers, totalAnalyses, paidDischarges, conversionRate] =
      await Promise.all([
        this.prisma.user.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        this.prisma.multa.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        this.prisma.multa.count({
          where: paidWhere,
        }),
        this.getConversionRate(startDate, endDate),
      ]);

    const unitCents = this.dischargeUnitAmountCents();
    const amountSumCents = paidDischarges * unitCents;
    const days = this.daysBetween(startDate, endDate);

    const revenueMajor = amountSumCents / 100;
    const avgPerSale =
      paidDischarges > 0 ? (revenueMajor / paidDischarges).toFixed(2) : "0.00";

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      users: {
        total: totalUsers,
        avgPerDay: (totalUsers / days).toFixed(1),
      },
      analyses: {
        total: totalAnalyses,
        perUser:
          totalUsers > 0 ? (totalAnalyses / totalUsers).toFixed(1) : "0.0",
      },
      revenue: {
        total: revenueMajor,
        currency: this.dischargeCurrency(),
        avgPerSale,
        transactions: paidDischarges,
        estimated: true,
        note:
          "Sin tabla Payment: total = STRIPE_DISCHARGE_UNIT_AMOUNT × pagos con tracePaidAt en el período.",
      },
      conversion: {
        rate: `${conversionRate.toFixed(2)}%`,
        formula: `${paidDischarges} pagos / ${totalAnalyses} análisis`,
      },
    };
  }
}
