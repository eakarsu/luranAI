"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "No telephony carrier abstraction layer documented (Twilio/Bandwidth/Vonage)";
const API_PATH = "/api/gap-no-telephony-carrier-abstraction-layer-documented";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
