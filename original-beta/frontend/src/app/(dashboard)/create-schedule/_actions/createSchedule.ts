'use server';

import { createScheduleDB } from '@/app/_db/schedule';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { scheduleContainer } from '../../../../../cosmos';

type ScheduleResponse = {
  answer: string;
};

export async function createSchedule(
  id: string,
  newSchedulework: string,
  newSchedulestartdate: string,
  newScheduleenddate: string,
  newScheduleConsiderations?: string
): Promise<ScheduleResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        newSchedulework: string;
        newSchedulestartdate: string;
        newScheduleenddate: string;
        newScheduleConsiderations?: string;
      },
      ScheduleResponse
    >('schedule', 'POST', {
      newSchedulework,
      newSchedulestartdate,
      newScheduleenddate,
      newScheduleConsiderations,
    });

    // log
    await createScheduleDB(scheduleContainer, {
      id,
      userId: user.id,
      createdAt: new Date(),
      title: undefined,
      scheduleworkForm: newSchedulework,
      startdateForm: newSchedulestartdate,
      enddateForm: newScheduleenddate,
      considerationForm: newScheduleConsiderations ?? '',
      outputForm: response.answer,
    });

    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Create schedule error:', error);
    throw new Error(
      error instanceof Error ? error.message : getMessage('E_F_00110', 'スケジュール')
    );
  }
}
