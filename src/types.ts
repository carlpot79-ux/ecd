export interface ScreeningData {
  id: number;
  Type: 'screening';
  SheetName: string;
  Date: string;
  Creche: string;
  Subdistrict: string;
  Age: string;
  NumberChildren: number;
  '%CariesFree': number;
  '%Abscess': number;
  AvgInitialCaries: number;
  AvgDecayed: number;
  AvgMissing: number;
  AvgFilled: number;
  Avgdmft: number;
  By: string;
  synced?: boolean;
}

export interface MonitoringData {
  id: number;
  Type: 'monitoring';
  SheetName: string;
  Date: string;
  Creche: string;
  Subdistrict: string;
  NewConsent: number;
  Toothbrushes: number;
  Toothpaste: number;
  NormsAndStandards: 'Yes' | 'No';
  ChildrenEducated: number;
  ParentsEducated: number;
  FV1: number;
  FV2: number;
  FV3: number;
  By: string;
  synced?: boolean;
}

export type AppData = ScreeningData | MonitoringData;
