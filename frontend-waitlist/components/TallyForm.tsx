"use client";

import { useEffect } from "react";

const TALLY_FORM_ID = "VLGzPg";

interface TallySubmitPayload {
  formId: string;
  submissionId: string;
  fields: Array<{
    id: string;
    label: string;
    value: string | string[] | null;
  }>;
}

interface TallyFormProps {
  referralSource?: string | null;
}

declare global {
  interface Window {
    TallyConfig?: {
      formId: string;
      onSubmit?: (payload: TallySubmitPayload) => void;
    };
    Tally?: {
      loadEmbeds: () => void;
    };
  }
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
    // Set up TallyConfig to intercept submissions
    window.TallyConfig = {
      formId: TALLY_FORM_ID,
      onSubmit: (payload) => {
        console.log("Tally submission:", payload);
      },
    };

    const scriptUrl = "https://tally.so/widgets/embed.js";

    if (window.Tally) {
      window.Tally.loadEmbeds();
      return;
    }

    if (document.querySelector(`script[src="${scriptUrl}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.onload = () => {
      window.Tally?.loadEmbeds();
    };
    document.body.appendChild(script);

    return () => {
      delete window.TallyConfig;
    };
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
