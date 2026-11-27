import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

export const OfferLetter = ({
  candidate,
  offer,
  onAccept,
  readOnly = false,
  onTriggerToast
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const offerData = offer || candidate?.onboarding?.offer || {
    number: "OFF-2026-001",
    designation: "Associate Software Engineer",
    department: "Engineering",
    location: "Hyderabad, Telangana",
    joiningDate: "2026-09-04",
    issuedAt: "2026-08-24"
  };

  const companyInfo = {
    name: "TechnoMold IT Solutions PVT LTD",
    city: "Hyderabad",
    state: "Telangana",
    address: "H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084",
    phone: "+91 9493945440",
    email: "info@moldite.com",
    website: "https://moldite.com"
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmAccept = () => {
    setIsAccepting(true);
    try {
      if (onAccept) onAccept();
      setShowConfirmModal(false);
      onTriggerToast && onTriggerToast("Offer successfully accepted!");
    } catch (e) {
      onTriggerToast && onTriggerToast(e.message || "Failed to accept offer");
    } finally {
      setIsAccepting(false);
    }
  };

  const isAccepted = Boolean(offerData.acceptedAt);
  const candidateName = candidate?.name || "VINAY RAYAPUDI";

  return (
    <div className="flex flex-col gap-4 text-xs font-serif">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #offer-letter-printable, #offer-letter-printable * {
            visibility: visible !important;
          }
          #offer-letter-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 36px 48px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            font-family: serif !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Action Header (No Print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface2/60 border border-line">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold">
            <Icon name="file-text" className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-ink text-xs font-sans">Official Letter of Employment</div>
            <div className="text-[11px] text-muted font-sans">
              Offer Ref: <span className="font-data font-semibold text-accent">{offerData.number || "OFF-2026-001"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 w-full sm:w-auto font-sans">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-surface2 border border-line text-xs font-semibold text-ink hover:border-accent hover:text-accent transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Icon name="printer" className="w-3.5 h-3.5 text-muted" />
            <span>Print / Download PDF</span>
          </button>

          {!readOnly && !isAccepted && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.99] transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Icon name="check" className="w-3.5 h-3.5 text-on-accent" />
              <span>Accept Offer</span>
            </button>
          )}

          {isAccepted && (
            <span className="px-3 py-1.5 rounded-lg bg-good/15 text-good border border-good/30 text-xs font-semibold flex items-center gap-1.5">
              <Icon name="check" className="w-3.5 h-3.5 text-good" />
              <span>Accepted on {new Date(offerData.acceptedAt).toLocaleDateString("en-IN")}</span>
            </span>
          )}
        </div>
      </div>

      {/* Formal Printable Document Card */}
      <div
        id="offer-letter-printable"
        className="p-6 md:p-10 rounded-2xl bg-surface/90 border border-line shadow-lg flex flex-col gap-6 text-ink leading-relaxed"
      >
        {/* Top Confidential Header */}
        <div className="flex justify-between items-start border-b border-line pb-4 text-[11px] text-muted">
          <span className="font-bold tracking-wider text-accent uppercase">PRIVATE AND CONFIDENTIAL</span>
          <span>Date: 24 August 2026</span>
        </div>

        {/* Recipient Details */}
        <div className="space-y-1">
          <div className="font-bold text-ink text-sm">{candidateName}</div>
          <div>Dear {candidateName},</div>
          <div className="font-bold text-accent pt-1">Welcome to TechnoMold IT Solutions PVT LTD!</div>
        </div>

        {/* Opening Paragraph */}
        <p className="text-justify leading-relaxed">
          It was a pleasure meeting you to explore a career opportunity with <strong className="text-ink">TechnoMold IT Solutions PVT LTD</strong>. Based on our discussions, we are pleased to offer you the position of <strong className="text-ink">Associate Software Engineer</strong>, in <strong className="text-ink">Band 5, Level 5</strong> with our organization. The gross compensation will be <strong className="text-ink">INR 4,50,000/- (Four Lakh Fifty Thousand rupees only) per annum</strong>. The details of the terms and conditions of the offer of employment are detailed in the enclosed annexure.
        </p>

        <p className="text-justify leading-relaxed text-muted">
          TechnoMold IT Solutions PVT LTD is defined by a strong and intrinsic culture that sets us apart. Our DNA, while evolving through various transformations, has still fundamentally been driven by the same core values. Customer centricity has been one such tenet that influences every TechnoMold IT Solutions PVT LTD. We strive to understand our customer's need, staying ahead of the curve to deliver best-in-class service. Equally crucial, is our outcome focus, wherein our eyes stay on the end result without compromising on our quality, ethics and people. We draw our greatest strength from our people. Hence, empowering our workforce has gone hand-in-hand with greater accountability, thereby creating responsible citizens of the world. As we redefine what business success means in the changing landscape, we believe in inculcating the spirit of experimentation so that established systems and ways of doing things are constantly tested, questioned and disrupted. Imagination, innovation and the ability to take risks are fundamental characteristics that make us shatter boundaries.
        </p>

        <p className="text-justify leading-relaxed text-muted">
          These shared values and beliefs are the influencers of everyday work culture at TechnoMold IT Solutions PVT LTD that has eventually built our ethos. It is what integrates us across technologies, platforms and geographies. We are proud of it and we eagerly welcome you to the TechnoMold IT Solutions PVT LTD way of life.
        </p>

        <p className="text-justify leading-relaxed">
          This offer of employment is contingent upon you fulfilling the background verification process that the organization will conduct. We look forward to you joining us at our Hyderabad office on <strong className="text-ink">4 September 2026</strong>. The reporting time is <strong className="text-ink">12:00 pm</strong>. Please keep your recruiter informed, in case of an advancement in the joining date.
        </p>

        <p className="font-semibold text-ink">
          Please endorse your acceptance on or before 26 August 2026.
        </p>

        <div className="text-[10px] text-muted border-b border-line pb-4">
          ✆ +91 9493945440  |  ✉ info@moldite.com  |  💻 https://moldite.com<br />
          📍 H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084
        </div>

        {/* ANNEXURE - 1 */}
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wide border-b border-line pb-1">ANNEXURE - 1</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface2/40 p-3 rounded-xl border border-line text-[11px]">
            <div><span className="text-muted block">Name</span><strong>VINAY RAYAPUDI</strong></div>
            <div><span className="text-muted block">Band</span><strong>Band 5</strong></div>
            <div><span className="text-muted block">Level</span><strong>Level 5</strong></div>
            <div><span className="text-muted block">Designation</span><strong>Associate Software Engineer</strong></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-line text-[11px]">
              <thead className="bg-surface2/60 text-muted uppercase">
                <tr>
                  <th className="p-2 border-r border-line">SALARY COMPONENT</th>
                  <th className="p-2 border-r border-line text-right">MONTHLY GROSS</th>
                  <th className="p-2 text-right">ANNUAL GROSS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr><td className="p-2 border-r border-line">Basic Salary</td><td className="p-2 border-r border-line text-right">10,050</td><td className="p-2 text-right">1,20,600</td></tr>
                <tr><td className="p-2 border-r border-line">Conveyance Allowance (CA)</td><td className="p-2 border-r border-line text-right">1,515</td><td className="p-2 text-right">18,180</td></tr>
                <tr><td className="p-2 border-r border-line">House Rent Allowance (HRA)</td><td className="p-2 border-r border-line text-right">5,029</td><td className="p-2 text-right">60,348</td></tr>
                <tr><td className="p-2 border-r border-line">Other Allowances</td><td className="p-2 border-r border-line text-right">8,415</td><td className="p-2 text-right">1,00,980</td></tr>
                <tr className="bg-surface2/30 font-semibold"><td className="p-2 border-r border-line">Base Compensation</td><td className="p-2 border-r border-line text-right">25,009</td><td className="p-2 text-right">3,00,108</td></tr>
                <tr><td className="p-2 border-r border-line">Employee Provident Fund (EPF)</td><td className="p-2 border-r border-line text-right">1,206</td><td className="p-2 text-right">14,472</td></tr>
                <tr><td className="p-2 border-r border-line">Health Insurance</td><td className="p-2 border-r border-line text-right">945</td><td className="p-2 text-right">11,340</td></tr>
                <tr><td className="p-2 border-r border-line">Gratuity Fund</td><td className="p-2 border-r border-line text-right">483</td><td className="p-2 text-right">5,796</td></tr>
                <tr className="bg-surface2/30 font-semibold"><td className="p-2 border-r border-line">Gross Compensation</td><td className="p-2 border-r border-line text-right">27,643</td><td className="p-2 text-right">3,31,716</td></tr>
                <tr><td className="p-2 border-r border-line">Employer Provident Fund</td><td className="p-2 border-r border-line text-right">1,206</td><td className="p-2 text-right">14,472</td></tr>
                <tr><td className="p-2 border-r border-line">Variable Pay</td><td className="p-2 border-r border-line text-right">8,651</td><td className="p-2 text-right">1,03,812</td></tr>
                <tr className="bg-accent/10 font-bold text-accent"><td className="p-2 border-r border-line">Total</td><td className="p-2 border-r border-line text-right">37,500</td><td className="p-2 text-right">4,50,000</td></tr>
              </tbody>
            </table>
          </div>

          <div className="text-[11px] space-y-1 text-muted">
            <p><strong>Note:</strong></p>
            <p>1. As per Statutory regulations, if you are covered under Payment of Bonus act, this component will be paid as "Bonus"; if not, it will be paid as "Ex-Gratia".</p>
            <p>2. Variable Pay (if applicable) will be payable on Quarterly basis. Amount shown is payable on 100% Target achievement.</p>
          </div>
        </div>

        <div className="text-[10px] text-muted border-b border-line pb-4">
          ✆ +91 9493945440  |  ✉ info@moldite.com  |  💻 https://moldite.com<br />
          📍 H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084
        </div>

        {/* ADDITIONAL BENEFITS */}
        <div className="space-y-2 pt-2">
          <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wide">Additional Benefits</h3>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-muted">
            <li>Additionally, you shall be eligible for gratuity as per the gratuity act, subject to 5 years of continuous employment with the organization.</li>
            <li>You are covered under the Company's Group Mediclaim Insurance policy. This mandatory coverage also includes your spouse and up to two children.</li>
            <li>You are covered under the Company's Group Personal Accident Insurance policy & Standard Group Term Life Insurance policy.</li>
            <li>As per the Maternity Benefit (Amendment) Act, 2017, women employees are eligible for Maternity Leave of 26 weeks.</li>
          </ul>
        </div>

        <div className="text-[10px] text-muted border-b border-line pb-4">
          ✆ +91 9493945440  |  ✉ info@moldite.com  |  💻 https://moldite.com<br />
          📍 H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084
        </div>

        {/* ANNEXURE - 2: TERMS OF EMPLOYMENT */}
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wide">ANNEXURE - 2: TERMS OF EMPLOYMENT</h3>
          <div className="space-y-2 text-[11px] text-muted leading-relaxed">
            <p><strong>1) Hours of Work:</strong> A working day shall comprise of nine hours across 24x7 shifts if applicable, including client site working hours.</p>
            <p><strong>2) Place of Employment:</strong> Liable to be transferred or deputed to any offices, departments of the Company or its Associates/Subsidiaries in India or abroad.</p>
            <p><strong>3) Notice Period & Termination:</strong> Three months prior notice by either side is mandatory. Immediate termination applies in case of misconduct or discrepancy in documents.</p>
            <p><strong>4) Confidentiality & IP:</strong> Strict non-disclosure of trade secrets, proprietary code, and company assets during and post-employment.</p>
            <p><strong>5) Training Period:</strong> Mandatory training period with a consolidated monthly stipend of INR 22,000 before confirmation as Associate Software Engineer.</p>
          </div>
        </div>

        <div className="text-[10px] text-muted border-b border-line pb-4">
          ✆ +91 9493945440  |  ✉ info@moldite.com  |  💻 https://moldite.com<br />
          📍 H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084
        </div>

        {/* ACKNOWLEDGEMENT */}
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wide">Acknowledgement and Acceptance of Appointment</h3>
          <p className="text-justify leading-relaxed">
            I, <strong className="text-ink">{candidateName}</strong>, have read and understood the above terms and conditions governing my employment with the company and hereby accept the above-mentioned appointment in totality. I confirm my acceptance of the offer and shall report for work on <strong className="text-accent">4 September 2026</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-[11px]">
            <div>Signature: __________________________</div>
            <div>Name: {candidateName}</div>
            <div>Date: _____________________________</div>
            <div>Place: Hyderabad</div>
          </div>
        </div>

        <div className="text-[10px] text-muted border-b border-line pb-4">
          ✆ +91 9493945440  |  ✉ info@moldite.com  |  💻 https://moldite.com<br />
          📍 H-05, G-Floor, Modern Profound Tech Park, White Field Rd, Kondapur, Whitefields, Gachibowli, Hyderabad, Telangana 500084
        </div>

        {/* ANNEXURE - 3: MANDATORY DOCUMENTS */}
        <div className="space-y-3 pt-2">
          <h3 className="font-display font-bold text-ink text-sm uppercase tracking-wide">ANNEXURE - 3: Onboarding Documents</h3>
          <p className="text-[11px] text-muted">List of mandatory documents that need to be uploaded as part of your offer release process:</p>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-muted">
            <li><strong>Photograph:</strong> Soft copy of white background passport size photograph.</li>
            <li><strong>Education Documents:</strong> Highest education degree/provisional certificate & all semester marks cards.</li>
            <li><strong>Identity Proof:</strong> Passport / PAN Card / Election ID / Driving License.</li>
            <li><strong>Employment Details:</strong> Last 3 months salary slips, offer letter & relieving/experience letters.</li>
            <li><strong>LOA:</strong> Signed scanned copy of Letter of Authorization (LOA).</li>
          </ul>

          <div className="mt-4 p-3 rounded-xl bg-surface2/40 border border-line text-[11px] space-y-1">
            <div><strong>Contact Person:</strong> Sreekanth (sreekanth@moldite.com)</div>
            <div><strong>Reporting Time:</strong> 12:00 pm at Hyderabad Office</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal via Portal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in font-sans">
          <div
            className="w-full max-w-md p-6 rounded-2xl bg-surface border border-line shadow-2xl flex flex-col gap-4 text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
                <Icon name="check" className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink text-base">Accept Offer of Employment</h3>
                <p className="text-xs text-muted">TechnoMold IT Solutions PVT LTD</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface2/60 border border-line text-xs text-muted leading-relaxed">
              I, <strong className="text-ink">{candidateName}</strong>, hereby formally accept the offer as <strong className="text-ink">Associate Software Engineer</strong> (Band 5, Level 5) with a gross compensation of <strong className="text-accent">₹4,50,000/- p.a.</strong> and joining date <strong className="text-ink">4 September 2026</strong>.
            </div>

            <div className="flex flex-row justify-end items-center gap-2 pt-2 border-t border-line">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-surface2 border border-line text-xs font-semibold text-ink hover:bg-surface2/80 transition cursor-pointer"
              >
                Review Terms
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isAccepting}
                className="px-5 py-2 rounded-lg bg-accent text-on-accent text-xs font-semibold hover:brightness-105 active:scale-[0.99] transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isAccepting ? "Accepting..." : "Confirm & Accept Offer"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};