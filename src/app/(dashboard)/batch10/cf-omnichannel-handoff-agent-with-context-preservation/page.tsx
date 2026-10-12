"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Omnichannel handoff agent with context preservation";
const API_PATH = "/api/cf-omnichannel-handoff-agent-with-context-preservation";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
