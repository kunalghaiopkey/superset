import { useEffect } from 'react';
import { SupersetClient } from '@superset-ui/core';

const usePingPoller = () => {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = () => {
      SupersetClient.get({ endpoint: '/login/ping' })
        .then(response => {
          const opkeyCookies = response.json ;

          if (opkeyCookies && opkeyCookies.UserDTO ) {
            let user= JSON.stringify(opkeyCookies.UserDTO);
            let projectDto=JSON.stringify(opkeyCookies.ProjectDTO);
            localStorage.setItem("UserDTO",btoa(user));
            localStorage.setItem("ProjectDTO", btoa(projectDto));

            timeoutId = setTimeout(poll, 30000);
          } else {
            window.location.href = window.location.origin;
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

export default usePingPoller;
