"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No multilingual auto-translation pipeline";
const API_PATH = "/api/gap-no-multilingual-auto-translation-pipeline";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
