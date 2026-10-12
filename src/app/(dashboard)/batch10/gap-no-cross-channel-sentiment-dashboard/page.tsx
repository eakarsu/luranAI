"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No cross-channel sentiment dashboard";
const API_PATH = "/api/gap-no-cross-channel-sentiment-dashboard";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
