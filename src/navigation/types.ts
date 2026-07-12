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
  AddEditManager: { managerId?: number };
  ManagerDetail: { managerId: number };
  AddEditTrainee: { traineeId?: number };
  TraineeDetail: { traineeId: number };
  ClassTypes: undefined;
  Centers: undefined;
  DataScreen: undefined;
  AddPackage: { traineeId?: number };
  AddSession: { initialDate?: string };
  IncomeSummary: undefined;
  IncomeMonthDetail: { month: string };
  ManagerPaymentDetail: { managerId: number; managerName: string };
  Notifications: undefined;
  PaymentThresholds: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Contacts: undefined;
  Payments: {
    initialSegment?: 'managers' | 'trainees';
    pendingOnly?: boolean;
    focusKey?: number;
    notice?: string;
  } | undefined;
  Settings: undefined;
};
