// Site content. Edit this file to change what the page shows.
// (M3 adds about, projects, skills, experience, education and the GitHub handle
// for the activity chart.)
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
  // style: 'highlight' = larger dot in --globe-mark-* (home wears the ring);
  //        omit for a plain accent dot.
  // size: optional node size multiplier (1 = normal).
  anchors: [
    { name: 'Hyderabad, India', location: [17.385, 78.4867] },
    { name: 'Tokyo, Japan', location: [35.6762, 139.6503] },
    { name: 'Greenville, SC, USA', location: [34.8526, -82.394], style: 'highlight' },
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
  // Tools carousel. Each icon is the OFFICIAL brand-coloured mark served by
  // https://cdn.simpleicons.org/<slug>; adding /<hex> after the slug recolours it.
  //   name  (required) accessible name + hover tooltip
  //   slug  (required) the https://simpleicons.org slug
  //   dark  (optional) hex WITHOUT '#', used only in the dark theme
  //   light (optional) hex WITHOUT '#', used only in the light theme
  // Icons keep their official brand colour. Set dark/light ONLY where a logo
  // would otherwise be invisible against that theme's background (GitHub's
  // near-black mark on the dark theme is the one real case).
  // js/main.js swaps the URLs whenever <html data-theme> changes.
  tools: [
    { name: 'Git', slug: 'git' },                        // #F03C2E
    { name: 'GitHub', slug: 'github', dark: 'ECEFF4' },  // #181717 is invisible on the dark bg
    { name: 'Linux', slug: 'linux' },                    // #FCC624
    { name: 'Python', slug: 'python' },                  // #3776AB
    { name: 'JavaScript', slug: 'javascript' },          // #F7DF1E
    { name: 'HTML5', slug: 'html5' },                    // #E34F26
    { name: 'CSS', slug: 'css' },                        // #663399
    { name: 'Docker', slug: 'docker' },                  // #2496ED
    { name: 'VS Code', slug: 'vscodium' },               // #2F80ED
    { name: 'Bash', slug: 'gnubash' },                   // #4EAA25
  ],
  // About: 3-5 sentences. TBD - replace with the owner's own words.
  about: [
    'TBD: a short paragraph about who you are and what you build.',
    'TBD: a second paragraph — what you are working on or learning now.',
  ],
  // Hand-picked projects, in the order they appear on the page.
  // To change what Projects shows, edit this list — nothing else needs to change.
  //   name  (required) card title
  //   blurb (optional) one or two sentences
  //   url   (optional) link target; LEAVE IT OUT for private or unreleased work
  //                    and the card renders as plain text instead of a link
  //   tags  (optional) small pills, e.g. ['Rust', 'Private']
  projects: [
    {
      name: 'city-gen-rs',
      blurb: 'TBD: a procedural city generator in Rust.',
      url: 'https://github.com/AegisSSC/city-gen-rs',
      tags: ['Rust', 'Procedural generation'],
    },
    // Example of private work with no link (delete or edit):
    // {
    //   name: 'TBD private project',
    //   blurb: 'TBD: what it does, without giving away anything private.',
    //   tags: ['Private', 'Rust'],
    // },
    {
      name: 'huffman-rs',
      blurb: 'The Huffman compression algorithm implemented from scratch in Rust.',
      url: 'https://github.com/AegisSSC/huffman-rs',
      tags: ['Rust', 'Algorithms', 'Compression'],
    },
    {
      name: 'TigerTownBlog',
      blurb: 'A SvelteKit blog powered by Markdown, built to carry the writing for ongoing projects.',
      url: 'https://github.com/AegisSSC/TigerTownBlog',
      tags: ['SvelteKit', 'TypeScript', 'Markdown'],
    },
    {
      name: 'C-UI-Task-Management',
      blurb: 'A task-management desktop app written entirely in C, drawing its own interface with OpenGL.',
      url: 'https://github.com/AegisSSC/C-UI-Task-Management',
      tags: ['C', 'OpenGL', 'Desktop UI'],
    },
    {
      name: 'RustyDS',
      blurb: 'Data science in Rust with Linfa — a growing set of worked examples.',
      url: 'https://github.com/AegisSSC/RustyDS',
      tags: ['Rust', 'Linfa', 'Data science'],
    },
    {
      name: 'Stock_Market_Analysis',
      blurb: 'A side project analysing historical market data in Python.',
      url: 'https://github.com/AegisSSC/Stock_Market_Analysis',
      tags: ['Python', 'Pandas', 'Analysis'],
    },
  ],
  // Skill groups. TBD - drafted from the repos above; the owner should correct these.
  skills: [
    { group: 'Languages', items: ['Rust', 'Python', 'C', 'TypeScript', 'JavaScript', 'Lua'] },
    { group: 'Web', items: ['SvelteKit', 'HTML', 'CSS', 'Markdown'] },
    { group: 'Data', items: ['Pandas', 'Linfa', 'Jupyter'] },
    { group: 'Systems & tools', items: ['Linux', 'Git', 'Neovim', 'OpenGL'] },
  ],
  // Experience, newest first - the order here is the order on the page.
  //   role  (required) job title; an entry without one is skipped
  //   org   (required) company or team
  //   place (optional) city, country - or 'Remote'
  //   start (required) free text, e.g. '2023' or 'Jan 2023'
  //   end   (required) same format, or 'Present' for a current role
  //   blurb (optional) one or two sentences about the work
  //   tags  (optional) small pills, e.g. ['Rust', 'Embedded']
  // TBD - both entries below are placeholders; replace them with real roles.
  experience: [
    {
      role: 'TBD job title',
      org: 'TBD company',
      place: 'TBD city, country',
      start: 'TBD start',
      end: 'Present',
      blurb: 'TBD: one or two sentences about what you did and what it ran on.',
      tags: ['TBD tag', 'TBD tag'],
    },
    {
      role: 'TBD earlier job title',
      org: 'TBD earlier company',
      place: 'TBD city, country',
      start: 'TBD start',
      end: 'TBD end',
      blurb: 'TBD: one or two sentences about the earlier role.',
      tags: ['TBD tag'],
    },
  ],
  // Education, newest first. Same shape as experience, minus tags.
  //   degree (required) e.g. 'BSc Computer Science'; an entry without one is skipped
  //   org    (required) school or university
  //   place  (optional) city, country
  //   start  (required) free text, e.g. '2019'
  //   end    (required) same format, or 'Present' while still studying
  //   blurb  (optional) one or two sentences - focus, thesis, honours
  // TBD - both entries below are placeholders; replace them with real studies.
  education: [
    {
      degree: 'TBD degree',
      org: 'TBD school',
      place: 'TBD city, country',
      start: 'TBD start',
      end: 'TBD end',
      blurb: 'TBD: focus, thesis or anything worth naming.',
    },
    {
      degree: 'TBD earlier degree',
      org: 'TBD earlier school',
      place: 'TBD city, country',
      start: 'TBD start',
      end: 'TBD end',
      blurb: 'TBD: focus, thesis or anything worth naming.',
    },
  ],
  // GitHub contribution chart (Activity section).
  github: 'aegisssc',
};
