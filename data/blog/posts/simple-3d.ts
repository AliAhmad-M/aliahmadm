import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'simple-3d',
  title: '3D Wireframe Rendering in C and SDL',
  tags: ['C', 'SDL', 'Computer Graphics'],
  cover: '/blog/simple-3d/cover.png',
  excerpt:
    'A guide towards implementing basic 3D rendering using 2D lines in C and SDL2.',
  markdown: `
This post covers the logic behind drawing a 3D graphics, using C and SDL to convert 3D point data into 2D screen positions. 
Note that real renderers use a projection matrix and the GPU and this is a simple version that I used for practice.

## A cube is points and edges

A wireframe cube is 8 corners joined by 12 edges. The corners sit at (x, y, z) = (±1, ±1, ±1), which centers the cube on the origin and gives 
it sides of length 2 units.

\`\`\`c
vec3_t vertices[8] = {
    { -1, -1, -1 }, 
    { -1, -1,  1 }, 
    { -1,  1, -1 }, 
    { -1,  1,  1 },
    {  1, -1, -1 }, 
    {  1, -1,  1 }, 
    {  1,  1, -1 }, 
    {  1,  1,  1 }
};
\`\`\`

Here, \`vertices\` is an array of 3D vectors. Where a vector has x, y and z float components and each vector is represented by the \`vec3_t\` struct:

\`\`\`c
vtypedef struct {
    float x;
    float y;
    float z;
} vec3_t;
\`\`\`

Two corners share an edge when they differ in exactly one coordinate. Each corner has 3 such neighbors, and every edge gets counted 
from both ends, so 8 * 3 / 2 gives 12.

\`\`\`c
edge_t edges[12] = {
    { vertices[0], vertices[1] }, { vertices[1], vertices[3] },
    { vertices[3], vertices[2] }, { vertices[2], vertices[0] },   // face at x = -1
     
    { vertices[4], vertices[5] }, { vertices[5], vertices[7] },
    { vertices[7], vertices[6] }, { vertices[6], vertices[4] },   // face at x = +1

    { vertices[0], vertices[4] }, { vertices[1], vertices[5] },
    { vertices[3], vertices[7] }, { vertices[2], vertices[6] }    // joins the two faces
};
\`\`\`

An edge is two vector endpoints and a \`scale\` value which adjusts the edge's length in pixels. Each edge is represented by the 
\`edge_t\` struct:

\`\`\`c
typedef struct {
    vec3_t start;
    vec3_t end;
    size_t scale;
} edge_t;
\`\`\`

Every shape can be stored as an array of edges. We calculate the vector from one vertex of the edge to the other and project that 3D 
vector onto a 2D screen to draw a line. 

## From 3D to 2D

A screen only has x and y, so each 3D point needs to be represented in 2D such that the scene still appears to look 3D. To do this
we put need an FOV value such that the screen is at z = 0 and the eye is at z = -FOV, looking towards positive z. Any point at (x, y, z) 
is seen along a straight line from the eye, and the spot where that line crosses the screen is where the point is drawn. By similar 
triangles, the point's offset x sits at a distance of FOV + z from the eye, while the screen sits at a distance of FOV. That gives:

\`\`\`
screen_x = x * FOV / (FOV + z)
screen_y = y * FOV / (FOV + z)
\`\`\`

In code, where we consider the window size and the scale of the edge as well, this looks like:
\`\`\`c
vec2_t project(vec3_t vector, size_t scale)
{
    return (vec2_t){
        WINDOW_SIZE_X / 2 + (FOV * vector.x) / (FOV + vector.z) * scale,
        WINDOW_SIZE_Y / 2 + (FOV * vector.y) / (FOV + vector.z) * scale
    };
}
\`\`\`

By default the origin is at the top-left corner of the screen \`(0, 0)\`. Adding half the window size moves it to the center. 
This function takes a 3D vector and converts it to a 2D point on the screen.

## Weak perspective projection

If the divisor hardly changes across an object, it is wasteful to compute it for every point. Weak perspective projection skips that work. It picks one depth for the whole object, usually the depth of its center, and divides every point by the same number:

\`\`\`c
vec2_t project_weak(vec3_t v, float depth, size_t scale)
{
    float factor = FOV / (FOV + depth) * scale;

    return (vec2_t){
        WINDOW_SIZE_X / 2 + v.x * factor,
        WINDOW_SIZE_Y / 2 + v.y * factor
    };
}
\`\`\`

The \`factor\` is computed once per object. The result is the object's x and y are scaled by a single number, which is why the 
method is also described as an orthographic projection but with a distance-dependent scale.

Orthographic projection is the version with no division at all, where size never depends on distance. Weak perspective sits 
between the two. The object as a whole still shrinks when it moves away, but the points inside it all shrink by the same amount.

The approximation holds when the object is small compared to its distance from the eye, which means the depth range inside the object 
is small next to \`FOV + depth\`. So the approach works well for small, distant objects and it is common in computer vision for exactly 
that reason.

My code uses full perspective, since the per-vertex division costs very little for a few dozen edges. Switching to weak perspective only requires computing the cube's center depth once per frame and passing it to \`project_weak\` instead of \`project\`.

## Drawing the edges

With projection in place, drawing is a loop. Project both endpoints of every edge and connect them with a line:

\`\`\`c
for (int i = 0; i < edge_count; i++)
{
    vec2_t a = project(to_view_space(edges[i].start), edges[i].scale);
    vec2_t b = project(to_view_space(edges[i].end),   edges[i].scale);

    SDL_RenderDrawLineF(renderer, a.x, a.y, b.x, b.y);
}
\`\`\`

\`to_view_space\` is the camera step, covered next. Each frame the renderer clears the screen, draws every edge, and calls 
\`SDL_RenderPresent\` once at the end.

## The camera

So far the eye is fixed. To look around, the world is moved instead of the eye. Every point is first re-expressed from the 
camera's point of view, and then projected as before. The camera has a position and a facing direction. Using the facing direction 
and a fixed world up, two cross products give the other two axes:

\`\`\`c
right = normalize(cross(facing, world_up));
up    = normalize(cross(right, facing));
\`\`\`

Together, \`right\`, \`up\` and \`facing\` are the camera's three axes. To see a point from the camera, subtract the camera 
position, then measure how far the result lies along each axis with a dot product:

\`\`\`c
vec3_t d = { v.x - p.x, v.y - p.y, v.z - p.z };   // p is the camera position

view.x =  dot(right, d);
view.y =  dot(up, d);
view.z = -dot(facing, d);
\`\`\`

The z line is negated so that a larger z means farther from the viewer, which is what the projection formula expects. My implementation 
stores these three rows in a 4x4 matrix, with the position subtraction folded into the last column, but the result is the same. 
The code's world up points along negative y, since screen y grows downward in SDL2.

### Moving and turning

Moving the camera changes \`p\`. The keys slide the position along the camera's own axes, so movement follows where the camera is pointing:

\`\`\`c
if (key_state[SDL_SCANCODE_W]) position -= facing * 0.4f;
if (key_state[SDL_SCANCODE_S]) position += facing * 0.4f;
if (key_state[SDL_SCANCODE_A]) position -= right  * 0.1f;
if (key_state[SDL_SCANCODE_D]) position += right  * 0.1f;
\`\`\`

Turning rotates \`facing\` around one of the other axes. Rotating around \`right\` tilts the view up and down, and rotating around \`up\` turns it left and right:

\`\`\`c
if (key_state[SDL_SCANCODE_UP])   rotate_a(&facing, right,  0.01f);
if (key_state[SDL_SCANCODE_LEFT]) rotate_a(&facing, up,     0.01f);
\`\`\`

Where the \`rotate_a\` function rotates a 3D vector around any 3D axis by an angle of \`theta\`:

\`\`\`c
void rotate_a(vec3_t* vector, vec3_t axis, float theta) 
{
	float c = (float)cos(theta);
	float s = (float)sin(theta);

	vec3_t temp = {
		vector->x * (axis.x * axis.x * (1 - c) + c) +
		vector->y * (axis.x * axis.y * (1 - c) - axis.z * s) +
		vector->z * (axis.x * axis.z * (1 - c) + axis.y * s),

		vector->x * (axis.y * axis.x * (1 - c) + axis.z * s) +
		vector->y * (axis.y * axis.y * (1 - c) + c) +
		vector->z * (axis.y * axis.z * (1 - c) - axis.x * s),

		vector->x * (axis.z * axis.x * (1 - c) - axis.y * s) +
		vector->y * (axis.z * axis.y * (1 - c) + axis.x * s) +
		vector->z * (axis.z * axis.z * (1 - c) + c)
	};

	*vector = temp;
}
\`\`\`

## Putting it together

The main loop reads input, updates the camera, draws everything, and then waits so the program runs at roughly 60 frames per second:

\`\`\`c
while (true)
{
    uint32_t frame_start = SDL_GetTicks();

    if (!engine_event()) break;      // the window was closed

    camera_update(camera);           // keys change the position and view matrix
    engine_render(engine, camera);   // clear, project and draw every edge, present

    // add delay to stay at ~60fps
    uint32_t frame_time = SDL_GetTicks() - frame_start;
    if (frame_time < 16) SDL_Delay(16 - frame_time);
}
\`\`\`

## Source code
For a better understanding, you can check out the full implementation for this 3D renderer on my [Github](https://github.com/AliAhmad-M/3D-Renderer).
`,
};

export default post;