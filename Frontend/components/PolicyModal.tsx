import React from 'react';
import { X, Download } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      <div className="relative bg-white max-w-3xl w-full rounded-sm shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between z-10 rounded-t-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Global SIRW Policy</h2>
            <p className="text-xs text-gray-500">Version 3.0 — Effective 1 March 2026</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-sm transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 text-sm text-gray-700 leading-relaxed space-y-8">

          {/* Section 1 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2">1. Effective Date</h3>
            <p>This policy is effective from <strong>1 March 2026</strong>.</p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2">2. Scope</h3>
            <p className="mb-3">
              This policy sets out the Maersk approach to short-term international remote work (SIRW), which is separate to the Permanent International Remote Work (PIRW) policy first published on 1 October 2023. This document is an internal global policy for Maersk, subsequently referred to as 'the company'.
            </p>
            <p className="mb-2 font-semibold text-gray-800">This policy does <u>not</u> cover terms and conditions for:</p>
            <ul className="list-disc ml-5 space-y-1 text-gray-600">
              <li>Colleagues on formal assignments, such as short-term (STA) and long-term (LTA) assignment</li>
              <li>Colleagues on business travel (e.g. training, site visits)</li>
              <li>Colleagues who commute on a regular basis from their country of residence to country of employment</li>
              <li>Colleagues who work away from the office in the same city/state of employment</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2">3. Purpose/Objective (Principles)</h3>
            <p className="mb-3">
              This policy provides a framework in which certain colleagues can request to work for a limited period of time, in a country other than the country of their employment. The policy addresses the tax and immigration implications of working in another country and sets out a position that manages the risk appropriately for both the company and individual colleague.
            </p>
            <ul className="list-disc ml-5 space-y-1 text-gray-600">
              <li>To protect the company and colleague from tax, immigration and legal risks</li>
              <li>To standardise the approach to SIRW across all regions and functions</li>
              <li>To provide clarity and understanding of the company position</li>
              <li>To ensure talent retention for critical roles and skills in an environment where colleagues might expect some flexibility of location</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3">4. Main Policy Statement</h3>

            <h4 className="font-semibold text-gray-800 mb-2">4.1 Short-term International Remote Work (SIRW)</h4>
            <p className="mb-4">
              SIRW is short-term work in a country other than the employment country. Examples include working in connection with vacation abroad, working at homes in another country or working while taking care of family in another country. Permission must be sought by each colleague and granted by the Leader and by Global Mobility, before undertaking any sort of SIRW.
            </p>

            {/* 4.1.1 */}
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-4">
              <h5 className="font-bold text-gray-900 mb-2">4.1.1 Eligibility</h5>
              <p className="mb-2">SIRW is <strong>not</strong> available to the following colleagues:</p>
              <ul className="list-disc ml-5 space-y-1 text-gray-700">
                <li>Those in frontline, customer-facing roles</li>
                <li>Those with roles that must be performed on site (e.g. seafarers, repair and maintenance crew, warehouse, etc.)</li>
                <li>Those whose roles cannot be performed in another country for legal reasons (e.g. legal profession, countries with strict data security regulations, sanctioned countries)</li>
                <li>Those with roles that would create a <strong>permanent establishment</strong> (e.g. those negotiating and signing contracts of value on behalf of Maersk, such as commercial, sales and procurement roles or Senior Executive leadership roles)</li>
              </ul>
              <p className="mt-2 text-gray-600">All colleagues, other than those listed above, are entitled to request permission to undertake SIRW.</p>
            </div>

            {/* 4.1.2 */}
            <div className="bg-blue-50 border border-blue-200 rounded-sm p-4 mb-4">
              <h5 className="font-bold text-gray-900 mb-2">4.1.2 Duration Allowed</h5>
              <p className="mb-2">SIRW can be approved up to a strict maximum of <strong>20 workdays</strong> in a calendar year. The 20 workdays cannot be taken as a single block of 20 continuous days, and it is the responsibility of the colleague to track the workdays.</p>
              <p>Colleagues cannot exceed 20 days without prior approval and approval for extended SIRW (20+ days) will only be granted in the most exceptional cases. See section 5.</p>
            </div>

            {/* 4.1.3 */}
            <div className="mb-4">
              <h5 className="font-bold text-gray-900 mb-2">4.1.3 Requirements</h5>

              <p className="font-semibold text-gray-800 mb-1">Immigration:</p>
              <p className="mb-3 text-gray-600">
                For permission to be granted for SIRW, a colleague <strong>must have the right to work in the relevant country</strong>. The right to work is not the same as the right to visit a country. In case of any doubt, colleagues can request clarification from the Global Mobility Partners. The company will not provide support or contribute to the cost of any visas required for SIRW.
              </p>

              <p className="font-semibold text-gray-800 mb-1">Income tax and social security:</p>
              <p className="mb-3 text-gray-600">
                If any period of SIRW creates a tax return or payroll reporting obligation for the company, the SIRW request will be declined. Any taxes or social security payable, which did not generate a reporting obligation, is entirely the colleague's responsibility.
              </p>

              <p className="font-semibold text-gray-800 mb-1">Relevant countries:</p>
              <p className="mb-3 text-gray-600">
                SIRW cannot be performed in countries with no Maersk entity or a country in which EU, US or UN Sanctions are currently in place. See Appendix A.
              </p>

              <p className="font-semibold text-gray-800 mb-1">Employment terms &amp; contract:</p>
              <p className="text-gray-600">
                This policy does not in any way change employment terms and/or the contract of employment. The colleague remains in the employment of, and subject to, the contract in the employment country.
              </p>
            </div>

            {/* 4.1.4 */}
            <div className="mb-4">
              <h5 className="font-bold text-gray-900 mb-2">4.1.4 Governance</h5>
              <p className="text-gray-600">
                Approval for any SIRW requests is at the discretion of the company. No colleague, irrespective of job level, has a legal right to SIRW. Initial approval of the Leader must be obtained in every case. But final approval must then be obtained from Global Mobility (via the tech platform mentioned in 4.1.5). If approval is not granted SIRW should not be undertaken. In case of dispute or disagreement the position of the Head of Employee Wage Tax and Head of Global Mobility Policy is final.
              </p>
            </div>

            {/* 4.1.5 */}
            <div className="mb-4">
              <h5 className="font-bold text-gray-900 mb-2">4.1.5 Process</h5>
              <p className="text-gray-600">
                Once initial approval is given by the Leader, a request must be submitted using the hyperlink on the SIRW webpage on One Maersk. This hyperlink will take users to the SIRW tech platform of the appointed mobility tax provider. Users will be verified as Maersk employees via single sign-on and asked to create a one-time only profile. From that profile they will submit information about their requested trip. Shortly thereafter they (along with the Leader) will receive an email confirming or denying the request for SIRW.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2">5. Extended SIRW (Exceptional)</h3>
            <p className="mb-3">
              If a colleague, due to exceptional circumstances, is likely to exceed 20 workdays in another country they must immediately inform their Leader, the PF and Global Mobility. Exceptional circumstances might be the birth of a child in a foreign country or serious illness / death of immediate family in another country.
            </p>
            <p className="mb-3">
              Global Mobility will then undertake a review (with specialist vendor input) to consider the immigration, tax, social security and employment law considerations. If that review highlights any risk for the company or the individual colleague, the exceptional or extended SIRW will not be permitted, and the colleague must return to their employment country.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
              <h5 className="font-bold text-gray-900 mb-2">5.1 Governance (Extended)</h5>
              <p className="text-gray-600 mb-2">In addition to approval by Leader and Global Mobility, all Extended SIRW requests must be approved by:</p>
              <ol className="list-decimal ml-5 space-y-1 text-gray-600">
                <li>Functional Head</li>
                <li>Relevant member of the PLT (if increased complexity/cost)</li>
                <li>Relevant member of the ELT (if increased complexity/cost)</li>
              </ol>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-2">6. Version Control</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Version</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Date</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Change</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Authored by</th>
                    <th className="border border-gray-200 px-3 py-2 text-left font-bold text-gray-700">Approved by</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">1.0</td>
                    <td className="border border-gray-200 px-3 py-2">01.05.2025</td>
                    <td className="border border-gray-200 px-3 py-2">First version</td>
                    <td className="border border-gray-200 px-3 py-2">Global Rewards, Tax</td>
                    <td className="border border-gray-200 px-3 py-2">Majken Elmerkjaer, Ingrid Snelderwaard</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Appendix A */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3">Appendix A — Blocked Countries</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sanctioned */}
              <div className="bg-red-50 border border-red-200 rounded-sm p-4">
                <h5 className="font-bold text-red-800 mb-2 text-xs uppercase tracking-widest">UN/EU Sanctioned Countries</h5>
                <div className="space-y-2 text-xs text-red-700">
                  <div>
                    <span className="font-semibold">Asia Pacific:</span> Afghanistan, North Korea, Iran, Iraq, Myanmar
                  </div>
                  <div>
                    <span className="font-semibold">Europe:</span> Bosnia & Herzegovina, Russia, Turkey, Ukraine
                  </div>
                  <div>
                    <span className="font-semibold">IMEA:</span> Central African Rep., DRC, Guinea, Libya, Somalia, South Sudan, Sudan, Syria, Yemen, Zimbabwe
                  </div>
                  <div>
                    <span className="font-semibold">Americas:</span> Haiti, Nicaragua, Venezuela
                  </div>
                </div>
              </div>

              {/* No Entity */}
              <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
                <h5 className="font-bold text-gray-700 mb-2 text-xs uppercase tracking-widest">No Maersk Entity</h5>
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold">Asia Pacific:</span> Brunei, Bhutan, Fiji, Kiribati, Laos, Maldives, Marshall Islands, Micronesia, Mongolia, Nauru, Nepal, Palau, PNG, Samoa, Solomon Islands, Timor-Leste, Tonga, Turkmenistan, Tuvalu, Uzbekistan, Vanuatu
                  </div>
                  <div>
                    <span className="font-semibold">Europe:</span> Albania, Andorra, Armenia, Azerbaijan, Cyprus, Iceland, Liechtenstein, Luxembourg, Malta, Monaco, Montenegro, North Macedonia, Moldova, San Marino
                  </div>
                  <div>
                    <span className="font-semibold">IMEA:</span> Burundi, Chad, Comoros, Equatorial Guinea, Eritrea, Guinea-Bissau, Kazakhstan, Kyrgyzstan, São Tomé, Seychelles, Tajikistan
                  </div>
                  <div>
                    <span className="font-semibold">Americas:</span> Antigua & Barbuda, Bahamas, Barbados, Cuba, Dominica, Grenada, Jamaica, St Kitts & Nevis, St Lucia, St Vincent & Grenadines, Belize, Guyana, Suriname
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between rounded-b-sm">
          <a
            href={`${import.meta.env.BASE_URL}policy/Maersk-SIRW-Policy.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#42b0d5] font-bold text-xs uppercase tracking-widest hover:underline"
          >
            <Download size={14} />
            Download PDF
          </a>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-sm text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
