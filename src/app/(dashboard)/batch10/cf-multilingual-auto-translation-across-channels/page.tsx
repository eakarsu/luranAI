"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Multilingual auto-translation across channels";
const API_PATH = "/api/cf-multilingual-auto-translation-across-channels";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
