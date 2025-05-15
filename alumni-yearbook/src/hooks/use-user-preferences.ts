import { useState, useEffect } from 'react';

export function useUserPreferences(email: string | null | undefined) {
  const [profilePicture, setProfilePicture] = useState<string>('/placeholder-avatar.png');

  useEffect(() => {
    async function fetchUserPreferences() {
      if (!email) return;

      try {
        const response = await fetch(`/api/preferences?email=${email}`);
        const data = await response.json();
        if (data.photoUrl) {
          setProfilePicture(data.photoUrl);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    }

    fetchUserPreferences();
  }, [email]);

  return { profilePicture };
}