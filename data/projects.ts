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
          'Custom graphical editor with scene preview and editing',
          '2D + 3D development support',
        ],
        link: 'https://github.com/AliAhmad-M/NovaEngine'
      },
      {
        number: '02',
        name: '2D Physics Engine',
        desc: 'A physics simulation engine implementing rigid body dynamics, collision detection algorithms, and impulse-based physics solving for both linear and angular forces',
        stack: ['C#', 'Raylib', 'OOP', 'Linear Algebra'],
        features: [
          'Rigid body dynamics with rotation',
          'SAT collision detection',
          'Impulse-based response system',
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
        desc: 'A modern, full-stack blog and discussion platform with secure authentication, markdown support, and responsive design built as a web technologies university project.',
        stack: ['SvelteKit', 'TypeScript', 'MongoDB', 'Prisma'],
        features: [
          'Email-based auth with session management',
          'Password hashing & secure sessions',
          'SvelteKit for frontend and routing',
          'MongoDB with Prisma ORM for database',
          'Markdown-based content creation',
          'Fully responsive interface'
        ],
        link: 'https://github.com/AliAhmad-M/Kites',
        site: 'https://kites-forums.vercel.app'
      },
      {
        number: '02',
        name: 'Portfolio Website',
        desc: 'Literally this website that you\'re looking at right now, basically a place for me to showoff all the work that I have done so far.',
        stack: ['SvelteKit', 'JavaScript', 'CSS', 'HTML'],
        features: [
          'Fully responsive design',
          'Smooth scroll animations',
          'Dynamic project filtering',
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
        stack: ['Python', 'Pytorch', 'TorchRL', 'OpenAI Gym'],
        features: [
          'Double Q-learning based Deep RL Model',
          'Accurate Super Mario Bros environment',
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
          'A* pathfinding implementation',
        ],
        link: 'https://github.com/AliAhmad-M/GodotEcosystem'
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
          'Interactive real-time simulationn'
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
        link: 'https://github.com/AliAhmad-M/CelestialBodySimulation-C'
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
        link: 'https://github.com/AliAhmad-M/3D_Renderer_C'
      },
      {
        number: '04',
        name: 'Cloth Simulation with Tearing',
        desc: 'A realistic cloth physics simulation featuring tearing mechanics, built using Verlet integration and constraint solving algorithms',
        stack: ['C', 'OpenGL', 'Physics', 'Verlet Integration'],
        features: [
          'Verlet integration for physics',
          'Constraint-based solving',
          'Realistic cloth tearing',
          'Interactive real-time simulation'
        ],
        link: 'https://github.com/AliAhmad-M/ClothSimulationC'
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
  'Languages':  ['Assembly', 'C/C++', 'C#', 'Python', 'TypeScript', 'JavaScript', 'Java'],
  'Web Dev':    ['Next.js', 'Sveltekit', 'Node.js', 'Express.js', 'React.js', 'Svelte'],
  'Database':   ['SQL', 'MongoDB', 'Supabase', 'Prisma ORM'],
  'Game Dev': ['Unity', 'Godot', 'OpenGL', 'SDL2', 'Raylib'],
  'Dev Tools': ['Git', 'Bash', 'VS Code', 'Visual Studio', 'JetBrains IDEs'],
  'ML/Data': ['NumPy', 'Pandas', 'Matplotlib', 'OpenCV', 'Scikit-Learn', 'Pytorch', 'YOLO']
};