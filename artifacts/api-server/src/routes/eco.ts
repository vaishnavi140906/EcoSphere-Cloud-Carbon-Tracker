import { Router, type IRouter } from "express";
import {
  GetEcoDashboardResponse,
  GetEcoRegionsResponse,
  GetEcoTrendsQueryParams,
  GetEcoTrendsResponse,
  GetEcoWorkloadsQueryParams,
  GetEcoWorkloadsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const regions = [
  { id: "aws-us-west-2", provider: "AWS", name: "US West (Oregon)", country: "United States", latitude: 45.6, longitude: -122.7, carbonIntensity: 82, renewablePercent: 94, status: "clean" },
  { id: "aws-us-east-1", provider: "AWS", name: "US East (N. Virginia)", country: "United States", latitude: 38.0, longitude: -77.5, carbonIntensity: 318, renewablePercent: 61, status: "improving" },
  { id: "aws-eu-north-1", provider: "AWS", name: "Europe (Stockholm)", country: "Sweden", latitude: 59.3, longitude: 18.1, carbonIntensity: 28, renewablePercent: 99, status: "clean" },
  { id: "aws-ap-south-1", provider: "AWS", name: "Asia Pacific (Mumbai)", country: "India", latitude: 19.1, longitude: 72.9, carbonIntensity: 624, renewablePercent: 32, status: "high" },
  { id: "gcp-us-central1", provider: "Google Cloud", name: "Iowa (us-central1)", country: "United States", latitude: 41.3, longitude: -93.6, carbonIntensity: 342, renewablePercent: 68, status: "improving" },
  { id: "gcp-europe-north1", provider: "Google Cloud", name: "Finland (europe-north1)", country: "Finland", latitude: 60.2, longitude: 24.9, carbonIntensity: 42, renewablePercent: 96, status: "clean" },
  { id: "gcp-asia-south1", provider: "Google Cloud", name: "Mumbai (asia-south1)", country: "India", latitude: 19.1, longitude: 72.9, carbonIntensity: 602, renewablePercent: 35, status: "high" },
  { id: "gcp-us-west1", provider: "Google Cloud", name: "Oregon (us-west1)", country: "United States", latitude: 45.6, longitude: -121.2, carbonIntensity: 88, renewablePercent: 92, status: "clean" },
  { id: "azure-westus2", provider: "Azure", name: "West US 2", country: "United States", latitude: 47.2, longitude: -119.9, carbonIntensity: 104, renewablePercent: 89, status: "clean" },
  { id: "azure-northeurope", provider: "Azure", name: "North Europe", country: "Ireland", latitude: 53.3, longitude: -6.3, carbonIntensity: 154, renewablePercent: 82, status: "improving" },
  { id: "azure-swedencentral", provider: "Azure", name: "Sweden Central", country: "Sweden", latitude: 60.7, longitude: 16.8, carbonIntensity: 31, renewablePercent: 98, status: "clean" },
  { id: "azure-centralindia", provider: "Azure", name: "Central India", country: "India", latitude: 18.5, longitude: 73.8, carbonIntensity: 637, renewablePercent: 29, status: "high" },
] as const;

const workloads = [
  { id: "wl-1042", workloadName: "recommendation-engine", provider: "AWS", region: "US West (Oregon)", startedAt: "2026-10-23T09:42:00.000Z", runtimeMinutes: 48, energyKwh: 12.8, carbonKg: 1.05, status: "efficient" },
  { id: "wl-1041", workloadName: "daily-warehouse-sync", provider: "Google Cloud", region: "Finland (europe-north1)", startedAt: "2026-10-23T08:15:00.000Z", runtimeMinutes: 112, energyKwh: 26.4, carbonKg: 1.11, status: "efficient" },
  { id: "wl-1040", workloadName: "image-processing-batch", provider: "Azure", region: "West US 2", startedAt: "2026-10-23T06:30:00.000Z", runtimeMinutes: 36, energyKwh: 18.2, carbonKg: 1.89, status: "moderate" },
  { id: "wl-1039", workloadName: "search-index-refresh", provider: "AWS", region: "US East (N. Virginia)", startedAt: "2026-10-22T23:10:00.000Z", runtimeMinutes: 76, energyKwh: 21.6, carbonKg: 6.87, status: "high" },
  { id: "wl-1038", workloadName: "customer-events-stream", provider: "Google Cloud", region: "Oregon (us-west1)", startedAt: "2026-10-22T21:58:00.000Z", runtimeMinutes: 123, energyKwh: 31.4, carbonKg: 2.76, status: "moderate" },
  { id: "wl-1037", workloadName: "api-production-eu", provider: "Azure", region: "Sweden Central", startedAt: "2026-10-22T19:35:00.000Z", runtimeMinutes: 1440, energyKwh: 56.2, carbonKg: 1.74, status: "efficient" },
  { id: "wl-1036", workloadName: "ml-training-v4", provider: "AWS", region: "Asia Pacific (Mumbai)", startedAt: "2026-10-22T16:20:00.000Z", runtimeMinutes: 185, energyKwh: 82.1, carbonKg: 51.23, status: "high" },
  { id: "wl-1035", workloadName: "billing-reconciliation", provider: "Google Cloud", region: "Iowa (us-central1)", startedAt: "2026-10-22T14:08:00.000Z", runtimeMinutes: 52, energyKwh: 14.8, carbonKg: 5.06, status: "high" },
  { id: "wl-1034", workloadName: "product-catalog-cache", provider: "Azure", region: "North Europe", startedAt: "2026-10-22T11:44:00.000Z", runtimeMinutes: 720, energyKwh: 33.6, carbonKg: 5.17, status: "moderate" },
  { id: "wl-1033", workloadName: "fraud-detection-stream", provider: "AWS", region: "Europe (Stockholm)", startedAt: "2026-10-22T09:52:00.000Z", runtimeMinutes: 96, energyKwh: 22.4, carbonKg: 0.63, status: "efficient" },
  { id: "wl-1032", workloadName: "thumbnail-generator", provider: "Google Cloud", region: "Mumbai (asia-south1)", startedAt: "2026-10-22T07:18:00.000Z", runtimeMinutes: 41, energyKwh: 16.3, carbonKg: 9.81, status: "high" },
  { id: "wl-1031", workloadName: "analytics-daily-rollup", provider: "Azure", region: "West US 2", startedAt: "2026-10-22T05:02:00.000Z", runtimeMinutes: 67, energyKwh: 19.7, carbonKg: 2.05, status: "moderate" },
  { id: "wl-1030", workloadName: "session-cleanup-job", provider: "AWS", region: "US West (Oregon)", startedAt: "2026-10-21T23:30:00.000Z", runtimeMinutes: 18, energyKwh: 4.2, carbonKg: 0.34, status: "efficient" },
  { id: "wl-1029", workloadName: "vector-embedding-batch", provider: "Google Cloud", region: "Finland (europe-north1)", startedAt: "2026-10-21T21:12:00.000Z", runtimeMinutes: 153, energyKwh: 44.8, carbonKg: 1.88, status: "efficient" },
  { id: "wl-1028", workloadName: "order-event-consumer", provider: "Azure", region: "Central India", startedAt: "2026-10-21T18:46:00.000Z", runtimeMinutes: 88, energyKwh: 24.5, carbonKg: 15.61, status: "high" },
  { id: "wl-1027", workloadName: "static-assets-build", provider: "AWS", region: "US East (N. Virginia)", startedAt: "2026-10-21T15:28:00.000Z", runtimeMinutes: 29, energyKwh: 7.3, carbonKg: 2.32, status: "moderate" },
  { id: "wl-1026", workloadName: "recommendation-engine", provider: "Google Cloud", region: "Oregon (us-west1)", startedAt: "2026-10-21T12:16:00.000Z", runtimeMinutes: 62, energyKwh: 17.8, carbonKg: 1.57, status: "efficient" },
  { id: "wl-1025", workloadName: "log-archiver", provider: "Azure", region: "Sweden Central", startedAt: "2026-10-21T08:55:00.000Z", runtimeMinutes: 204, energyKwh: 38.7, carbonKg: 1.20, status: "efficient" },
  { id: "wl-1024", workloadName: "ml-training-v3", provider: "AWS", region: "Asia Pacific (Mumbai)", startedAt: "2026-10-20T22:40:00.000Z", runtimeMinutes: 210, energyKwh: 96.4, carbonKg: 60.15, status: "high" },
  { id: "wl-1023", workloadName: "warehouse-query-runner", provider: "Google Cloud", region: "Iowa (us-central1)", startedAt: "2026-10-20T18:10:00.000Z", runtimeMinutes: 44, energyKwh: 11.9, carbonKg: 4.06, status: "high" },
  { id: "wl-1022", workloadName: "api-production-us", provider: "Azure", region: "West US 2", startedAt: "2026-10-20T14:48:00.000Z", runtimeMinutes: 1440, energyKwh: 52.8, carbonKg: 5.49, status: "moderate" },
  { id: "wl-1021", workloadName: "fraud-detection-stream", provider: "AWS", region: "Europe (Stockholm)", startedAt: "2026-10-20T10:24:00.000Z", runtimeMinutes: 108, energyKwh: 24.1, carbonKg: 0.67, status: "efficient" },
  { id: "wl-1020", workloadName: "customer-events-stream", provider: "Google Cloud", region: "Mumbai (asia-south1)", startedAt: "2026-10-19T22:05:00.000Z", runtimeMinutes: 134, energyKwh: 35.2, carbonKg: 21.19, status: "high" },
  { id: "wl-1019", workloadName: "daily-warehouse-sync", provider: "Azure", region: "North Europe", startedAt: "2026-10-19T15:36:00.000Z", runtimeMinutes: 104, energyKwh: 24.8, carbonKg: 3.82, status: "moderate" },
] as const;

router.get("/eco/dashboard", (_req, res) => {
  const response = GetEcoDashboardResponse.parse({
    footprintKg: 284.6,
    emissionsSavedKg: 126.8,
    renewablePercent: 72,
    treesEquivalent: 6,
    previousPeriodDelta: -12.4,
    totalWorkloads: 1842,
    updatedAt: new Date().toISOString(),
  });
  res.json(response);
});

router.get("/eco/regions", (_req, res) => {
  res.json(GetEcoRegionsResponse.parse(regions));
});

router.get("/eco/trends", (req, res) => {
  const parsed = GetEcoTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const range = parsed.data.range;
  const count = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const base = new Date("2026-10-23T12:00:00.000Z");
  const data = Array.from({ length: count }, (_, index) => {
    const dayOffset = count - index - 1;
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() - dayOffset);
    const wave = Math.sin(index * 0.82) * 9 + Math.cos(index * 0.31) * 5;
    const trend = (count - index) * (range === "7d" ? 1.1 : 0.23);
    const emissionsKg = Math.max(38, 82 + wave + trend);
    const energyKwh = Math.max(100, 212 + wave * 3 + trend * 2);
    return {
      date: date.toISOString().slice(0, 10),
      label: range === "7d"
        ? date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
        : date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      emissionsKg: Number(emissionsKg.toFixed(1)),
      energyKwh: Number(energyKwh.toFixed(1)),
    };
  });
  res.json(GetEcoTrendsResponse.parse(data));
});

router.get("/eco/workloads", (req, res) => {
  const parsed = GetEcoWorkloadsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { provider, region, search } = parsed.data;
  const normalizedSearch = search?.trim().toLowerCase();
  const filtered = workloads.filter((workload) => {
    if (provider && workload.provider !== provider) return false;
    if (region && workload.region !== region) return false;
    if (
      normalizedSearch &&
      !`${workload.workloadName} ${workload.provider} ${workload.region}`
        .toLowerCase()
        .includes(normalizedSearch)
    ) {
      return false;
    }
    return true;
  });
  res.json(GetEcoWorkloadsResponse.parse(filtered));
});

export default router;
