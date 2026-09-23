// Site content. Edit this file to change what the page shows. (M3 adds projects, skills, jobs.)
window.SITE = {
  name: 'Your Name',            // TBD
  initials: 'YN',               // TBD
  tagline: 'TBD one-line tagline.',
  status: 'Open to collaboration',
  city: 'Vienna, Austria',
  timeZone: 'Europe/Vienna',
  location: [48.2082, 16.3738], // [lat, lon] globe center + home node (red)
  // Other anchor points of the globe web. Each is linked to home by a spoke,
  // and neighbors (by direction from home) are linked by the web's threads.
  // style: 'gold' = gold-to-yellow node; omit for the accent color.
  // size: optional node size multiplier (1 = normal).
  anchors: [
    { name: 'Hyderabad, India', location: [17.385, 78.4867] },
    { name: 'Tokyo, Japan', location: [35.6762, 139.6503] },
    { name: 'Greenville, SC, USA', location: [34.8526, -82.394], style: 'gold' },
    { name: 'Augusta, GA, USA', location: [33.4735, -82.0105] },
    { name: 'Huntington Beach, CA, USA', location: [33.6603, -117.9992] },
    { name: 'Toronto, Canada', location: [43.6532, -79.3832] },
    { name: 'East Rutherford, NJ, USA', location: [40.8339, -74.0971] },
    { name: 'Crystal Lake, IL, USA', location: [42.2411, -88.3162] },
    { name: 'Luxembourg', location: [49.6116, 6.1319] },
    { name: 'Mol, Belgium', location: [51.1906, 5.115] },
    { name: 'Rio de Janeiro, Brazil', location: [-22.9068, -43.1729] },
    { name: 'Cape Town, South Africa', location: [-33.9249, 18.4241] },
    { name: 'Aomori, Japan', location: [40.8222, 140.7474] },
    { name: 'CERN, Switzerland', location: [46.233, 6.0557] },
    { name: 'Paks, Hungary', location: [46.6225, 18.8558] },
    { name: 'Taipei, Taiwan', location: [25.033, 121.5654] },
    { name: 'Chippawa Hill, ON, Canada', location: [44.5124, -81.3297] },
    // Project locations
    { name: 'Mebane, NC, USA', location: [36.096, -79.267] },
    { name: 'Charlotte, NC, USA', location: [35.2271, -80.8431] },
    { name: 'Harrisburg, NC, USA', location: [35.3238, -80.6498] },
    { name: 'Orlando, FL, USA', location: [28.5383, -81.3792] },
    { name: 'Arlington, TX, USA', location: [32.7357, -97.1081] },
    { name: 'San Bernardino, CA, USA', location: [34.1083, -117.2898] },
    { name: 'Chanhassen, MN, USA', location: [44.8622, -93.5307] },
  ],
  links: {
    github: 'https://github.com/aegisssc',
    linkedin: '',               // TBD — empty string = hidden
    email: '',                  // TBD — empty string = hidden
  },
  tools: [                      // TBD — slug = https://simpleicons.org slug
    { name: 'Git', slug: 'git' }, { name: 'GitHub', slug: 'github' },
    { name: 'Linux', slug: 'linux' }, { name: 'Python', slug: 'python' },
    { name: 'JavaScript', slug: 'javascript' }, { name: 'HTML5', slug: 'html5' },
    { name: 'CSS', slug: 'css' }, { name: 'Docker', slug: 'docker' },
    { name: 'VS Code', slug: 'vscodium' }, { name: 'Bash', slug: 'gnubash' },
  ],
};
