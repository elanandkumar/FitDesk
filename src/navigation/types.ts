import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  ClassSeriesList: undefined;
  AddEditClassSeries: {
    seriesId?: number;
    prefillPackage?: {
      traineeId: number;
      month: string;
      totalSessions: number;
      amount: number;
      notes?: string;
    };
  };
  ClassSessionDetail: { sessionId: number };
  AddEditOrganizer: { organizerId?: number; returnToAddSession?: boolean };
  OrganizerDetail: { organizerId: number };
  AddEditTrainee: { traineeId?: number };
  TraineeDetail: { traineeId: number };
  ClassTypes: undefined;
  Centers: undefined;
  DataScreen: undefined;
  AddPackage: { traineeId?: number };
  AddSession: { initialDate?: string; selectedOrganizerId?: number };
  IncomeSummary: undefined;
  IncomeMonthDetail: { month: string };
  OrganizerPaymentDetail: {
    organizerId: number;
    organizerName: string;
    pendingOnly: boolean;
    sortOrder: 'pending' | 'az' | 'za';
  };
  Notifications: undefined;
  PaymentThresholds: undefined;
  WhatsNew: undefined;
  PrivacyPolicy: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Contacts: undefined;
  Payments: {
    initialSegment?: 'organizers' | 'trainees';
    pendingOnly?: boolean;
    focusKey?: number;
    notice?: string;
  } | undefined;
  Settings: undefined;
};
