export const NO_SELECTED_TERM_MESSAGE = 'Select a term in the header.';
export const NO_RECORDS_FOR_SELECTED_TERM = 'No records for selected term';

export type ActiveTermResult = {
  termId: string | null;
  message: string | null;
};

export function getActiveTermId(): ActiveTermResult {
  if (typeof window === 'undefined') {
    return { termId: null, message: NO_SELECTED_TERM_MESSAGE };
  }

  const termId = window.localStorage.getItem('kauri.termId')?.trim() ?? '';
  if (!termId) {
    return { termId: null, message: NO_SELECTED_TERM_MESSAGE };
  }

  return { termId, message: null };
}
