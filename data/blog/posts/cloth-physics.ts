import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'cloth-physics',
  title: 'Cloth Simulation in 2D and 3D using C and OpenGL',
  tags: ['C', 'OpenGL', 'Computer Graphics', 'Physics'],
  cover: '/blog/cloth-physics/cover.png',
  excerpt:
    'A guide to simulating cloth physics with Verlet integration and distance constraints, and rendering it using OpenGL.',
  markdown: `
This guide builds a cloth simulation from scratch in C and OpenGL, first in 2D and then in 3D. The cloth is a grid of particles 
joined by distance constraints. Particles are updated using a technique known as Verlet integration.

There are many ways to simulate cloth physics. What follows is the approach I've used in my own projects, one 2D and one 3D. 
I'll point out the spots where you might consider making a different design choice.

You'll need basic C, a working OpenGL 3.3 context (GLFW and glad in these examples) and some vector math: addition, subtraction, 
dot and cross products. Creating the window is skipped.

## The big picture

Every frame does three things, in this order:

\`\`\`c
update_particles();   // move every particle
solve_constraints();  // solve cloth constraints
draw();               // render the cloth
\`\`\`

Integration moves particles as if nothing connected them, so the cloth stretches. Constraints then fix the stretching. Drawing 
reads the final positions. The 2D and 3D versions share this structure. Only the vector type, the camera and the drawing code change.

# Part 1: Cloth in 2D

## Particles and Verlet integration
 
Simulating motion calculating positions based on velocities and acceleration at each step. We need to work out where a particle ends 
up after one more step of length \`dt\`. The methods differ in what they store and in how well they behave when the simulation gets 
demanding.
 
### Euler integration
 
The standard method is Euler integration. Each particle stores a position and a velocity. Every step, the velocity moves the position, 
and the acceleration changes the velocity:
 
\`\`\`c
position = position + velocity * dt;
velocity = velocity + accel * dt;
\`\`\`
 
It is easy to write and easy to reason about, and it works well for plenty of things. Cloth turns out to be a poor fit, because it
accumulates a numerical error at every time step.
 
### Verlet integration
 
Verlet integration gets a similar result without storing a velocity at all, instead it stores its current position and where it was
one time step ago. We calculate the particle's position in the next frame using its previous position and acceleration.
 
In code, a particle needs only this:
 
\`\`\`c
typedef struct {
    Vector2 curr_pos;
    Vector2 prev_pos;
    int stationary;
} Particle;
\`\`\`
 
In code the formula for Verlet integration is written as:
 
\`\`\`c
void integrate(Particle* p, Vector2 a, float dt)
{
    if (p->stationary) return;
 
    Vector2 next = {
        2.0f * p->curr_pos.x - p->prev_pos.x + a.x * dt * dt,
        2.0f * p->curr_pos.y - p->prev_pos.y + a.y * dt * dt
    };
 
    p->prev_pos = p->curr_pos;
    p->curr_pos = next;
}
\`\`\`

## Constraints

A distance constraint joins two particles and remembers how far apart they should be, The distance between the two particles should
always be equal to their initial distance at the time of creating the constraint:

\`\`\`c
typedef struct {
    Particle* particle_a;
    Particle* particle_b;
    float initial_distance;
} Constraint;
\`\`\`

Solving a constraint means measuring the current distance and moving the particles so it matches the initial rest distance again:

\`\`\`c
void solve_constraint(Constraint* c)
{
    Particle* a = c->particle_a;
    Particle* b = c->particle_b;
    if (a->stationary && b->stationary) return;

    Vector2 delta = { b->curr_pos.x - a->curr_pos.x,
                      b->curr_pos.y - a->curr_pos.y };
    float dist = sqrtf(delta.x * delta.x + delta.y * delta.y);
    if (dist < 0.0001f) return;

    float diff = (dist - c->initial_distance) / dist;
    Vector2 correction = { delta.x * 0.5f * diff, delta.y * 0.5f * diff };

    if (a->stationary)      { /* b -= correction * 2 */ }
    else if (b->stationary) { /* a += correction * 2 */ }
    else                    { /* a += correction, b -= correction */ }
}
\`\`\`

### Why one pass is not enough

Fixing one constraint moves two particles, and those particles belong to other constraints, which are now slightly off. Running through the whole list once leaves some error behind. Running it repeatedly lets the error settle. The 2D loop does 32 passes:

\`\`\`c
for (int iter = 0; iter < 32; iter++)
    for (unsigned int i = 0; i < constraint_count; i++)
        solve_constraint(&constraints[i]);
\`\`\`

## Building the 2D cloth

The particles live in one flat array. A particle at row \`i\` and column \`j\` is stored at index \`i * cols + j\`:

\`\`\`c
int rows = 30;
int cols = 20;
int spacing = 16;
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        int idx = i * cols + j;
        Vector2 pos = { start_x + j * spacing, start_y + i * spacing };

        particles[idx].curr_pos = pos;
        particles[idx].prev_pos = pos;       // same position, so zero velocity
        particles[idx].stationary = (i == 0);
    }
}
\`\`\`

Starting with \`prev_pos\` equal to \`curr_pos\` means the cloth begins at rest. Pinning the whole top row (\`i == 0\`) makes it 
hang like a curtain. The code above uses 30 rows, 20 columns and a spacing of 16 pixels.

Each particle gets a constraint to its right neighbor and one to the neighbor below it:

\`\`\`c
if (j < cols - 1) add_constraint(idx, idx + 1);      // right
if (i < rows - 1) add_constraint(idx, idx + cols);   // below
\`\`\`

## Rendering the 2D cloth

The 2D cloth is drawn as lines, one per active constraint. Particle positions are in pixels, with the origin at the top left and 
Y pointing down. OpenGL expects coordinates from -1 to 1 with Y pointing up, so the vertex shader converts:

\`\`\`glsl
#version 330 core
layout(location = 0) in vec2 aPos;
uniform vec2 uResolution;

void main() {
    vec2 ndc = (aPos / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}
\`\`\`

Dividing by the window size gives a range of 0 to 1. Multiplying that by 2 and subtracting 1 from it stretches that to -1 to 1. The Y component 
is negated to flip the axis. The fragment shader only outputs a color uniform. A line needs just two points, so the vertex buffer holds four floats. 
It is created with \`GL_DYNAMIC_DRAW\` and rewritten for every line:

\`\`\`c
float verts[4] = { x1, y1, x2, y2 };
glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(verts), verts);
glDrawArrays(GL_LINES, 0, 2);
\`\`\`

A full frame ties the three steps together:

\`\`\`c
// update particles
for (unsigned int i = 0; i < particle_count; i++)
    integrate(&particles[i], gravity, dt);

// solve constraints
for (int iter = 0; iter < 32; iter++)
    for (unsigned int i = 0; i < constraint_count; i++)
        solve_onstraint(&constraints[i]);

// draw
for (unsigned int i = 0; i < constraint_count; i++)
    if (constraints[i].active)
        draw_line2D(&constraints[i]);
\`\`\`

This is the simplest way to draw it, and it makes one draw call per line, about 1150 for this grid. That runs fine at this size. 
For bigger cloths, collect all the vertices into one array and draw them with a single call. For more information on that technique,
you can read through my blog on [2D sprite rendering](https://aliahmadm.vercel.app/blog/sprites-2D).

# Part 2: Cloth in 3D

Almost nothing in the physics changes when you move from 2D to 3D. Vectors get a Z component, constraints measure 3D distance, and 
gravity points along negative Y, because in 3D Y usually points up. The new work is in the camera, the mesh and the lighting.

## Particles in 3D

Here is how particles are defined in the 3D cloth engine. We add a radius for collisions and r, g, b color values for drawing.
Note that here we use the variable name \`is_fixed\` instead of \`is_stationary\` as this code is from a different project of 
mine.

\`\`\`c
typedef struct {
    vector3_t prev_position;
    vector3_t curr_position;

    float radius;
    bool is_fixed;

    uint8_t color_r, color_g, color_b;
} particle_t;
\`\`\`


## Constraints in 3D

Constraints work the same way as they did in 2D with one exception: when constructing the cloth, we also add constraints between
diagonal elements instead of just adding constraints between the right and bottom neighbors.

## Colliding with a sphere

To make the cloth drape over something, particles need to stay outside a sphere. The sphere is stored as a particle that is fixed 
in place, with a large radius. For every particle:

\`\`\`c
vector3_t delta = vector3_sub(p->curr_position, 
                              sphere->curr_position);   // get vector pointing from sphere to particle
float dist_sq   = vector3_dot(delta, delta);            // compute the squared magnitude of that vector
float min_dist  = p->radius + sphere->radius;           // the closest a particle can get to the sphere

// check if any cloth particle is touching the sphere
if (dist_sq < min_dist * min_dist && dist_sq > 0.000001f) {
    float dist       = sqrtf(dist_sq);                  // compute distance between sphere and particle
    vector3_t normal = vector3_mul(delta, 1.0f / dist); // normalize the vector from sphere to particle

    // push the particle out along the line from the sphere's center
    p->curr_position = vector3_add(p->curr_position,
                                   vector3_mul(normal, min_dist - dist));

    // slow the particle down while it touches the sphere
    vector3_t vel    = vector3_sub(p->curr_position, p->prev_position);
    p->prev_position = vector3_add(p->prev_position, vector3_mul(vel, 0.1f));
}
\`\`\`

Comparing squared distances avoids a square root for the particles that are not touching, which is nearly all of them. The lower bound on \`dist_sq\` prevents a division by zero if a particle lands exactly on the center.

The push is a direct position edit, which fits the Verlet approach. The last block is a crude friction. Moving \`prev_position\` a tenth of the way toward \`curr_position\` shrinks the implied velocity by 10 percent every time the particle is in contact. That is enough to keep the cloth from sliding off the sphere.

Collisions and constraints work against each other. A collision push can stretch a link, and a constraint pass can pull a particle back into the sphere. The loop alternates between them, so each gets a chance to correct the other:

\`\`\`c
for (int iter = 0; iter < 8; iter++) {
    for (int i = 0; i < NUM_CONSTRAINTS; i++)
        solve_constraint(&constraints[i]);

    for (int i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++)
        solve_collision(&particles[i], sphere);
}
\`\`\`

## Building the 3D cloth

The 3D grid lies flat in the XZ plane at a fixed height, a little above the sphere:

\`\`\`c
particles[idx].curr_position = (vector3_t){
    start_x + x * spacing, start_y, start_z + z * spacing
};
particles[idx].prev_position = particles[idx].curr_position;
\`\`\`

No particles are pinned this time. The cloth falls freely and lands on the sphere. The sphere takes the last slot in the particle 
array, which is why the array is allocated with \`GRID_WIDTH * GRID_HEIGHT + 1\` entries and the loops over cloth particles stop at \`GRID_WIDTH * GRID_HEIGHT\`.

## Rendering the 3D cloth scene
This section covers the processes behind rendering the 3D cloth, including setting up the camera, drawing triangles, calculating normals, 
implementing shading, drawing the static sphere, and putting everything together.


### The camera

In 3D, the vertex shader needs one matrix that takes a world position to the screen. It is the product of the view 
matrix (moves the world so the camera sits at the origin looking down the negative Z axis) and the projection matrix 
(makes distant things smaller and maps the visible volume into the range OpenGL clips against).

\`\`\`c
mat4_perspective(proj, fov_rad, aspect, near_clip, far_clip);
mat4_look_at(view, position, target, up);
mat4_multiply(view_proj_matrix, proj, view);
\`\`\`

The camera in the example uses a 45 degree field of view with near and far planes at 0.1 and 100. The multiplication happens 
once per frame on the CPU, and the result goes to the shader as a uniform. Each vertex is then transformed by a single multiplication:

\`\`\`glsl
gl_Position = uViewProj * vec4(aPos, 1.0);
\`\`\`

Depth testing is enabled, so closer surfaces cover farther ones no matter what order they are drawn in.

### Rendering triangles

Each cell of the grid, the square between four neighboring particles, becomes one quad, which is two triangles:

\`\`\`c
vector3_t p0 = particles[z * W + x].curr_position;
vector3_t p1 = particles[z * W + x + 1].curr_position;
vector3_t p2 = particles[(z + 1) * W + x + 1].curr_position;
vector3_t p3 = particles[(z + 1) * W + x].curr_position;

// triangles: (p0, p1, p2) and (p0, p2, p3)
\`\`\`

The loops run to \`W - 1\` and \`H - 1\`, since the last row and column of particles only act as corners. A 16 by 16 grid gives 
15 by 15, which is 225 quads. Because the particle positions change every frame, the triangles are rebuilt every frame as well.

### Normals

Lighting needs a normal for each vertex, a direction that points straight out of the surface. Without normals every triangle 
would be one flat shade. Normals are computed per vertex and interpolated across each triangle make the cloth look smooth.

A particle's normal comes from its neighbors. Take the particle on the left and the one on the right, and the difference between 
them gives a vector running along the cloth in X. Repeat the process with the particles above and below for Z. Two vectors lying 
in the 
surface have a cross product that is perpendicular to it:

\`\`\`c
vector3_t dx = vector3_sub(right, left);
vector3_t dz = vector3_sub(down, up);
vector3_t n  = vector3_normalize(vector3_cross(dz, dx));
\`\`\`

The order of the cross product decides which side the normal points to. In the case of a flat cloth, \`cross(dz, dx)\` points up along positive 
Y. At the borders there is no neighbor on one side, so the code uses the particle itself in that place. The two vectors 
then span a shorter distance, but they still lie along the surface.

My version recomputes the normal for every corner of every quad, so each interior particle's normal is calculated four times per frame. 
Computing them once into an array would be cheaper.

### Shading

The fragment shader is a minimal diffuse model:

\`\`\`glsl
vec3 N = normalize(vNormal);
vec3 L = normalize(uLightDir);
float diff = abs(dot(N, L));
vec3 shaded = uColor * (0.25 + diff * 0.75);
FragColor = vec4(shaded, 1.0);
\`\`\`

The dot product of the normal and the light direction measures how directly the surface faces the light. The ambient value of 0.25 
prevents the surfaces that are facing away from the light from going fully black. The \`abs\` is there for cloth specifically. A cloth has two sides, 
and when you view it from below, its normal points away from the light and the dot product turns negative. Taking the absolute value 
lights both sides the same way. 

The sphere uses \`max(dot, 0)\` instead, since it has a clear outside.

### Uploading and drawing

Each quad is turned into six vertices, with the position and normal interleaved:

\`\`\`c
vector3_t verts[6]   = { p0, p1, p2, p0, p2, p3 };
vector3_t normals[6] = { n0, n1, n2, n0, n2, n3 };

// write x, y, z, nx, ny, nz for each of the six vertices into data[36]

glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(data), data);
glDrawArrays(GL_TRIANGLES, 0, 6);
\`\`\`

The buffer is created once, with room for 36 floats, and the attributes are set up with a stride of six floats. Location 0 reads the 
position at offset 0, and location 1 reads the normal starting at the third float. Every quad rewrites the buffer and draws on its own, 
so the cloth costs 225 draw calls. As with the 2D lines, this is fine at this size and would be the first thing to batch in a larger scene.

### The sphere

The sphere is a mesh generated once at startup. Vertices are placed on a unit sphere with spherical coordinates:

\`\`\`c
float phi   = PI * ring / rings;            // 0 at the top, PI at the bottom
float theta = 2.0f * PI * sector / sectors; // around the Y axis

x = sinf(phi) * cosf(theta);
y = cosf(phi);
z = sinf(phi) * sinf(theta);
\`\`\`

Each ring and sector pair becomes a quad, so the index buffer holds two triangles per pair. This mesh goes into a \`GL_STATIC_DRAW\` 
buffer, as it never changes. For a unit sphere that is centered at the origin, the position of a vertex is also its normal, so the 
shader reuses \`aPos\` for lighting. Two uniforms place the mesh in the world: \`uScale\` for the radius and \`uOffset\` for the center. 

### The frame

Put together, one frame of the 3D version reads:

\`\`\`c
// physics: zero or more fixed steps
while (accumulator >= dt) {
    update_particles(dt);
    solve_constraints_and_collisions(8);
    accumulator -= dt;
}

// rendering
update_matrix(camera);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
draw_cloth3D();
draw_sphere();
\`\`\`

## Source code
For a better understanding of cloth physics, you can checkout the Github repos for the full implementation of the 
[2D cloth simulation](https://github.com/AliAhmad-M/2D-Cloth-Simulation) and [3D cloth simulation](https://github.com/AliAhmad-M/3D-Cloth-Simulation).
`,
};

export default post;