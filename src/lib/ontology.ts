/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Domain, GroundedNode } from '../types';

export const KNOWLEDGE_BASE: Record<Domain, GroundedNode[]> = {
  [Domain.AEROSPACE]: [
    {
      id: 'CCSDS-133.0-B-2',
      label: 'Space Packet Protocol',
      type: 'Protocol',
      properties: {
        standard: 'CCSDS',
        version: '133.0-B-2',
        criticality: 'High',
        description: 'Defines the structural format of telemetry packets for deep space missions.',
        subsystem: 'Telemetry',
        timestamp: '2025-10-12T10:00:00Z'
      }
    },
    {
      id: 'THERMAL-TOLERANCE-001',
      label: 'Thermal Subsystem Parameters',
      type: 'EngineeringSpec',
      properties: {
        min_temp: -150,
        max_temp: 125,
        unit: 'Celsius',
        subsystem: 'Payload',
        verification_method: 'Thermal Vacuum Test',
        timestamp: '2026-01-05T08:30:00Z'
      }
    },
    {
      id: 'ORBITAL-MECH-G1',
      label: 'Geosynchronous Transfer Orbit (GTO)',
      type: 'OrbitalDynamics',
      properties: {
        perigee: '180 km',
        apogee: '35900 km',
        inclination: '18 degrees',
        v_delta: '1.5 km/s',
        subsystem: 'Guidance',
        timestamp: '2026-02-20T14:15:00Z'
      }
    },
    {
      id: 'IMS-1-BUS-SPEC',
      label: 'Indian Mini Satellite (IMS-1) Bus',
      type: 'EngineeringSpec',
      properties: {
        payload_mass: '150±10 kg',
        interface: 'MIL1553B TMTC',
        power_support: 'Solar Array/Li-Ion',
        subsystem: 'Structure',
        timestamp: '2025-06-20T00:00:00Z'
      }
    },
    {
      id: 'CCSDS-XML-NDM',
      label: 'CCSDS Navigation Data Messages (XML)',
      type: 'Protocol',
      properties: {
        format: 'Extensible Markup Language',
        schema: 'NDM/XML integrated set',
        application: 'Intersite data exchange',
        subsystem: 'Guidance',
        timestamp: '2024-11-10T00:00:00Z'
      }
    },
    {
      id: 'ISTRAC-OPS-G1',
      label: 'ISTRAC Ground Segment Architecture',
      type: 'MissionSpec',
      properties: {
        network: 'Deep Space Network Complex',
        control_center: 'SCC Bangalore',
        links: 'S-Band/X-Band',
        subsystem: 'Telemetry',
        timestamp: '2026-01-15T00:00:00Z'
      }
    },
    {
      id: 'EDGED-TEL-SLE-001',
      label: 'Edge-of-Network Space Link Extension (SLE)',
      type: 'NetworkProtocol',
      properties: {
        layer: 'Data Link Layer (L2)',
        processing: 'Distributed Frame Verification',
        latency_target: '< 10ms',
        security: 'CAPRISE Encrypted',
        subsystem: 'Telemetry',
        timestamp: '2026-03-15T09:00:00Z'
      }
    },
    {
      id: 'TELEMETRY-FRAME-CRYPTO',
      label: 'Cryptographic Frame Authentication',
      type: 'SecuritySpec',
      properties: {
        algorithm: 'AES-GCM-256',
        integrity: 'HMAC-SHA-512',
        compliance: 'CERT-In ISRO-L3',
        description: 'Mandatory for all edged query interfaces.',
        subsystem: 'Telemetry',
        timestamp: '2026-04-10T12:00:00Z'
      }
    },
    {
      id: 'LUNA-PR-022',
      label: 'Lunar Polar Rover Navigation',
      type: 'MissionSpec',
      properties: {
        target: 'Lunar South Pole',
        autonomous_nav: 'Enabled',
        obstacle_avoidance: 'Lidar-based',
        subsystem: 'Guidance',
        timestamp: '2026-05-01T09:00:00Z'
      }
    }
  ],
  [Domain.GOVERNMENT]: [
    {
      id: 'GFR-RULE-160',
      label: 'Public Procurement Policy',
      type: 'Regulation',
      properties: {
        authority: 'Ministry of Finance',
        last_updated: '2024-01-15',
        requirement: 'Global Tender Enquiry (GTE) required for values above INR 200 Crore.',
        mdds_compliance: 'Verified',
        timestamp: '2024-01-15T00:00:00Z'
      }
    },
    {
      id: 'CERT-IN-CYBER-2024',
      label: 'CERT-In Cybersecurity Directions',
      type: 'Regulation',
      properties: {
        sync_standard: 'NIC NTP Server',
        logging_period: '180 Days Immutable',
        audit_scope: 'VPN/Database/Network',
        compliance: 'Mandatory',
        timestamp: '2024-04-28T00:00:00Z'
      }
    },
    {
      id: 'PROCUREMENT-MANUAL-2017',
      label: 'Manual for Procurement of Goods',
      type: 'Regulation',
      properties: {
        issued_by: 'Dept of Expenditure',
        principles: 'Value for Money / Transparency',
        auction_type: 'Electronic Reverse Auction',
        timestamp: '2017-06-01T00:00:00Z'
      }
    },
    {
      id: 'GFR-RULE-144',
      label: 'Fundamental Principles of Procurement',
      type: 'Regulation',
      properties: {
        transparency: 'High',
        fairness: 'Mandatory',
        efficiency: 'Optimized',
        timestamp: '2024-02-01T00:00:00Z'
      }
    },
    {
      id: 'GFR-RULE-149',
      label: 'GeM Procurement',
      type: 'Regulation',
      properties: {
        platform: 'Government e-Marketplace',
        threshold: 'Mandatory for all items available on GeM.',
        exceptions: 'Proprietary Article Certificate case.',
        timestamp: '2023-11-20T00:00:00Z'
      }
    },
    {
      id: 'MEITY-MDDS-V2',
      label: 'Metadata Standard for e-Governance',
      type: 'Standard',
      properties: {
        entity: 'Procurement Contract',
        required_fields: ['ContractID', 'VendorTAN', 'SanctionDate', 'ValueINR'],
        encryption: 'AES-256',
        timestamp: '2022-05-10T00:00:00Z'
      }
    }
  ]
};

export function getOntologyStats() {
  return {
    [Domain.AEROSPACE]: {
      nodes: KNOWLEDGE_BASE[Domain.AEROSPACE].length,
      types: Array.from(new Set(KNOWLEDGE_BASE[Domain.AEROSPACE].map(n => n.type))),
    },
    [Domain.GOVERNMENT]: {
      nodes: KNOWLEDGE_BASE[Domain.GOVERNMENT].length,
      types: Array.from(new Set(KNOWLEDGE_BASE[Domain.GOVERNMENT].map(n => n.type))),
    }
  };
}

import { AdvancedFilters } from '../types';

export function searchOntology(query: string, domain: Domain, filters?: AdvancedFilters): GroundedNode[] {
  const q = query.toLowerCase();
  return KNOWLEDGE_BASE[domain].filter(node => {
    // 1. Text Search
    const matchesText = 
      node.label.toLowerCase().includes(q) || 
      node.id.toLowerCase().includes(q) ||
      JSON.stringify(node.properties).toLowerCase().includes(q);
    
    if (!matchesText) return false;

    // 2. Filters
    if (filters) {
      if (filters.subsystem && node.properties.subsystem !== filters.subsystem) return false;
      if (filters.dataType && node.type !== filters.dataType) return false;
      
      const nodeTime = node.properties.timestamp ? new Date(node.properties.timestamp).getTime() : 0;
      if (filters.dateStart) {
        const startTime = new Date(filters.dateStart).getTime();
        if (nodeTime < startTime) return false;
      }
      if (filters.dateEnd) {
        const endTime = new Date(filters.dateEnd).getTime();
        if (nodeTime > endTime) return false;
      }
    }

    return true;
  });
}
