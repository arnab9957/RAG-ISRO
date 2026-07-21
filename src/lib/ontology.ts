/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Domain, GroundedNode, AdvancedFilters } from '../types';

export const KNOWLEDGE_BASE: Record<Domain, GroundedNode[]> = {
  [Domain.AEROSPACE]: [
    {
      id: 'AERO-DOC-001-P1',
      label: 'Page 1: CCSDS Frame Structure',
      type: 'ProtocolSpec',
      content: 'The CCSDS Space Packet Protocol defines the structure of telemetry packets. A primary header consists of Version, Type, Sec. Header Flag, APID, Sequence Flags, Sequence Count, and Packet Length.',
      metadata: { filename: 'CCSDS_133.pdf', page: 1, section: 'Packet Structure', chunkId: 'CH-001', subsystem: 'Telemetry' },
      neighborIds: ['AERO-DOC-001-P2']
    },
    {
      id: 'AERO-DOC-001-P2',
      label: 'Page 2: APID Allocation',
      type: 'ProtocolSpec',
      content: 'APID (Application Process Identifier) provides the identification of the application process. Values 0-2047 are reserved for mission-specific applications. APID 2047 is reserved for Idle Packets.',
      metadata: { filename: 'CCSDS_133.pdf', page: 2, section: 'APID Management', chunkId: 'CH-002', subsystem: 'Telemetry' },
      neighborIds: ['AERO-DOC-001-P1', 'AERO-DOC-001-P3']
    },
    {
      id: 'AERO-DOC-001-P3',
      label: 'Page 3: Sequence Control',
      type: 'ProtocolSpec',
      content: 'Sequence control ensures packets are processed in order. It uses a 14-bit sequence count for tracking packet delivery and identifying missing data in space-to-ground links.',
      metadata: { filename: 'CCSDS_133.pdf', page: 3, section: 'Error Control', chunkId: 'CH-003', subsystem: 'Telemetry' },
      neighborIds: ['AERO-DOC-001-P2']
    },
    {
      id: 'AERO-THERMAL-P10',
      label: 'Page 10: Thermal Protection System',
      type: 'EngineeringSpec',
      content: 'The Thermal Protection System (TPS) protects the spacecraft from extreme temperatures. Multi-Layer Insulation (MLI) consists of several layers of aluminized Mylar to reduce radiation heat transfer.',
      metadata: { filename: 'THERMAL_TECH.pdf', page: 10, section: 'Insulation', chunkId: 'TH-010', subsystem: 'Thermal' },
      neighborIds: ['AERO-THERMAL-P11']
    },
    {
      id: 'AERO-THERMAL-P11',
      label: 'Page 11: Active Control Systems',
      type: 'EngineeringSpec',
      content: 'Active thermal control includes heaters and louvers. Louvers are used to vary the radiation properties of a radiator surface. Heaters maintain minimum temperatures during eclipse phases.',
      metadata: { filename: 'THERMAL_TECH.pdf', page: 11, section: 'Active Control', chunkId: 'TH-011', subsystem: 'Thermal' },
      neighborIds: ['AERO-THERMAL-P10']
    }
  ],
  [Domain.GOVERNMENT]: [
    {
      id: 'GFR-2017-R160',
      label: 'GFR Rule 160: Procurement',
      type: 'Regulation',
      content: 'Rule 160 of GFR 2017 states that every authority delegated with the financial powers of making procurement in public interest shall have the responsibility and accountability to bring efficiency, economy, and transparency.',
      metadata: { filename: 'GFR_2017.pdf', page: 60, section: 'Procurement Principles', chunkId: 'GFR-160' }
    },
    {
      id: 'GFR-2017-R161',
      label: 'GFR Rule 161: Bidding',
      type: 'Regulation',
      content: 'Advertised Tender Enquiry should be used for procurement of goods worth Rs. 25 lakhs and above. Minimum time for submission of bids should be 3 weeks for domestic and 4 weeks for global tenders.',
      metadata: { filename: 'GFR_2017.pdf', page: 61, section: 'Bidding Procedures', chunkId: 'GFR-161' }
    }
  ]
};

/**
 * Simple Keyword Match Score (Simulation of BM25)
 */
function scoreNode(node: GroundedNode, queryTerms: string[]): number {
  let score = 0;
  const content = node.content.toLowerCase();
  const label = node.label.toLowerCase();
  
  queryTerms.forEach(term => {
    // Frequency based scoring
    const occurrences = content.split(term).length - 1;
    score += occurrences * 1.0;
    
    // Weight label matches higher
    if (label.includes(term)) {
      score += 5.0;
    }
    
    // Exact section matches
    if (node.metadata.section.toLowerCase().includes(term)) {
      score += 3.0;
    }
  });

  return score;
}

export async function searchOntology(query: string, domain: Domain, filters?: AdvancedFilters, userGroups?: string[], advancedSettings?: any): Promise<GroundedNode[]> {
  try {
    const token = localStorage.getItem('irsargo_token');
    const simulateOutage = localStorage.getItem('irsargo_simulate_outage') === 'true';
    const response = await fetch('http://localhost:3001/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ query, domain, filters, userGroups, simulateOutage, advancedSettings }),
    });

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('irsargo-unauthorized'));
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.securityContext) {
      localStorage.setItem('irsargo_last_security_context', JSON.stringify(data.securityContext));
    }
    return data.nodes || [];
  } catch (error) {
    console.error('Vector DB Search failed, falling back to local simulation:', error);
    return [];
  }
}
