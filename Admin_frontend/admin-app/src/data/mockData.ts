import { addDays, subDays, format } from 'date-fns';

export interface Request {
  id: string;
  reference: string;
  employeeName: string;
  role: string;
  homeCountry: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  riskLevel: 'low' | 'medium' | 'high';
  createdAt?: string;
  decisionSource?: 'auto' | 'human';
  decisionStatus?: 'auto_approved' | 'auto_rejected' | 'needs_review';
  flags?: string[];
  decisionReason?: string;
  exceptionReason?: string;
  managerName?: string;
  managerEmail?: string;
}

export const mockRequests: Request[] = [
  {
    id: '1',
    reference: 'SIRW-2026-0042',
    employeeName: 'Elena V.',
    role: 'Senior Developer',
    homeCountry: 'Denmark',
    destinationCountry: 'Spain',
    startDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
    status: 'escalated',
    riskLevel: 'low',
    createdAt: format(subDays(new Date(), 12), 'yyyy-MM-dd'),
    managerName: 'Lars Jensen',
    managerEmail: 'lars.jensen@maersk.com',
  },
  {
    id: '3',
    reference: 'SIRW-2026-0040',
    employeeName: 'Sarah L.',
    role: 'Product Owner',
    homeCountry: 'USA',
    destinationCountry: 'Canada',
    startDate: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 10), 'yyyy-MM-dd'),
    status: 'approved',
    riskLevel: 'low',
    createdAt: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    managerName: 'Mike Ross',
    managerEmail: 'mike.ross@maersk.com',
  },
  {
    id: '4',
    reference: 'SIRW-2026-0039',
    employeeName: 'Priya K.',
    role: 'Data Scientist',
    homeCountry: 'India',
    destinationCountry: 'Germany',
    startDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 50), 'yyyy-MM-dd'),
    status: 'escalated',
    riskLevel: 'medium',
    createdAt: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    managerName: 'Raj Patel',
    managerEmail: 'raj.patel@maersk.com',
  },
  {
    id: '5',
    reference: 'SIRW-2026-0038',
    employeeName: 'John D.',
    role: 'Logistics Coord',
    homeCountry: 'Netherlands',
    destinationCountry: 'Italy',
    startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 40), 'yyyy-MM-dd'),
    status: 'escalated',
    riskLevel: 'low',
    createdAt: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
    managerName: 'Emma Watson',
    managerEmail: 'emma.watson@maersk.com',
  },
];
