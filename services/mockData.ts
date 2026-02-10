
import { Event, User, UserRole, ExperienceLevel, Bid, PhotoPackageType } from '../types';

export interface MockPlace {
  name: string;
  address: string;
  zipCode: string;
  coordinates: { lat: number; lng: number };
}

export const MOCK_PLACES_DB: MockPlace[] = [
  { name: "Grand Hotel Ballroom", address: "123 Magnificent Mile, Chicago, IL", zipCode: "60601", coordinates: { lat: 41.8781, lng: -87.6298 } },
  { name: "Millennium Park", address: "201 E Randolph St, Chicago, IL", zipCode: "60602", coordinates: { lat: 41.8826, lng: -87.6226 } },
  { name: "Navy Pier", address: "600 E Grand Ave, Chicago, IL", zipCode: "60611", coordinates: { lat: 41.8917, lng: -87.6043 } },
  { name: "Austin Convention Center", address: "500 E Cesar Chavez St, Austin, TX", zipCode: "78701", coordinates: { lat: 30.2635, lng: -97.7397 } },
  { name: "The Domain", address: "11410 Century Oaks Terrace, Austin, TX", zipCode: "78758", coordinates: { lat: 30.4014, lng: -97.7262 } },
  { name: "Central Park Boathouse", address: "E 72nd St, New York, NY", zipCode: "10021", coordinates: { lat: 40.7753, lng: -73.9692 } },
  { name: "Brooklyn Bridge Park", address: "334 Furman St, Brooklyn, NY", zipCode: "11201", coordinates: { lat: 40.7003, lng: -73.9967 } },
  { name: "Union Station", address: "800 N Alameda St, Los Angeles, CA", zipCode: "90012", coordinates: { lat: 34.0562, lng: -118.2365 } },
  { name: "Santa Monica Pier", address: "200 Santa Monica Pier, Santa Monica, CA", zipCode: "90401", coordinates: { lat: 34.0100, lng: -118.4960 } },
  { name: "Boston Common", address: "139 Tremont St, Boston, MA", zipCode: "02111", coordinates: { lat: 42.3542, lng: -71.0698 } },
  { name: "Fenway Park", address: "4 Jersey St, Boston, MA", zipCode: "02215", coordinates: { lat: 42.3467, lng: -71.0972 } }
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Jenkins',
    email: 'sarah@events.com',
    role: UserRole.EVENT_OWNER,
    avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    coordinates: { lat: 41.8781, lng: -87.6298 }, // Chicago
    bio: "Event coordinator for downtown charity galas and corporate functions. I love working with organized professionals.",
    joinedDate: "2023-01-15",
    // Fix: Added required skills property
    skills: []
  },
  {
    id: 'u2',
    name: 'David Lens',
    email: 'david@photo.com',
    role: UserRole.PHOTOGRAPHER,
    experienceLevel: ExperienceLevel.PROFESSIONAL,
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    coordinates: { lat: 41.8781, lng: -87.6298 }, // Chicago
    bio: "Professional event photographer with over 5 years of experience specializing in low-light environments, galas, and concerts. I use Canon R5 gear.",
    website: "www.davidlensphoto.com",
    instagram: "@davidlens_shots",
    joinedDate: "2022-11-20",
    // Fix: Added required skills property
    skills: ["Low Light", "Event Coverage", "Canon R5"]
  },
  {
    id: 'u3',
    name: 'Newbie Nate',
    email: 'nate@photo.com',
    role: UserRole.PHOTOGRAPHER,
    experienceLevel: ExperienceLevel.BEGINNER,
    avatarUrl: 'https://randomuser.me/api/portraits/men/86.jpg',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    coordinates: { lat: 30.2672, lng: -97.7431 }, // Austin
    bio: "Aspiring sports and action photographer. I'm building my portfolio and looking for Open Shoot opportunities to learn from the pros!",
    instagram: "@nate_creates",
    joinedDate: "2023-06-10",
    // Fix: Added required skills property
    skills: ["Sports", "Action"]
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    ownerId: 'u1',
    title: 'Downtown Charity Gala',
    description: 'Annual charity fundraising dinner. We need high-quality coverage of the speeches and candid shots of guests.',
    date: '2023-11-15T18:00:00',
    // Added missing isAllDay property
    isAllDay: false,
    location: 'Grand Hotel Ballroom, Chicago, IL',
    zipCode: '60601',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    imageUrl: 'https://picsum.photos/seed/gala/800/600',
    isOpenShoot: true,
    status: 'OPEN',
    tags: ['Charity', 'Indoor', 'Formal'],
    packageType: PhotoPackageType.PREMIUM,
    photoLimit: 300,
    roles: [
      {
        id: 'r1',
        title: 'Lead Photographer',
        description: 'Responsible for key moments, podium shots, and VIP portraits.',
        minBudget: 800,
        maxBudget: 1200,
        filled: false
      },
      {
        id: 'r2',
        title: 'Roaming Candid Photographer',
        description: 'Capture guest interactions and atmosphere.',
        minBudget: 400,
        maxBudget: 600,
        filled: false
      }
    ]
  },
  {
    id: 'e2',
    ownerId: 'u1',
    title: 'Tech Startup Launch Party',
    description: 'Product launch for a new AI gadget. High energy, modern vibe.',
    date: '2023-12-01T19:00:00',
    // Added missing isAllDay property
    isAllDay: false,
    location: 'Innovation Hub, Austin, TX',
    zipCode: '78701',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    imageUrl: 'https://picsum.photos/seed/tech/800/600',
    isOpenShoot: false,
    status: 'OPEN',
    tags: ['Corporate', 'Tech', 'Party'],
    packageType: PhotoPackageType.STANDARD,
    photoLimit: 100,
    roles: [
      {
        id: 'r3',
        title: 'Event Photographer',
        description: 'Full coverage of the evening.',
        minBudget: 500,
        maxBudget: 800,
        filled: false
      }
    ]
  },
  {
    id: 'e3',
    ownerId: 'u5',
    title: 'City Marathon Finish Line',
    description: 'Capturing runners as they cross the finish line. Chaotic but rewarding environment.',
    date: '2023-10-20T07:00:00',
    // Added missing isAllDay property
    isAllDay: false,
    location: 'City Park, Boston, MA',
    zipCode: '02108',
    coordinates: { lat: 42.3601, lng: -71.0589 },
    imageUrl: 'https://picsum.photos/seed/marathon/800/600',
    isOpenShoot: true,
    status: 'OPEN',
    tags: ['Sports', 'Outdoor', 'Daytime'],
    packageType: PhotoPackageType.STANDARD,
    photoLimit: 100,
    roles: [
      {
        id: 'r4',
        title: 'Senior Sports Photographer',
        description: 'High speed shutter work required.',
        minBudget: 1000,
        maxBudget: 1500,
        filled: false
      }
    ]
  },
  {
    id: 'e4',
    ownerId: 'u1',
    title: 'Summer Music Festival',
    description: 'Three-day outdoor music festival. Coverage required for main stage and crowd shots.',
    date: '2023-07-15T12:00:00',
    // Added missing isAllDay property
    isAllDay: false,
    location: 'Grant Park, Chicago, IL',
    zipCode: '60601',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    imageUrl: 'https://picsum.photos/seed/festival/800/600',
    isOpenShoot: true,
    status: 'COMPLETED',
    tags: ['Music', 'Festival', 'Outdoor'],
    packageType: PhotoPackageType.PREMIUM,
    photoLimit: 300,
    roles: [
      {
        id: 'r5',
        title: 'Festival Photographer',
        description: 'Main stage coverage.',
        minBudget: 1500,
        maxBudget: 1500,
        filled: true
      }
    ],
    // Added missing object_key to satisfy ImageSubmission type requirements
    submissions: [
      {
        id: 's1',
        url: 'https://picsum.photos/seed/concert1/800/600',
        object_key: 'mock/concert1.jpg',
        photographerName: 'David Lens',
        photographerId: 'u2',
        type: 'OFFICIAL',
        submittedAt: '2023-07-16T10:00:00'
      },
      {
        id: 's2',
        url: 'https://picsum.photos/seed/concert2/800/600',
        object_key: 'mock/concert2.jpg',
        photographerName: 'David Lens',
        photographerId: 'u2',
        type: 'OFFICIAL',
        submittedAt: '2023-07-16T10:05:00'
      },
      {
        id: 's3',
        url: 'https://picsum.photos/seed/concert3/800/600',
        object_key: 'mock/concert3.jpg',
        photographerName: 'Newbie Nate',
        photographerId: 'u3',
        type: 'OPEN_SHOOT',
        submittedAt: '2023-07-17T09:00:00'
      },
      {
        id: 's4',
        url: 'https://picsum.photos/seed/concert4/800/600',
        object_key: 'mock/concert4.jpg',
        photographerName: 'Newbie Nate',
        photographerId: 'u3',
        type: 'OPEN_SHOOT',
        submittedAt: '2023-07-17T09:30:00'
      }
    ]
  }
];

// Added missing eventOwnerId to fix Bid type error (line 221)
export const MOCK_BIDS: Bid[] = [
  {
    id: 'b1',
    eventId: 'e1',
    eventOwnerId: 'u1',
    roleId: 'r1',
    photographerId: 'u2',
    photographerName: 'David Lens',
    amount: 950,
    message: 'I have 5 years of experience with low-light gala events.',
    status: 'PENDING',
    submittedAt: '2023-10-01T10:00:00',
    type: 'PAID'
  }
];
