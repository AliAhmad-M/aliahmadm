export const projectCategories = {
  'game-dev': {
    label: 'Game Dev',
    projects: [
      {
        number: '01',
        name: 'Nova Engine',
        desc: 'A high-performance custom game engine built from scratch in C++, featuring a custom ECS architecture and integrated graphical interface for editing game scenes.',
        stack: ['C++', 'OpenGL', 'ImGUI', 'Box2D', 'Jolt Physics'],
        features: [
          'Entity Component System using paginated sparse sets',
          'All component operations have O(1) time complexity',
          'Handles close to 150,000 sprite entities at 50-60 FPS (capped at 60) on a 4GB VRAM GPU',
          'Custom graphical editor with scene preview and editing',
          'Box2D for 2D physics and Jolt Physics for 3D',
          '2D + 3D development support'
        ],
        link: 'https://github.com/AliAhmad-M/NovaEngine'
      },
      {
        number: '02',
        name: 'Blackwood',
        desc: 'A murder mystery visual novel with a branching storyline, made by a team of 3 in the Godot Engine using the Dialogue Manager addon. A playable demo is available on itch.io.',
        stack: ['Godot', 'GDScript', 'Dialogue Manager'],
        features: [
          'Branching choices that shape the story',
          '5 places where the player can die and restart',
          'Demo ends on a "To be continued" screen',
          'Save/load system'
        ],
        link: 'https://github.com/AliAhmad-M/VisualNovel',
        download: "https://blaze-glitch.itch.io/blackwood-demo"

      },
      {
        number: '03',
        name: '2D Physics Engine',
        desc: 'A physics simulation engine implementing rigid body dynamics, collision detection algorithms, and impulse-based physics solving for both linear and angular forces',
        stack: ['C#', 'Raylib', 'OOP', 'Linear Algebra'],
        features: [
          'Rigid body dynamics with rotation',
          'SAT collision detection',
          'Impulse-based response system',
          'Runs 500+ simultaneous bodies at 50-60 FPS (capped at 60)',
          'Real-time visualization'
        ],
        link: 'https://github.com/AliAhmad-M/Raylib-Physics-Engine'
      }
    ]
  },
  'web-dev': {
    label: 'Web Dev',
    projects: [
      {
        number: '01',
        name: 'Kites (Blogs Platform)',
        desc: 'A modern, full-stack blog and discussion platform with secure authentication, markdown support, and responsive design, built by a team of 3 as a web technologies university project.',
        stack: ['SvelteKit', 'TypeScript', 'MongoDB', 'Prisma'],
        features: [
          'Email-based auth with session management',
          'Password hashing & secure sessions',
          'SvelteKit for frontend and routing',
          'MongoDB with Prisma ORM for database',
          'Markdown-based content creation',
          'Beta tested with 6 users (3 developers, 3 beta testers) before launch',
          'Fully responsive interface'
        ],
        link: 'https://github.com/AliAhmad-M/Kites',
        site: 'https://kites-forums.vercel.app'
      },
      {
        number: '02',
        name: 'Portfolio Website',
        desc: 'Literally this website that you\'re looking at right now, basically a place for me to show off all the work that I have done so far.',
        stack: ['SvelteKit', 'JavaScript', 'CSS', 'HTML'],
        features: [
          'Fully responsive design',
          'Smooth scroll animations',
          'Dynamic project filtering',
          'Blog page for my technical write-ups',
          'Custom CSS animations and effects'
        ],
        link: 'https://github.com/AliAhmad-M/aliahmadm'
      }
    ]
  },
  'ai': {
    label: 'Artificial Intelligence',
    projects: [
      {
        number: '01',
        name: 'Super Mario Bros AI',
        desc: 'A double Q-learning based deep reinforcement learning model built with Pytorch and gym-super-mario-bros that learns how to play Mario',
        stack: ['Python', 'Pytorch', 'TorchRL', 'OpenAI Gym', 'PySide6'],
        features: [
          'Double Q-learning based Deep RL Model',
          'Accurate Super Mario Bros environment',
          'Semantic abstraction layer that reduces state complexity',
          'Trained for 4,000 episodes; cleared Level 1-1 in 1 of 25 evaluation runs (best reward 3,029)',
          'PySide6 dashboard to train, test and monitor the agent live',
          'Training model on level of your choice',
          'Testing trained model with visualization'
        ],
        link: 'https://github.com/AliAhmad-M/SMB-RL'
      },
      {
        number: '02',
        name: 'AI Ecosystem Simulation',
        desc: 'An AI-based ecosystem simulation in Godot implementing FSMs with behavioral states and pathfinding to simulate prey-predator interactions and natural selection',
        stack: ['Godot', 'GDScript', 'FSM', 'Pathfinding'],
        features: [
          'Finite State Machines for creature behavior',
          'Prey-predator interaction dynamics',
          'Natural selection mechanics',
          'Runs up to about 50 agents at 60 FPS; the map runs out of space before performance does',
          'A* pathfinding implementation',
        ],
        link: "https://github.com/AliAhmad-M/GodotEcosystem",
        download: "https://blaze-glitch.itch.io/ecosystem"
      },
      {
        number: '03',
        name: 'Capricorn',
        desc: 'A desktop AI assistant built with Electron and the Groq API that chats in text, understands voice, and can use tools such as web search. Based on Project Capricorn from Cyberpunk: Edgerunners.',
        stack: ['Electron', 'JavaScript', 'HTML', 'CSS', 'Groq API', 'Fish Audio API'],
        features: [
          'Text replies in under a second',
          'Tool use, including web search through DuckDuckGo or Brave',
          'Voice input with Whisper transcription',
          'Spoken replies through Fish Audio text-to-speech',
          'Up to 3 fallback models per stage, so one failure does not stop a reply',
          'Portable Windows release that runs without installing Node.js'
        ],
        link: 'https://github.com/AliAhmad-M/Capricorn'
      }
    ]
  },

  'experimental': {
    label: 'Experimental & Fun',
    projects: [
      {
        number: '01',
        name: '3D Cloth Simulation',
        desc: 'Cloth material physics and interaction with solid objects in three dimensions. Implemented from scratch using C and OpenGL',
        stack: ['C', 'OpenGL', 'Physics', 'Verlet Integration'],
        features: [
          'Verlet integration for physics',
          'Constraint-based solving',
          'Realistic 3D cloth mesh',
          'Interactive real-time simulation'
        ],
        link: 'https://github.com/AliAhmad-M/3D-Cloth-Simulation'
      },
      {
        
        number: '02',
        name: '3D Celestial Body Simulation',
        desc: 'A 3D space-time curvature simulation built in C and Raylib that accurately models gravitational effects and celestial body interactions',
        stack: ['C', 'Raylib', 'Physics', 'Linear Algebra'],
        features: [
          'Space-time curvature simulation',
          'Accurate gravitational physics',
          'Real-time 3D visualization',
          'Multiple celestial body interactions'
        ],
        link: 'https://github.com/AliAhmad-M/Celestial-Body-Simulation'
      },
      {
        number: '03',
        name: '3D Renderer from Scratch',
        desc: 'A custom 3D renderer implementing weak perspective projection in C with SDL2, capable of rendering basic 3D shapes using only 2D lines',
        stack: ['C', 'SDL2', 'Graphics', 'Linear Algebra'],
        features: [
          'Weak perspective projection',
          'Vertex transformation pipeline',
          'Line-based 3D shape rendering',
          'Built entirely from scratch'
        ],
        link: 'https://github.com/AliAhmad-M/3D-Renderer'
      },
      {
        number: '04',
        name: '2D Cloth Simulation with Tearing',
        desc: 'A realistic cloth physics simulation featuring tearing mechanics, built using Verlet integration and constraint solving algorithms',
        stack: ['C', 'OpenGL', 'Physics', 'Verlet Integration'],
        features: [
          'Verlet integration for physics',
          'Constraint-based solving',
          'Realistic cloth tearing',
          'Interactive real-time simulation'
        ],
        link: 'https://github.com/AliAhmad-M/2D-Cloth-Simulation'
      },
      {
        number: '05',
        name: 'NES Pong in 6502 Assembly',
        desc: 'A Pong clone written in pure 8-bit 6502 assembly language designed to run on native NES hardware, complete with collision handling and scoring',
        stack: ['6502 Assembly', 'NES', 'Low-level Programming'],
        features: [
          'Written in pure 6502 assembly',
          'Runs on native NES emulator',
          'Custom collision detection',
          'Score tracking and game logic'
        ],
        link: 'https://github.com/AliAhmad-M/Pong-NES'
      }
    ]
  }
};

export const skills = {
  'Languages': ['Assembly', 'C/C++', 'C#', 'GDScript', 'Java', 'Python', 'TypeScript', 'JavaScript', 'HTML', 'CSS'],
  'Web Dev': ['React', 'Next.js', 'SvelteKit', 'Electron', 'Node.js', 'Express', 'ASP.NET', 'Flask', 'REST APIs', 'Authentication', 'Session Management'],
  'Database': ['MySQL', 'Oracle PLSQL', 'PostgreSQL', 'MongoDB', 'Supabase', 'Prisma ORM'],
  'Game Dev': ['Unity', 'Godot', 'OpenGL', 'SDL2', 'Raylib', 'ImGui', 'Box2D', 'Jolt Physics', 'ECS', 'Game Physics', 'Enemy AI', 'NavMesh'],
  'Dev Tools': ['Git', 'Bash', 'VS Code', 'Visual Studio', 'JetBrains IDEs', 'Azure'],
  'ML/Data': ['NumPy', 'Pandas', 'Matplotlib', 'OpenCV', 'Scikit-Learn', 'Pytorch', 'TorchRL', 'YOLO', 'Computer Vision', 'Reinforcement Learning', 'OpenAI API', 'Groq API']
};