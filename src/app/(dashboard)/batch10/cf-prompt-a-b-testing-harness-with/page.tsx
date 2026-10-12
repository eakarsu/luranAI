"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Prompt A/B testing harness with statistical significance";
const API_PATH = "/api/cf-prompt-a-b-testing-harness-with";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
