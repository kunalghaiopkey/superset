import { useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';

const useLicensePoller = () => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = () => {
      SupersetClient.get({ endpoint: '/BI/ValidateLicense' })
        .then(response => {
          console.log('response', response);
        })
        .catch(error => {
          console.error('error', error);
        })
        .finally(() => {
          timeoutId = setTimeout(poll, 30000);
        });
    };

    poll(); 

    return () => clearTimeout(timeoutId); 
  }, []);
};

export default useLicensePoller;
