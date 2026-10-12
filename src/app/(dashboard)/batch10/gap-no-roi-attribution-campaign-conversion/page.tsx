"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No ROI attribution (campaign → conversion)";
const API_PATH = "/api/gap-no-roi-attribution-campaign-conversion";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
