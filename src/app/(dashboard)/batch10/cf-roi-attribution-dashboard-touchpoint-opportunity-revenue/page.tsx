"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "ROI attribution dashboard (touchpoint → opportunity → revenue)";
const API_PATH = "/api/cf-roi-attribution-dashboard-touchpoint-opportunity-revenue";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
