"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No CRM bi-directional sync (Salesforce, HubSpot)";
const API_PATH = "/api/gap-no-crm-bi-directional-sync-salesforce";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
