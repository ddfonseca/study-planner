export class AllocationResultDto {
  subject: string;
  totalHours: number;
  hoursPerWeek: number;
  gap: number;
  percentage: number;
}

export class AllocationResponseDto {
  results: AllocationResultDto[];
  metadata: {
    weeksUntilExam: number;
    totalAvailableHours: number;
    weeklyHours: number;
    examDate: string;
  };
}
