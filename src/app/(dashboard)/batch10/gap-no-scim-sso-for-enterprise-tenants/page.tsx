"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No SCIM / SSO for enterprise tenants";
const API_PATH = "/api/gap-no-scim-sso-for-enterprise-tenants";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
