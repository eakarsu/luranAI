import { Prisma, type RuntimeAiResult } from "@prisma/client";
import { getUser } from "./auth";
import { getTenantContext } from "./tenant";
import prisma from "./prisma";
import { createFeatureReportHandlers, type FeatureReport, type ProviderReport, type ReportActor, type ReportStore } from "./feature-reports";

function scope(actor: ReportActor, feature: string): Prisma.RuntimeAiResultWhereInput {
  if (!actor.tenantId) throw new Error("A current organization membership is required");
  return { userId: actor.id, AND: [
    { providerReceipt: { path: ["feature"], equals: feature } },
    { providerReceipt: { path: ["tenantId"], equals: actor.tenantId } },
  ] };
}
function report(row: RuntimeAiResult): FeatureReport {
  return { id: row.id, prompt: row.prompt, content: row.content, model: row.model, createdAt: row.createdAt, receipt: row.providerReceipt };
}
function data(actor: ReportActor, feature: string, prompt: string, result: ProviderReport) {
  return { userId: actor.id, prompt, content: result.content, model: result.model, provider: "openrouter", providerReceipt: JSON.parse(JSON.stringify({ feature, tenantId: actor.tenantId, receipt: result.receipt })) as Prisma.InputJsonValue };
}
const store: ReportStore = {
  async list(actor, feature) { return (await prisma.runtimeAiResult.findMany({ where: scope(actor, feature), orderBy: { createdAt: "desc" }, take: 50 })).map(report); },
  async find(actor, feature, id) { const row = await prisma.runtimeAiResult.findFirst({ where: { ...scope(actor, feature), id } }); return row ? report(row) : null; },
  async create(actor, feature, prompt, result) { return report(await prisma.runtimeAiResult.create({ data: data(actor, feature, prompt, result) })); },
  async update(actor, feature, previous, prompt, result) {
    return prisma.$transaction(async tx => {
      const changed = await tx.runtimeAiResult.updateMany({ where: { ...scope(actor, feature), id: previous.id, prompt: previous.prompt, content: previous.content, model: previous.model }, data: data(actor, feature, prompt, result) });
      if (changed.count !== 1) return null;
      const row = await tx.runtimeAiResult.findFirst({ where: { ...scope(actor, feature), id: previous.id } });
      return row ? report(row) : null;
    });
  },
  async delete(actor, feature, previous) {
    const deleted = await prisma.runtimeAiResult.deleteMany({ where: { ...scope(actor, feature), id: previous.id, prompt: previous.prompt, content: previous.content, model: previous.model } });
    return deleted.count === 1;
  },
};
export function batchFeatureHandlers(feature: string, title: string) {
  return createFeatureReportHandlers({ feature: `batch10-advisory:${feature}`, title, store, authenticate: async () => {
    const user = await getUser();
    if (!user) return null;
    const tenant = await getTenantContext();
    return tenant && tenant.userId === user.id ? { id: user.id, tenantId: tenant.orgId } : null;
  } });
}
