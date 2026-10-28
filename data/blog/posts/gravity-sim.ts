import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'gravity-sim',
  title: 'Gravity and Celestial Bodies in C with Raylib',
  tags: ['C', 'Raylib', 'Computer Graphics', 'Physics'],
  cover: '/blog/gravity-sim/cover.png',
  excerpt:
    'How I simulate gravity between celestial bodies in C and draw them with raylib.',
  markdown: `
This post covers simulating and drawing celetial bodies in C and Raylib. Note that here we take the gravitational constant G as 1 
for simplicity and none of the numbers have units.

## A body is a mass and two positions

Each body stores a mass, a radius and color for drawing, and two positions: current position and where it was one step ago. The  second 
position is how Verlet integration tracks velocity, so there is no velocity field. For more information on Verlet integration, go read my
blog on 2D and 3D [cloth physics](https://aliahmadm.vercel.app/blog/cloth-physics).

\`\`\`c
typedef struct {
	float mass;
	float radius;

	Vector3 currentPosition;
	Vector3 previousPosition;

	Color color;
} CelestialBody;
\`\`\`

## Vector helpers

The math on \`Vector3\` is a handful of helper functions that I wrote. All the functions except \`Vector3MagSq\` change their first
argument in place.

\`\`\`c
// add vector \`b\` to \`a\`
void Vector3Add(Vector3* a, Vector3 b) {
	a->x += b.x;
	a->y += b.y;
	a->z += b.z;
}

// subtract vector \`b\` from \`a\`
void Vector3Sub(Vector3* a, Vector3 b) {
	a->x -= b.x;
	a->y -= b.y;
	a->z -= b.z;
}

// multiply vector \`a\` with a value
void Vector3Mul(Vector3* a, float value) {
	a->x *= value;
	a->y *= value;
	a->z *= value;
}

// divide vector \`a\` by a value
void Vector3Div(Vector3* a, float value) {
	Vector3Mul(a, 1.0f / value);
}

// dot product of \`v\` with itself
float Vector3MagSq(Vector3 v)
{
	float value = (v.x * v.x) + (v.y * v.y) + (v.z * v.z);
}
\`\`\`


## Gravity between two bodies

Newton's law gives the pull between two masses as F = G * M * m / r², where r is the distance between them. Both bodies feel the 
same amount of force towards each other. The \`ResolveAll\` function visits every pair of bodies once, works out that force, and 
applies it to both:

\`\`\`c
#define G 1.0

void ResolveAll(CelestialBody* bodies, int count, float dt) {
	for (int i = 0; i < count; i++) {
		CelestialBody* bodyA = &bodies[i];

		for (int j = i + 1; j < count; j++) {
			CelestialBody* bodyB = &bodies[j];

			double M = bodyA->mass;
			double m = bodyB->mass;

			// Vector from body A to body B
			Vector3 ab = bodyB->currentPosition;
			Vector3Sub(&ab, bodyA->currentPosition);

			float r = sqrtf(Vector3MagSq(ab)) + FLT_EPSILON;

			// Strength and direction of the force
			float F = (float)(G * M * m / (r * r));
			Vector3 direction = ab;
			Vector3Div(&direction, r);

			Vector3 forceOnA = direction;
			Vector3Mul(&forceOnA, F);

			Vector3 forceOnB = direction;
			Vector3Mul(&forceOnB, -F);

			VerletIntegrate(bodyA, forceOnA, dt);
			VerletIntegrate(bodyB, forceOnB, dt);
		}
	}
}
\`\`\`

\`j\` starts at \`i + 1\` so a pair is never visited twice and a body is never paired with itself. \`FLT_EPSILON\` is added to 
\`r\` so two bodies at the same point do not divide by zero. The unit vector \`direction\` points from A to B, so the force on A
 uses it as is and the force on B flips the sign.

## Moving the bodies
This is the step function that moves the bodies using Verlet integration:

\`\`\`c
void Integrate(CelestialBody* body, Vector3 force, float dt) {
	Vector3 acceleration = force;
	Vector3Div(&acceleration, body->mass);

	// x(t+dt) = 2 * x(t) - x(t-dt) + a * dt^2
	Vector3 newPosition = body->currentPosition;
	Vector3Mul(&newPosition, 2.0f);
	Vector3Sub(&newPosition, body->previousPosition);

	Vector3 accelTerm = acceleration;
	Vector3Mul(&accelTerm, dt * dt);
	Vector3Add(&newPosition, accelTerm);

	body->previousPosition = body->currentPosition;
	body->currentPosition = newPosition;
}
\`\`\`

## Starting an orbit

When creating a scene with the Sun and the Earth, we need to create an orbit. In the case of Verlet, velocity is the gap between \`currentPosition\` 
and \`previousPosition\`. So, we move Earth's current position a little along the z axis to give it a sideways push.

\`\`\`c
int sunIndex = CreateBody(engine, 20.0f, 2.0f, (Vector3){ 0.0f, 0.0f, 0.0f }, YELLOW);
int earthIndex = CreateBody(engine, 0.35f, 0.5f, (Vector3){ 8.0f, 0.0f, 0.0f }, SKYBLUE);

engine->bodies[earthIndex].currentPosition.z += 0.025f;
\`\`\`

The Earth starts 8 units from the Sun, and the 0.025 offset is its velocity in units per step. A circular orbit at distance r 
needs a speed of sqrt(G * M / r), which here is sqrt(20 / 8), about 1.58 units per second. At 60 FPS that is roughly 0.026 per 
frame, so 0.025 is close to it but a little slow. The orbit comes out as a slight ellipse with the starting point as its farthest 
point. Everything starts at y = 0 and the force always points along the line between two bodies, so the orbit stays flat in the xz 
plane.

## Drawing it

When initializing, we open the window with \`InitWindow\`, set the fps with \`SetTargetFPS\`, and create a \`Camera3D\` at (0, 12, 24) 
looking at the origin with a 70 degree field of view. Each frame draws a sphere per body and then steps the physics. Here is a simplified 
version of the update loop:
\`\`\`c
while (!WindowShouldClose()) {
	BeginDrawing();
	ClearBackground(BLACK);
	BeginMode3D(engine->camera);

	for (int i = 0; i < engine->celestialBodyCount; i++) {
		CelestialBody* body = &engine->bodies[i];
		DrawSphere(body->currentPosition, body->radius, body->color);
	}

	ResolveAll(engine->bodies, engine->celestialBodyCount, GetFrameTime());

	EndMode3D();
	DrawFPS(12, 16);
	EndDrawing();
}
\`\`\`

## Source code
The full project is available on my [Github](https://github.com/AliAhmad-M/Celestial-Body-Simulation). You can view the code for a better
understanding.
`,
};

export default post;