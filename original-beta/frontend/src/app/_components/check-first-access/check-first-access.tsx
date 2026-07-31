'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

function CheckFirstAccess() {
  const router = useRouter();
  const goCheckTerms = useCallback(() => {
    router.push('/check-terms');
  }, [router]);

  useEffect(() => {
    const firstFlag = sessionStorage.getItem('FirstSession');

    if (firstFlag === 'false') {
      return;
    }
    sessionStorage.setItem('FirstSession', 'false');
    goCheckTerms();
  }, [goCheckTerms]);

  return <></>;
}

export default CheckFirstAccess;
