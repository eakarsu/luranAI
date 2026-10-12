"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No A/B testing harness for prompts / scripts";
const API_PATH = "/api/gap-no-a-b-testing-harness-for";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
