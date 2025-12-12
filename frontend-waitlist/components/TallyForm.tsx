"use client";

import { useEffect } from "react";

const TALLY_FORM_ID = "VLGzPg";

interface TallyFormProps {
  referralSource?: string | null;
}

export function TallyForm({ referralSource }: TallyFormProps) {
  const getTallyUrl = () => {
    const baseUrl = `https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&dynamicHeight=1`;
    if (referralSource) {
      return `${baseUrl}&ref=${encodeURIComponent(referralSource)}`;
    }
    return baseUrl;
  };

  useEffect(() => {
    const scriptUrl = "https://tally.so/widgets/embed.js";
    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="w-full max-w-[600px] mt-8 md:mt-16">
      <iframe
        data-tally-src={getTallyUrl()}
        loading="lazy"
        width="100%"
        height="1035"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title="Join the waitlist"
        className="w-full"
      />
    </div>
  );
}
