"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No competitor call-recording benchmarking";
const API_PATH = "/api/gap-no-competitor-call-recording-benchmarking";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
