"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No real-time conversation coaching for human agents";
const API_PATH = "/api/gap-no-real-time-conversation-coaching-for";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
