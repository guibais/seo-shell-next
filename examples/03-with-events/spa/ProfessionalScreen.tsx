import { useEffect, useState } from "react";
import { watchEvent } from "@seo-shell/events";

type Professional = {
  slug: string;
  name: string;
  bio: string;
  services: string[];
};

export function ProfessionalScreen() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unwatchProfessional = watchEvent<Professional>(
      "professional",
      (data) => {
        setProfessional(data);
      }
    );

    const unwatchReady = watchEvent("ready", () => {
      setIsReady(true);
    });

    return () => {
      unwatchProfessional();
      unwatchReady();
    };
  }, []);

  if (!professional) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{professional.name}</h1>
      <p>{professional.bio}</p>
      <h2>Services</h2>
      <ul>
        {professional.services.map((service) => (
          <li key={service}>{service}</li>
        ))}
      </ul>
      {isReady && <p>Page is ready!</p>}
    </div>
  );
}
