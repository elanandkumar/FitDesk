import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getDatabase } from '../database/db';
import { insertNotificationIfNew } from '../database/repositories/appNotificationRepository';
import { hasBackupRelevantData } from '../database/repositories/backupRepository';

const OVERDUE_DAYS = 7;

interface BackupContextValue {
  isBackupOverdue: boolean;
  refresh: () => Promise<void>;
}

const BackupContext = createContext<BackupContextValue>({
  isBackupOverdue: false,
  refresh: async () => {},
});

export function BackupProvider({ children }: { children: React.ReactNode }) {
  const [isBackupOverdue, setIsBackupOverdue] = useState(false);

  const refresh = useCallback(async () => {
    const db = await getDatabase();
    const hasData = await hasBackupRelevantData();
    if (!hasData) {
      setIsBackupOverdue(false);
      return;
    }

    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'last_backup_at'"
    );
    const val = row?.value;
    if (!val) {
      setIsBackupOverdue(true);
      insertNotificationIfNew(
        'backup_overdue',
        'Back up FitDesk',
        "Your data has never been backed up."
      ).catch(() => {});
      return;
    }
    const daysSince = (Date.now() - new Date(val).getTime()) / (1000 * 60 * 60 * 24);
    const overdue = daysSince > OVERDUE_DAYS;
    setIsBackupOverdue(overdue);
    if (overdue) {
      insertNotificationIfNew(
        'backup_overdue',
        'Back up FitDesk',
        `Your data hasn't been backed up in ${Math.floor(daysSince)} days.`
      ).catch(() => {});
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <BackupContext.Provider value={{ isBackupOverdue, refresh }}>
      {children}
    </BackupContext.Provider>
  );
}

export function useBackup() {
  return useContext(BackupContext);
}
