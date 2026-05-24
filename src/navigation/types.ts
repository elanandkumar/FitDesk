import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  ClassSeriesList: undefined;
  AddEditClassSeries: { seriesId?: number };
  ClassSessionDetail: { sessionId: number };
  AddEditManager: { managerId?: number };
  ManagerDetail: { managerId: number };
  AddEditTrainee: { traineeId?: number };
  TraineeDetail: { traineeId: number };
  ClassTypes: undefined;
  DataScreen: undefined;
  AddPackage: { traineeId?: number };
  AddSession: { initialDate?: string };
  IncomeSummary: undefined;
  IncomeMonthDetail: { month: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  People: NavigatorScreenParams<PeopleTabParamList>;
  Payments: NavigatorScreenParams<PaymentsTabParamList>;
  Settings: undefined;
};

export type PeopleTabParamList = {
  Managers: undefined;
  Trainees: undefined;
};

export type PaymentsTabParamList = {
  ManagerPayments: undefined;
  TraineePackages: undefined;
};
