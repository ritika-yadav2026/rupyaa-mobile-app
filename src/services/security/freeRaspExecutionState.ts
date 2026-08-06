import { consoleLogDev } from '@/src/utils/consoleLogDev';

export const freeRaspExecutionStateActions = {
  allChecksFinished: () => {
    consoleLogDev('[freeRASP] Initial security checks finished');
  },
};
