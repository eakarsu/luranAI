"use client";
import FeatureReportWorkspace from "../../../../components/FeatureReportWorkspace";
const LABEL = "Voice + screen-share video agent for technical support";
const API_PATH = "/api/cf-voice-screen-share-video-agent-for";
export default function AdvisoryReportPage() { return <FeatureReportWorkspace title={LABEL} apiPath={API_PATH}/>; }
