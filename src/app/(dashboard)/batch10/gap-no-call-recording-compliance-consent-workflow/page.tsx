"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No call-recording compliance / consent workflow per region";
const API_PATH = "/api/gap-no-call-recording-compliance-consent-workflow";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
