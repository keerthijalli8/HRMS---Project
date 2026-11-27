// Official Holiday Reasons & Cultural Reference Data
// HRMS Manager Dashboard - November 2026 & Corporate Calendar

export const holidayReasons = {
  'Karnataka Rajyotsava': {
    name: 'Karnataka Rajyotsava (Karnataka Formation Day)',
    type: 'State Public Holiday',
    status: 'Offices Closed · State Holiday',
    reason:
      'Celebrates the creation of the State of Mysore (later renamed Karnataka) on 1 November 1956 by merging all Kannada language-speaking regions of South India under the States Reorganisation Act. A state-wide official holiday across all Karnataka offices.',
    coverage: 'Bengaluru HQ & Karnataka Campuses',
  },
  'Diwali Eve': {
    name: 'Diwali Eve (Naraka Chaturdashi)',
    type: 'Festival Observance',
    status: 'Regional Observance · Festive Eve',
    reason:
      'Marks Naraka Chaturdashi, celebrating Lord Krishna and Satyabhama’s triumph over the demon king Narakasura. Precedes the main Deepavali festivities with optional early log-off and campus lightings.',
    coverage: 'All India Facilities & Remote Hubs',
  },
  'Deepavali (Diwali)': {
    name: 'Deepavali / Diwali (Festival of Lights)',
    type: 'Statutory National Holiday',
    status: 'Offices Closed · National Holiday',
    reason:
      'The Festival of Lights celebrating the victory of light over darkness, good over evil, and wisdom over ignorance. Commemorates the return of Lord Rama to Ayodhya after 14 years of exile and Goddess Lakshmi’s blessings of prosperity.',
    coverage: 'All Corporate Campuses & Centers Nationwide',
  },
  Diwali: {
    name: 'Deepavali / Diwali (Festival of Lights)',
    type: 'Statutory National Holiday',
    status: 'Offices Closed · National Holiday',
    reason:
      'The Festival of Lights celebrating the spiritual triumph of light over darkness and truth over ignorance. Mandatory corporate holiday across all regional hubs.',
    coverage: 'All Regional Offices & Workplaces',
  },
  'Bhai Dooj': {
    name: 'Bhai Dooj / Yama Dwitiya',
    type: 'Cultural Holiday',
    status: 'Restricted Holiday · Optional Leave',
    reason:
      'Celebrates the affectionate bond and mutual protection between brothers and sisters, following traditional blessings and festive gatherings post-Diwali.',
    coverage: 'Eligible for Optional Holiday Claim',
  },
  'Guru Nanak Jayanti': {
    name: 'Guru Nanak Jayanti (Gurpurab)',
    type: 'Gazetted National Holiday',
    status: 'Offices Closed · National Holiday',
    reason:
      'Commemorates the 557th Prakash Utsav (sacred birth anniversary) of Guru Nanak Dev Ji, the first Sikh Guru and founder of Sikhism, who taught equality, selfless service (Seva), and universal brotherhood.',
    coverage: 'All Corporate Offices & Centers Closed Nationwide',
  },
};

/**
 * Resolves holiday name to its full description, reason, and status.
 */
export function getHolidayDetails(holidayName) {
  if (!holidayName) return null;

  // Exact match
  if (holidayReasons[holidayName]) {
    return holidayReasons[holidayName];
  }

  // Partial match
  const match = Object.entries(holidayReasons).find(([key]) =>
    holidayName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(holidayName.toLowerCase())
  );

  if (match) {
    return match[1];
  }

  // Fallback for any other custom holiday
  return {
    name: holidayName,
    type: 'Official Company Holiday',
    status: 'Offices Closed · Holiday Observance',
    reason: `Official company statutory holiday observance for ${holidayName}. Regular business operations, shift obligations, and sprint deliverables are suspended.`,
    coverage: 'All regional offices and employees',
  };
}
