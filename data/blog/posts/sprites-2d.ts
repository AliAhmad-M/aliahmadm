import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'sprites-2D',
  title: '2D Sprite Rendering and Animation in C++ and OpenGL',
  tags: ['C++', 'OpenGL'],
  cover: '/blog/sprites-2d/sprites-2d.png',
  excerpt:
    'A guide towards rendering 2D sprites and animating them in C++ using OpenGL.',
  markdown: `
This guide walks through drawing 2D sprites with OpenGL and C++, animating and finally sorting them. It covers the OpenGL setup, 
and the implementation for a sprite component and system.

There is no single correct way to build a sprite renderer. The approach used here is one I've arrived at through my own projects, 
and it has worked well for me. I'll point out the trade-offs along the way so you can adjust it to your own needs.

You should be comfortable with basic C++ and have an OpenGL 3.3 context already running (GLFW and glad, for example). Loading a 
texture from disk is its own topic, so the code here assumes you already have a texture loaded and a texture handle to work with.

## The core idea

A sprite is just an image drawn on a rectangle. A rectangle is two triangles, so the simplest renderer sends two triangles to the 
GPU per sprite. That works, but it means one draw call per sprite, and draw calls are expensive. A scene with a few thousand sprites 
will spend more time issuing calls than drawing.

The fix is batching. Instead of drawing each sprite immediately, the renderer collects the vertices of every sprite into one array on 
the CPU and sends the whole array to the GPU in a single draw call. Everything below is built around that.

## The vertex

Each sprite is a quad, and each quad is four vertices of this type:

\`\`\`cpp
struct Vertex
{
    Vector2 position;   // screen position in pixels
    Vector2 texCoord;   // where to sample the texture
    float r, g, b, a;   // tint
    float depth;        // used for sorting
};
\`\`\`

Position says where the top-left corner goes on screen. The texture coordinate says which point of the image that corner shows. 
The tint is multiplied with the texture color, which lets you fade or recolor a sprite without a new image. The depth value is 
what makes sorting work later on, so keep it in mind.

## Shaders

The vertex shader takes those four attributes and multiplies the position by a projection matrix. The depth goes into the Z 
component.

\`\`\`glsl
#version 330 core
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aTex;
layout(location = 2) in vec4 aColor;
layout(location = 3) in float aDepth;

uniform mat4 uProj;
out vec2 vTex;
out vec4 vColor;

void main() {
    gl_Position = uProj * vec4(aPos, aDepth, 1.0);
    vTex   = aTex;
    vColor = aColor;
}
\`\`\`

The fragment shader samples the texture and multiplies it by the tint:

\`\`\`glsl
#version 330 core
in vec2 vTex;
in vec4 vColor;
uniform sampler2D uTex;
out vec4 fColor;

void main() {
    vec4 texColor = texture(uTex, vTex);
    if (texColor.a < 0.5) discard;
    fColor = texColor * vColor;
}
\`\`\`

The \`discard\` line looks like a small detail, but depth sorting depends on it. The Z sorting section explains why.

## Buffers

Three objects hold the geometry: a VAO that remembers the attribute layout, a VBO for vertices, and an IBO for indices.

\`\`\`cpp
glGenVertexArrays(1, &m_vao);
glGenBuffers(1, &m_vbo);
glGenBuffers(1, &m_ibo);

glBindVertexArray(m_vao);
glBindBuffer(GL_ARRAY_BUFFER, m_vbo);
glBufferData(GL_ARRAY_BUFFER, MAX_QUADS * 4 * sizeof(Vertex), nullptr, GL_DYNAMIC_DRAW);

glEnableVertexAttribArray(0);
glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, position));
// locations 1, 2 and 3 are set up the same way for texCoord, color and depth
\`\`\`

The VBO is allocated once at full size with no data, and marked \`GL_DYNAMIC_DRAW\` because its contents change every frame. 
\`MAX_QUADS\` is the batch capacity. \`MAX_QUADS = 2000\` is a good starting point, and the renderer flushes early whenever 
the batch fills up, so it is a tuning knob and not a hard limit on sprites per frame.

The index buffer is different. Every quad needs the same two triangles, (0, 1, 2) and (2, 3, 0), offset by 4 for each quad. 
That pattern never changes, so you can fill it once at startup and upload it as \`GL_STATIC_DRAW\`:

\`\`\`cpp
for (uint32_t i = 0, v = 0; i < MAX_QUADS * 6; i += 6, v += 4) {
    indices[i + 0] = v + 0; indices[i + 1] = v + 1; indices[i + 2] = v + 2;
    indices[i + 3] = v + 2; indices[i + 4] = v + 3; indices[i + 5] = v + 0;
}
\`\`\`

With this in place, each frame only has to upload vertices as the indices are already on the GPU.

## State and projection

Three pieces of global state are needed:

\`\`\`cpp
glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
glEnable(GL_DEPTH_TEST);
glDepthFunc(GL_LEQUAL);
\`\`\`

Blending lets the alpha channel of the texture and tint take effect. The depth test is what the sorting sections rely on.

The projection is an orthographic matrix. It converts pixel coordinates into the range OpenGL expects, with no perspective. 
Setting the top to 0 and the bottom to the window height puts the origin at the top left with Y pointing down, which is how 
most 2D code expects coordinates to work:

\`\`\`cpp
int windowWidth = 1280;
int windowHeight = 720;
Matrix4x4 projection = Matrix4x4::CreateOrthographicOffCenter(
    0, windowWidth, windowHeight, 0, -100.0f, 100.0f
);
\`\`\`

The last two arguments are the near and far planes. They set the range of depth values a sprite can have. At the start of each 
frame, \`Begin()\` uploads this matrix to the \`uProj\` uniform, points \`uTex\` at texture unit 0, and clears the batch.

## Building the batch

A \`pushQuad\` function first checks whether the texture changed or the batch is full, and if so it flushes 
what it has.

\`\`\`cpp
    if (texture != m_currentTexture || m_vertexBatch.size() + 4 > MAX_QUADS * 4) {
        Flush();
        m_currentTexture = texture;
    }
\`\`\`

A batch can only use one texture at a time, since the shader samples a single bound texture. This is why sprite sheets are worth 
using. Sprites that share a sheet end up in the same batch, while sprites that each have their own image force a flush every time 
the texture changes.

After that, the function rotates the corners around the quad's center and pushes the vertices. Position is the top-left corner, 
and rotation is in degrees:

\`\`\`cpp
m_vertexBatch.push_back({ topLeft,     { tx,      ty      }, r, g, b, a, depth });
m_vertexBatch.push_back({ topRight,    { tx + tw, ty      }, r, g, b, a, depth });
m_vertexBatch.push_back({ bottomRight, { tx + tw, ty + th }, r, g, b, a, depth });
m_vertexBatch.push_back({ bottomLeft,  { tx,      ty + th }, r, g, b, a, depth });
\`\`\`

\`tx\`, \`ty\`, \`tw\` and \`th\` describe the rectangle of the texture to sample, in normalized 0 to 1 coordinates. A sprite 
sheet frame is just a small rectangle inside the texture.

\`Flush()\` binds the current texture, copies the batch into the VBO with \`glBufferSubData\`, and draws. Each quad contributes 
6 indices:

\`\`\`cpp
glBindTexture(GL_TEXTURE_2D, m_currentTexture);
glBufferSubData(GL_ARRAY_BUFFER, 0, m_vertexBatch.size() * sizeof(Vertex), m_vertexBatch.data());
glBindVertexArray(m_vao);
glDrawElements(GL_TRIANGLES, (m_vertexBatch.size() / 4) * 6, GL_UNSIGNED_INT, 0);
m_vertexBatch.clear();
\`\`\`

A frame then looks like this:

\`\`\`cpp
renderer.Begin(projection);
    spriteSystem->Update();   // pushes a quad per sprite
renderer.Flush();             // draws whatever is left in the batch
\`\`\`

## The sprite component

With the renderer in place, the next piece is the data that describes a sprite. In an ECS setup this is a Sprite2D component, 
for more information about ECS, see my [C++ ECS guide](https://aliahmadm.com/blog/ecs-in-cpp).

\`\`\`cpp
struct Sprite2D
{
    Texture* texture = nullptr;
    int hframes = 1;           // columns in the sprite sheet
    int vframes = 1;           // rows in the sprite sheet
    int frame = 0;
    int zIndex = 0;            // layer

    Rectangle src;             // which part of the texture to draw
    std::unordered_map<std::string, Sprite2DAnimationData> animations;

    bool fliph = false;
    bool flipv = false;

    bool  applyYSort = false;
    float ySortOrigin = 0.0f;
};
\`\`\`

A sprite sheet is one image holding a grid of frames. \`hframes\` and \`vframes\` say how many columns and rows there are, and 
the size of a single frame is the texture size divided by those. Frames are numbered left to right, top to bottom, starting at 0. 
A sheet with 4 columns and 2 rows looks like this:

\`\`\`
 0 | 1 | 2 | 3
 4 | 5 | 6 | 7
\`\`\`

An animation is a list of frame numbers and a speed in frames per second:

\`\`\`cpp
struct Sprite2DAnimationData
{
    std::vector<int> frames;
    int speed;
};
\`\`\`

Setting up a sprite then looks like this:

\`\`\`cpp
AddAnimation(sprite, "idle", {0, 1, 2, 3}, 6);
AddAnimation(sprite, "run",  {4, 5, 6, 7}, 12);
SetAnimation(sprite, "run"); // Set the current animation to play
\`\`\`

\`SetAnimation\` only stores the name of the current animation. Playing it is the system's job. The default animation is called 
\`"none"\`, and when it is active the system doesn't touch the source rectangle.

The ECS approach has a major benefit: the same sprite can be inspected in an editor, saved to a scene file, or driven by gameplay 
code, and none of that requires touching rendering code.

## The sprite system

The system is where the work happens. For each entity with a \`Sprite2D\` and a \`Transform2D\` component, it works out which part 
of the texture to show, how big to draw it, and what depth to give it. Then it calls \`DrawQuad\`.

**Note: The Transform2D component can be defined as:**

\`\`\`cpp
struct Transform2D
{
    Vector2 position;
    float rotation;
    Vector2 scale;
};
\`\`\`

The 2D sprite system works by:

1. Skipping sprites with no texture.
2. Advancing the animation and update the source rectangle.
3. Converting the source rectangle into texture coordinates.
4. Applying vertical and horizontal flips.
5. Computing the depth.
6. Submitting the quad.

### Animation

\`\`\`cpp
if (s->GetAnimation() != "none")
{
    auto& anim = s->animations[s->GetAnimation()];
    size_t index = (size_t)(glfwGetTime() * anim.speed) % anim.frames.size();
    int frame = anim.frames[index];

    s->src.SetCoords(
        (float)((frame % s->hframes) * frameW),
        (float)((frame / s->hframes) * frameH));
}
\`\`\`

There is no timer stored on the sprite. The system reads the global clock. The current frame to display can be 
calculated using:

\`int frame = (int)(glfwGetTime() * speed) % frames\`.

Where \`speed\` is in frames per second and \`frames\` is the total frames for that animation.

That frame number then has to become a position on the sheet. The column is \`frame % hframes\` and the row is \`frame / hframes\`, 
using integer division. On a sheet with 4 columns, frame 6 sits in column 2, row 1. Multiplying by the frame size gives the pixel 
position of the frame's top-left corner, and that goes into \`src\`.

\`\`\`cpp
src.SetCoords(
    (float)((frame % s->hframes) * frameW),
    (float)((frame / s->hframes) * frameH)
);
\`\`\`

OpenGL wants texture coordinates between 0 and 1, so the source rectangle gets divided by the texture size:

\`\`\`cpp
float u  = s->src.GetX() / texWidth;
float v  = s->src.GetY() / texHeight;
float uw = (float)frameW / texWidth;
float vh = (float)frameH / texHeight;
\`\`\`

Flipping uses the same values. To mirror a sprite horizontally, start at the right edge of the frame and give the width a negative sign, 
so the quad samples the frame backwards. The process is similar for vertical flipping:

\`\`\`cpp
if (s->fliph) { u += uw; uw = -uw; }
if (s->flipv) { v += vh; vh = -vh; }
\`\`\`

This approach is stateless and cheap, but it has a side effect. Every sprite playing the same animation is in sync and switching 
animations doesn't start from the first frame. To fix this, store a start time or an accumulated timer on the component and reset 
it when changing animation.

### Z sorting

The classic way to order 2D sprites is the painter's algorithm: sort them by layer, then draw back to front. The alternative is 
the depth buffer. Each sprite writes a depth value, and the GPU keeps the pixel that is closest, this is the approach that we 
will be using here.

**Note: For the painter's algorithm, use a sorting algorithm that works best on nearly sorted data, like insertion sort. This is
because the sprites remain sorted throughout most frames. Insertion sort has an O(n) best case for nearly sorted data, while other 
algorithms like quick sort or merge sort only have an O(nlogn) best case.**

The depth comes from \`zIndex\`:

\`\`\`cpp
float depth = (float)sprite->zIndex;
\`\`\`

The vertex shader puts it into Z, and the projection maps it into the depth range. With the near and far planes at -100 and 100, a higher depth 
is closer to the camera, so a sprite with \`zIndex\` 2 draws over one with \`zIndex\` 1.

Three settings make this work. \`GL_DEPTH_TEST\` is enabled, the depth function is \`GL_LEQUAL\`, and the system calls \`glClear(GL_DEPTH_BUFFER_BIT)\` 
at the start of every update so that the last frame's depth values don't leak into this one. **If two sprites are at the same depth, the one drawn last wins.**


Now for the \`discard\` in the fragment shader. The depth buffer does not know what is transparent. A quad's transparent corner 
would write depth just like a solid pixel and hide whatever is behind it. Discarding any fragment with alpha below 0.5 means 
those pixels write neither color nor depth. The cost is that semi-transparent pixels become either fully visible or fully gone. 
For pixel art that is fine. For soft shadows or glows it isn't, and those would need a separate pass.

There is a useful side effect. Since the GPU sorts by depth, the order sprites are submitted in doesn't matter. Texture batching 
never conflicts with sorting, and sprites on the same sheet can be grouped together freely. A painter's algorithm renderer has to 
give up one of the two.

### Y sorting

In a top-down game, a character standing below a tree should draw in front of it, and a character standing above the tree should draw 
behind it. That depends on the Y position.

When an \`applyYSort\` flag is set, a value based on Y gets added to the depth:

\`\`\`cpp
float depth = (float)sprite->zIndex;
if (sprite->applyYSort)
{
    float sortY = t->position.y + (worldH / 2.0f) + sprite->ySortOrigin;
    depth += sortY / MAX_Y_RANGE;
}
\`\`\`

\`MAX_Y_RANGE\` is a constant set to the largest Y value your world will reach. Dividing by it turns any Y into a 
number between 0 and 1. The fraction stays below 1, so it can never carry a sprite into the next layer. A sprite 
on layer 1 always draws over every sprite on layer 0 no matter where it stands, and Y only decides order among sprites 
on the same layer. 
For example:

- zIndex 1 at Y 500 gets depth 1.0050
- zIndex 1 at Y 520 gets depth 1.0052, so it draws on top
- zIndex 2 at Y 0 gets depth 2.0, so it draws over both

\`position.y\` is the top of the sprite, so the code adds half the height to get the vertical center. That is the default sort line. 
For a character you usually want the feet, since that is where it touches the ground. Setting \`ySortOrigin\` to half the sprite's 
height moves the sort line to the bottom edge. A tall tree would use a similar offset so characters pass behind its trunk and not 
behind its center.

There are two limits to know about. Y values below 0 or above \`MAX_Y_RANGE\` spill into neighboring layers, so the constant should 
match the size of your world. And the depth buffer has finite precision. With a 24-bit buffer spread over 200 units, the smallest 
step is about 0.000012, while one pixel of Y moves depth by 0.00001. Two sprites whose sort lines are within a pixel of each other 
can flicker. Keeping \`MAX_Y_RANGE\` close to the real world size gives each pixel more room.

## Source Code
If you want to see the full implementation for sprite rendering, check out the Nova Engine on [Github](https://github.com/AliAhmad-M/NovaEngine).
You can find all related code in the \`Graphics/\` folder.
`,
};

export default post;