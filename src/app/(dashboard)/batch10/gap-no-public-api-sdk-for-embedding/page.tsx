"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No public API + SDK for embedding agents in customer apps";
const API_PATH = "/api/gap-no-public-api-sdk-for-embedding";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
