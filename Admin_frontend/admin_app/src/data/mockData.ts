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
  sentiment: number; // -100 to 100
  queryCount: number;
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
    status: 'pending',
    riskLevel: 'low',
    sentiment: 85,
    queryCount: 3,
  },
  {
    id: '2',
    reference: 'SIRW-2026-0041',
    employeeName: 'Marcus T.',
    role: 'Sales Director',
    homeCountry: 'UK',
    destinationCountry: 'France',
    startDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    status: 'rejected',
    riskLevel: 'high',
    sentiment: -40,
    queryCount: 12,
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
    sentiment: 92,
    queryCount: 2,
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
    sentiment: 15,
    queryCount: 8,
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
    status: 'pending',
    riskLevel: 'low',
    sentiment: 60,
    queryCount: 4,
  },
];
