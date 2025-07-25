import { useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';

const useLicensePoller = () => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = () => {
      SupersetClient.get({ endpoint: '/BI/ValidateLicense' })
        .then(response => {
          console.log('response', response);
          const isValid = response && typeof response.json == 'boolean' && response.json == true;

          if (isValid == true) {
            timeoutId = setTimeout(poll, 30000);
          } else {
            window.location.href = `${window.location.origin}/bistudio/license/error/`;
          }
        })
        .catch(error => {
          console.error('error', error);
        })
      
    };

    poll(); 

    return () => clearTimeout(timeoutId); 
  }, []);
};

export default useLicensePoller;
