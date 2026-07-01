import { useState } from "react";

interface ConsentForm {
  id: string;
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

const FORMS: ConsentForm[] = [
  {
    id: "general-consent",
    title: "General Patient Consent Form",
    subtitle: "To be completed at first registration",
    sections: [
      {
        heading: "1. Consent to Treatment",
        body:
          "I voluntarily consent to receive medical examination, treatment, and other healthcare services as deemed necessary by the attending physician or healthcare team. I understand that the practice of medicine is not an exact science and no guarantees have been made to me as to the outcome of any treatment or examination.",
      },
      {
        heading: "2. Medical Records & Privacy",
        body:
          "I authorise the clinic to use and disclose my protected health information for the purpose of treatment, payment, and healthcare operations in accordance with applicable Nigerian privacy laws. I understand my records will be kept confidential.",
      },
      {
        heading: "3. Emergency Treatment",
        body:
          "In case of a medical emergency where I am unable to consent, I authorise the medical team to take all necessary actions to preserve my health and life.",
      },
      {
        heading: "4. Patient Rights",
        body:
          "I have been informed of my rights as a patient, including the right to refuse treatment, the right to be informed about my condition, and the right to receive respectful and dignified care.",
      },
    ],
  },
  {
    id: "hospital-agreement",
    title: "Hospital Agreement & Undertaking",
    subtitle: "Agreement on hospital policies and responsibilities",
    sections: [
      {
        heading: "1. Payment Undertaking",
        body:
          "I, the patient or patient's representative, undertake to pay all charges for services rendered, including consultations, investigations, procedures, and medications. Failure to settle bills may result in legal action.",
      },
      {
        heading: "2. Valuables & Personal Property",
        body:
          "The hospital shall not be held responsible for loss of, or damage to, personal property or valuables brought onto the premises. Patients are advised to leave valuables at home.",
      },
      {
        heading: "3. Compliance with Hospital Rules",
        body:
          "I agree to follow all hospital rules and regulations, including visiting hours, noise restrictions, and instructions given by healthcare staff. Disruptive behaviour may result in discharge.",
      },
      {
        heading: "4. Discharge Against Medical Advice",
        body:
          "If I choose to leave against medical advice, I acknowledge that I do so at my own risk and release the hospital and medical staff from any responsibility for outcomes resulting from my early departure.",
      },
    ],
  },
  {
    id: "procedure-consent",
    title: "Procedure / Surgical Consent Form",
    subtitle: "To be signed before any invasive procedure",
    sections: [
      {
        heading: "1. Nature of Procedure",
        body:
          "I consent to the procedure as explained to me by my physician. The nature, risks, benefits, and alternatives have been discussed with me in a language I understand.",
      },
      {
        heading: "2. Risk Acknowledgement",
        body:
          "I understand that all medical procedures carry risks, including but not limited to: infection, bleeding, adverse reactions to anaesthesia, and unexpected complications. I accept these risks.",
      },
      {
        heading: "3. Photography & Education",
        body:
          "I consent to photographs or video being taken of my procedure for educational or clinical documentation purposes only, with my identity protected.",
      },
      {
        heading: "4. Blood & Transfusion",
        body:
          "I consent to blood transfusion and the administration of blood products if deemed medically necessary during my care, unless I have indicated a specific objection below.",
      },
    ],
  },
];

export function ConsentFormsPage() {
  const [selectedForm, setSelectedForm] = useState<ConsentForm | null>(null);

  if (selectedForm) {
    return <FormPrintView form={selectedForm} onBack={() => setSelectedForm(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consent & Agreement Forms</h1>
        <p className="text-sm text-slate-500 mt-1">
          Printable patient consent forms, hospital agreements, and undertaking forms.
        </p>
      </div>

      <div className="space-y-3">
        {FORMS.map((form) => (
          <button
            key={form.id}
            onClick={() => setSelectedForm(form)}
            className="w-full bg-white border border-slate-200 rounded-xl p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{form.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{form.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  📄 View / Print
                </span>
                <span className="text-slate-400">›</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500">
        <strong>Note:</strong> These forms are for use within the hospital. Completed physical copies
        should be signed and filed in the patient's medical records folder.
      </div>
    </div>
  );
}

function FormPrintView({ form, onBack }: { form: ConsentForm; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          ← Back to forms
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold"
        >
          🖨️ Print Form
        </button>
      </div>

      {/* Printable area */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6 print:border-0 print:p-0 print:shadow-none">
        {/* Header */}
        <div className="text-center border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            ClinicFlow Medical Centre
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{form.title}</h2>
          <p className="text-sm text-slate-500 mt-1">{form.subtitle}</p>
        </div>

        {/* Patient info fields */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            "Patient Full Name",
            "Date of Birth",
            "Hospital ID / Folder No.",
            "Date",
          ].map((label) => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <div className="border-b border-slate-400 h-7" />
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {form.sections.map((section) => (
            <div key={section.heading}>
              <p className="font-semibold text-slate-900 text-sm mb-1">{section.heading}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        {/* Signature section */}
        <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-slate-500 mb-1">Patient / Representative Signature</p>
            <div className="border-b border-slate-400 h-12" />
            <p className="text-xs text-slate-400 mt-1">Sign above</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Witnessed by (Staff)</p>
            <div className="border-b border-slate-400 h-12" />
            <p className="text-xs text-slate-400 mt-1">Staff name &amp; signature</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
          ClinicFlow · Built for Nigerian healthcare · © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
