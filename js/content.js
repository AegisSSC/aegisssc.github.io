// Site content. Edit this file to change what the page shows.
// (M3 adds about, projects, skills, experience, education and the GitHub handle
// for the activity chart.)
window.SITE = {
  name: 'Brandon Wingard',
  initials: 'BW',
  // Hero photo. Leave empty to show the initials instead. Square image,
  // 400-800px; it is displayed as a 96px circle (192px on a retina screen).
  avatar: '',                   // e.g. 'images/avatar.jpg'
  tagline: 'Full-stack developer and data scientist, building in Rust, Python and C.',
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
    // Original Base of Operations Vienna will go here if I move
    { name: 'Greenville, SC, USA', location: [34.8526, -82.394], style: 'highlight' },

    // IAEA Project Locations
    { name: 'Tokyo, Japan', location: [35.6762, 139.6503] },                // TOK
    { name: 'Toronto, Canada', location: [43.6532, -79.3832] },             // TOR
    { name: 'Luxembourg', location: [49.6116, 6.1319] },                    // EURATOM
    { name: 'Rio de Janeiro, Brazil', location: [-22.9068, -43.1729] },     // ABACC

    { name: 'Mol, Belgium', location: [51.1906, 5.115] },                   // RECUMO
    { name: 'Cape Town, South Africa', location: [-33.9249, 18.4241] },     // AZBDT NPP
    { name: 'Aomori, Japan', location: [40.8222, 140.7474] },               // JMOX NPP
    { name: 'CERN, Switzerland', location: [46.233, 6.0557] },              // CHZ NPP
    { name: 'Paks, Hungary', location: [46.6225, 18.8558] },                // Paks NPP
    { name: 'Taipei, Taiwan', location: [25.033, 121.5654] },               // Taiwan NPP
    { name: 'Chippawa Hill, ON, Canada', location: [44.5124, -81.3297] },   // Bruce NPP

    // Supply Chain Technology Project Management
    { name: 'Hyderabad, India', location: [17.385, 78.4867] },              // Supply Chain Technology India Campus
    // Supply Chain Technology Project Locations
    { name: 'Huntington Beach, CA, USA', location: [33.6603, -117.9992] },  // Hybrid Apparel
    { name: 'San Bernardino, CA, USA', location: [34.1083, -117.2898] },    // Hybrid Apparel
    { name: 'Orlando, FL, USA', location: [28.5383, -81.3792] },            // 
 
    // FastFetch by ABCO Location
    { name: 'East Rutherford, NJ, USA', location: [40.8339, -74.0971] },
    // FastFetch Corp Project Locations
    { name: 'Augusta, GA, USA', location: [33.4735, -82.0105] },      // Seeds 'n' Such
    { name: 'Crystal Lake, IL, USA', location: [42.2411, -88.3162] }, // Snap-on Tools
    { name: 'Mebane, NC, USA', location: [36.096, -79.267] },         // Sports Endeavours
    { name: 'Charlotte, NC, USA', location: [35.2271, -80.8431] },    // 
    { name: 'Harrisburg, NC, USA', location: [35.3238, -80.6498] },   // Saddle Creek Logistics
    { name: 'Arlington, TX, USA', location: [32.7357, -97.1081] },    // Staci Americas/AMWare
    { name: 'Chanhassen, MN, USA', location: [44.8622, -93.5307] },   // Waytek Wire
 
  ],
  links: {
    github:   'https://github.com/aegisssc',
    linkedin: 'https://www.linkedin.com/in/brandon-wingard-4886b7148/',   // empty string = hidden
    email:    'wingardbrandonm@gmail.com',                                // empty string = hidden
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
    { name: 'Git',        slug: 'git' },                     // #F03C2E
    { name: 'GitHub',     slug: 'github', dark: 'ECEFF4' },  // #181717 is invisible on the dark bg
    { name: 'Linux',      slug: 'linux' },                   // #FCC624
    { name: 'Python',     slug: 'python' },                  // #3776AB
    { name: 'JavaScript', slug: 'javascript' },              // #F7DF1E
    { name: 'HTML5',      slug: 'html5' },                   // #E34F26
    { name: 'CSS',        slug: 'css' },                     // #663399
    { name: 'Docker',     slug: 'docker' },                  // #2496ED
    { name: 'VS Code',    slug: 'vscodium' },                // #2F80ED
    { name: 'Bash',       slug: 'gnubash' },                 // #4EAA25
  ],
  // About: the paragraphs under the About heading.
  about: [
    'Full-stack developer and data scientist based in Vienna, with a B.S. in Computer Science from Clemson. I work across the stack, from systems code in Rust and C to data pipelines and models in Python.',
    'I am currently working on data security and distributed systems.',
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
      blurb: 'A procedural city generator in Rust.',
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
  // Skill groups shown under Skills.
  skills: [
    { group: 'Languages', items: ['Rust', 'Python', 'C', 'C++', 'R','TypeScript', 'JavaScript', 'Lua'] },
    { group: 'Web', items: ['SvelteKit', 'React', 'HTML', 'CSS', 'Markdown'] },
    { group: 'Data', items: ['Pandas', 'Numpy', 'Scikit', 'Linfa', 'Jupyter'] },
    { group: 'Systems & tools', items: ['Linux', 'Git', 'Neovim', 'OpenGL', 'Terraform'] },
  ],
  // Experience, newest first - the order here is the order on the page.
  //   role  (required) job title; an entry without one is skipped
  //   org   (required) company or team
  //   place (optional) city, country - or 'Remote'
  //   start (required) free text, e.g. '2023' or 'Jan 2023'
  //   end   (required) same format, or 'Present' for a current role
  //   blurb (optional) one or two sentences about the work
  //   tags  (optional) small pills, e.g. ['Rust', 'Embedded']
  experience: [
    {
      role: 'Associate Equipment Data Management Engineer',
      org: 'IAEA Department of Safeguards',
      place: 'Vienna, Austria',
      start: 'September 2025',
      end: 'Present',
      blurb: 'Primary Network and Data Management lead for JMOX. Lead developer on Distributed Network SoH monitoring.',
      tags: ['Cybersecurity', 'Distributed Systems', 'InfraOps', 'Fullstack Development'],
    },
    {
      role: 'WMS Integration Specialist',
      org: 'Supply Chain Technology LLC',
      place: 'Greenville, SC, USA',
      start: 'September 2024',
      end: 'August 2025',
      blurb: 'Worked as a Scrum Master for a multinational team providing features to clients across the world. Lead the Experimental AI efforts to explore optimizations in supplychain workflows',
      tags: ['Fullstack Development', 'ML/AI'],
    },
    {
      // Several titles at one employer: list them newest first and the page
      // shows the whole stay, with each title and its own dates beneath.
      org: 'FastFetch Corporation',
      place: 'Seneca, SC, USA',
      roles: [
        { role: 'Lead Software Engineer', start: 'May 2023', end: 'August 2024' }, 
        { role: 'Software Engineer', start: 'June 2022', end: 'May 2023' },
      ],
      blurb: 'Served as Primary Client-Facing Project Manager and as a new product software lead.',
      tags: ['Fullstack Development', 'Web Development', 'Project Management', 'Client Engagement', 'ML/AI'],
    },
    {
      role: 'Research Assistant',
      org: 'Clemson University',
      place: 'Clemson, SC, USA',
      start: 'January 2020',
      end: 'May 2022',
      blurb: 'Focused primarily on Computer Vision Guided Micro-Arial Vehicles. Also conducted research on both Lossless and Lossy Data Compression.',
      tags: ['HPC', 'ML/CV','mUAV'],
    },
  ],
  // Education, newest first. Same shape as experience, minus tags.
  //   degree (required) e.g. 'BSc Computer Science'; an entry without one is skipped
  //   org    (required) school or university
  //   place  (optional) city, country
  //   start  (required) free text, e.g. '2019'
  //   end    (required) same format, or 'Present' while still studying
  //   blurb  (optional) one or two sentences - focus, thesis, honours
  education: [
    {
      degree: 'B.S. Computer Science',
      org: 'Clemson University',
      place: 'Clemson, SC, USA',
      start: '2018',
      end: '2022',
    },
  ],
  // GitHub contribution chart (Activity section).
  github: 'aegisssc',
};
