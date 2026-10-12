"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Real-time sales / support coaching for human agents";
const API_PATH = "/api/cf-real-time-sales-support-coaching-for";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
