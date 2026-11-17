import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'collision-2d',
  title: '2D Physics Engine Using Collision Detection & Resolution',
  tags: ['C#', 'Raylib', 'Gamedev', 'Physics'],
  cover: '/blog/collision-2d/cover.png',
  excerpt:
    'An explanation on the Separating Axis Theorem (SAT) for 2D collision detection and on how to resolve collisions.',
  markdown: `
This post covers how my 2D physics engine detects and resolves collisions between boxes and circles. Detection uses the Separating 
Axis Theorem (SAT) and resolution uses impulses, with rotation and friction. The code is C# and Raylib is only used for drawing, but 
the math is the same in any language. Rotation is stored in degrees, which matters in a couple of places below.

A physics engine does the same few things over and over. It moves bodies according to their velocity, finds out which bodies 
overlap, and then changes velocities and positions so they stop overlapping in a believable way. I will go through the pieces 
from the bottom up: what a body is, how overlap is detected, how it is resolved, and at the end how the broad phase, the narrow 
phase and the frame loop connect all of it.

## Bodies

There are a few kinds of bodies in the engine, and all of them inherit from \`PhysicsBody2D\`. The two that matter for this post are 
\`RigidBody2D\`, which can move and react to collisions, and \`StaticBody2D\`, which never moves. Each body has a transform, a collision 
shape, a linear velocity, a rotational velocity, a moment of inertia and a material.

\`\`\`csharp
public Vector2 LinVelocity;
public float RotVelocity;
public float MomentOfInertia { get; protected set; }

public Material2D Material { get; protected set; }
public CollisionShape2D CollisionShape { get; protected set; }
\`\`\`

The material holds the mass, the density, the restitution (bounciness) and the static and dynamic friction coefficients. Mass is the 
shape's area times its density, scaled down by 1000. The moment of inertia is how hard it is to make a body spin, the rotational 
equivalent of mass, and it comes from the standard formulas for a rectangle and a disc:

\`\`\`csharp
// Box
MomentOfInertia = (1f / 12) * mass * (width * width + height * height);

// Circle
MomentOfInertia = (1f / 2) * mass * (radius * radius);
\`\`\`

A static body gets a mass and a moment of inertia of positive infinity. That sounds odd but it saves a lot of special cases later, 
because 1 divided by infinity is 0 in floating point arithmetic, therefore the static body's terms simply vanish from the resolution formulas.

## Moving bodies

Rigid bodies run a list of components each step. The two defaults are \`Gravity\` and \`Motion\`. Gravity sets the force on the body to 
\`G * mass\`, and \`Motion\` turns that force into movement:

\`\`\`csharp
Vector2 acceleration = body.Force / body.Material.Mass;

body.LinVelocity += acceleration * (float)delta;

// Set linear velocity to zero if its magnitude is less than the threshold
if (body.LinVelocity.Length() <= (float)delta)
	body.LinVelocity = Vector2.Zero;

body.Translate(body.LinVelocity);
body.Rotate(body.RotVelocity);

body.Force = Vector2.Zero;
\`\`\`

The force is divided by mass to get acceleration, acceleration is added to velocity, and velocity is added to position. This is explicit Euler 
integration, the simplest option.

## Shapes and transformed vertices

A box stores four vertices relative to its own center, and a circle only needs a radius.

\`\`\`csharp
Vertices = new Vector2[]
{
	new Vector2(-width / 2f, height / 2f),   // Top-left
	new Vector2(width / 2f, height / 2f),    // Top-right
	new Vector2(width / 2f, -height / 2f),   // Bottom-right
	new Vector2(-width / 2f, -height / 2f)   // Bottom-left
};
\`\`\`

All of the collision tests need these vertices in world space, so they are rotated and then translated by the body's transform:

\`\`\`csharp
Matrix3x2 transformationMatrix = Matrix3x2.CreateRotation(rotation) *
                                 Matrix3x2.CreateTranslation(position);

for (int i = 0; i < Vertices.Length; i++)
	TransformedVertices[i] = Vector2.Transform(Vertices[i], transformationMatrix);

VerticesUpdateRequired = false;
\`\`\`

\`CreateRotation\` expects radians, so the rotation goes through \`MathExtra.Deg2Rad\` first. Doing this for every body on every 
collision test would be wasteful, so the result is cached. \`Translate\` and \`Rotate\` on the shape set \`VerticesUpdateRequired\` 
and \`AABBUpdateRequired\` back to true, and \`GetTransformedVertices\` returns the cached array when the flag is false. A body that did 
not move since the last call costs nothing.

## Bounding boxes

Every shape also has an axis aligned bounding box (AABB), the smallest upright rectangle that contains it. For a circle it is the center 
plus and minus the radius. For a box it is the minimum and maximum of the transformed vertices:

\`\`\`csharp
foreach (Vector2 vertex in vertices)
{
	minX = Math.Min(minX, vertex.X);
	minY = Math.Min(minY, vertex.Y);
	maxX = Math.Max(maxX, vertex.X);
	maxY = Math.Max(maxY, vertex.Y);
}

AABB = new AxisAlignedBoundingBox(minX, minY, maxX, maxY);
\`\`\`

Two AABBs overlap only if they overlap on both axes, which is four comparisons:

\`\`\`csharp
return !(boxA.Max.X <= boxB.Min.X || boxA.Min.X >= boxB.Max.X ||
         boxA.Max.Y <= boxB.Min.Y || boxA.Min.Y >= boxB.Max.Y);
\`\`\`

This test is cheap but not exact. A rotated box has an AABB bigger than itself, so two boxes can have overlapping AABBs without 
touching. It is a quick way to throw out most pairs, and the exact test only has to run on the pairs that pass. The AABB is cached 
with a dirty flag in the same way as the vertices.

## The Separating Axis Theorem

SAT says that two convex shapes do not overlap if there is a line on which their projections do not overlap. That line is 
the separating axis. The projection on an axis is calculated by taking the dot product of every vertex with the axis direction.

\`\`\`csharp
internal static void ProjectVertices(Vector2[] vertices, Vector2 axis, out float min, out float max)
{
	min = float.PositiveInfinity;
	max = float.NegativeInfinity;

	foreach (Vector2 vertex in vertices)
	{
		float projection = Vector2.Dot(vertex, axis);

		if (projection < min) { min = projection; }
		if (projection > max) { max = projection; }
	}
}
\`\`\`

The axis has to be a unit vector, otherwise the intervals are scaled and the depth comes out wrong. There are infinitely many 
possible axes, but for polygons only the ones perpendicular to each edge need to be tried. If the shapes are separated, one of those 
axes shows it. If none of them does, the shapes overlap. The theorem only holds for convex shapes, which is fine here since boxes and 
circles are convex.

To get the axis for an edge, take the edge vector, rotate it by 90 degrees and normalize it. Then both shapes are projected onto it:

\`\`\`csharp
Vector2 edge = vertexB - vertexA;
Vector2 axis = new Vector2(-edge.Y, edge.X);
axis = Vector2.Normalize(axis);

CollisionHelper.ProjectVertices(verticesA, axis, out float minA, out float maxA);
CollisionHelper.ProjectVertices(verticesB, axis, out float minB, out float maxB);

// A gap on this axis means no collision
if (minA >= maxB || minB >= maxA)
	return false;

float axisDepth = MathF.Min(maxB - minA, maxA - minB);

if (axisDepth < depth)
{
	depth = axisDepth;
	normal = axis;
}
\`\`\`

As an example, take two boxes with edges parallel to the x and y axes. On the x axis, box A covers 0 to 4 and box B covers 3 to 6. 
The intervals overlap, so this axis does not separate them. The overlap is the smaller of \`maxB - minA\`, which is 6, and \`maxA - minB\`, 
which is 1, so the depth on this axis is 1. Suppose the y axis gives an overlap of 3. The x axis has the smaller overlap, so the 
normal is the x axis and the depth is 1: moving one of the boxes by 1 unit along x is the shortest way to separate them.

This loop runs for the edges of A and then again for the edges of B. If a gap shows up on any axis the function returns false right 
away, which is the fast path for shapes that are far apart. If the loop finishes, the shapes collide, and the axis with the smallest 
overlap is the collision normal. The comparison uses \`>=\`, so two shapes that only touch at an edge count as not colliding.

The normal could point either way, so at the end I compare it with the vector from A's center to B's center and flip it if they 
disagree. After that the normal always points from A to B, and the resolution code relies on that.

\`\`\`csharp
Vector2 direction = centerB - centerA;
normal = Vector2.Dot(direction, normal) < 0f ? -normal : normal;
\`\`\`

A box has four edges but only two distinct axes, because opposite edges give the same line. My code tests all four, so half of the 
projections are repeated. Skipping the duplicates would be an easy improvement.

## Circles

A circle has no edges, so there are no edge normals to try for it. To check for collisions with a circle against a polygon, I still 
use the polygon's edge normals, and project the circle by taking the two points where a line through its center along the axis meets 
the circle.

The edge normals alone are not enough, though. If the circle sits diagonally off a corner of a box, it can be separated from the box 
by a line that is not perpendicular to any edge, and the edge axes would report a collision that is not there. So, there is one more 
axis to test: the direction from the circle's center to the closest vertex of the polygon.

\`\`\`csharp
Vector2 closestVertex = vertices[CollisionHelper.FindClosestPolygonVertex(centerC, vertices)];
axis = closestVertex - centerC;
axis = Vector2.Normalize(axis);
\`\`\`

The projection and depth check after that are the same as before. Two circles need no axes at all. They collide when the distance 
between the centers is smaller than the sum of the radii, and the penetration depth is the difference.

\`\`\`csharp
float distance = Vector2.Distance(centerA, centerB);
float totalRadii = radiusA + radiusB;

normal = Vector2.Normalize(centerB - centerA);
depth = totalRadii - distance;

return distance < totalRadii;
\`\`\`

## Contact points

SAT gives a normal and a depth but not the place where the bodies touch. For rotation to work the impulse has to be applied at a 
point, so the engine finds up to two contact points.

The building block is the closest point on a line segment to a given point. Project the point onto the segment and clamp the result 
to the segment's ends:

\`\`\`csharp
Vector2 ab = b - a;
Vector2 ap = p - a;

float d = Vector2.Dot(ab, ap) / Vector2.DistanceSquared(ab, Vector2.Zero);

if (d <= 0f)      contact = a;
else if (d >= 1f) contact = b;
else              contact = a + ab * d;

distanceSquared = Vector2.DistanceSquared(p, contact);
\`\`\`

For two polygons, every vertex of A is checked against every edge of B, and then every vertex of B against every edge of A. The 
closest pair found is the first contact point. If another pair is equally close, within a small tolerance, and is not the same 
point, it becomes the second contact:

\`\`\`csharp
if (distanceSquared < minDistanceSquared)
{
	minDistanceSquared = distanceSquared;
	cpoint1 = cp;
	ccount = 1;
}
else if (MathF.Abs(distanceSquared - minDistanceSquared) < 0.0005f &&
	!(Vector2.DistanceSquared(cp, cpoint1) < 0.0005f * 0.0005f))
{
	cpoint2 = cp;
	ccount = 2;
}
\`\`\`

Two boxes lying flat on each other end up with two contacts, and a box landing on its corner ends up with one. For a circle and a 
polygon the contact is the point on the polygon's edges closest to the circle's center. For two circles it is the point on A's 
surface that faces B.

Everything the resolution needs is packed into a \`CollisionManifold\`: the two bodies, the normal, the depth, the contact points and 
the number of contacts.

## Resolving the collision with impulses

Now the bodies have to bounce off each other. An impulse is an instant change in momentum, so applying an impulse along the normal 
changes the velocities of both bodies at once. Let vRel be the velocity of B relative to A and n the normal, which points from A to B. 
If the bodies are approaching, the part of vRel along the normal is negative. After the collision the bodies separate with a speed 
equal to e times the approach speed, where e is the restitution. Writing this down for an impulse of size j gives:

\`\`\`text
A velocity after: vA - j * n / mA
B velocity after: vB + j * n / mB

dot(vRel after, n) = -e * dot(vRel before, n)

j = -(1 + e) * dot(vRel, n) / (1/mA + 1/mB)
\`\`\`

This is used for basic collision resolution. The restitution of a pair is the smaller of the two values, so a bouncy ball landing on dead ground does not bounce.

\`\`\`csharp
float restitution = MathF.Min(bodyA.Material.Restitution, bodyB.Material.Restitution);

float j = -(1f + restitution) * Vector2.Dot(relativeVelocity, normal);
j /= (1f / bodyA.Material.Mass + 1f / bodyB.Material.Mass);

Vector2 impulse = j * normal;

bodyA.LinVelocity -= impulse / bodyA.Material.Mass;
bodyB.LinVelocity += impulse / bodyB.Material.Mass;
\`\`\`

Once bodies can spin, two things change. First, the velocity of the contact point is no longer the body's linear velocity. If r 
is the vector from the body's center to the contact point, the point moves with the linear velocity plus the angular velocity times 
the perpendicular of r. Second, an impulse applied away from the center also changes the angular velocity, by cross(r, impulse) 
divided by the moment of inertia, and that change shows up in the contact point's velocity as well. Working that through adds one 
term per body to the denominator:

\`\`\`text
j = -(1 + e) * dot(vRel, n) / (1/mA + 1/mB + cross(rA, n)^2 / IA + cross(rB, n)^2 / IB)
\`\`\`

In the code, the velocity at the contact point is built from the perpendicular of r. Dotting that perpendicular with the normal gives 
the same number as \`cross(r, n)\` in 2D, so the denominator can use it directly:

\`\`\`csharp
Vector2 rA = contactList[i] - bodyA.Transform.Translation;
Vector2 rB = contactList[i] - bodyB.Transform.Translation;

normalRA = new Vector2(-rA.Y, rA.X);
normalRB = new Vector2(-rB.Y, rB.X);

Vector2 rotLinVelA = normalRA * MathExtra.Deg2Rad(bodyA.RotVelocity);
Vector2 rotLinVelB = normalRB * MathExtra.Deg2Rad(bodyB.RotVelocity);

return (bodyB.LinVelocity + rotLinVelB) - (bodyA.LinVelocity + rotLinVelA);
\`\`\`

\`\`\`csharp
float denom = 1f / bodyA.Material.Mass + 1f / bodyB.Material.Mass +
	(normalRADotN * normalRADotN) / bodyA.MomentOfInertia +
	(normalRBDotN * normalRBDotN) / bodyB.MomentOfInertia;

float j = -(1f + restitution) * Vector2.Dot(relativeVelocity, normal);
j /= denom;
j /= contactCount;
\`\`\`

A few details are worth pointing out here. If the relative velocity at a contact already points apart (\`dot(vRel, n) > 0\`), that 
contact is skipped, since pushing again would make the bodies stick. With two contact points each one gets half of the impulse, so 
the total stays close to what a single contact would give. All impulses are calculated first, from the velocities before any of them 
is applied, and then applied together. Static bodies need nothing special: their infinite mass and moment of inertia make their 
terms zero, and an impulse divided by an infinite mass changes nothing.

Applying an impulse changes both the linear and the rotational velocity of each body. The last factor converts radians per second 
to degrees per second, since that is how the engine stores rotation speed:

\`\`\`csharp
bodyA.LinVelocity -= impulse / bodyA.Material.Mass;
bodyA.RotVelocity -= MathExtra.Cross(ra, impulse) / bodyA.MomentOfInertia * (180f / MathF.PI);

bodyB.LinVelocity += impulse / bodyB.Material.Mass;
bodyB.RotVelocity += MathExtra.Cross(rb, impulse) / bodyB.MomentOfInertia * (180f / MathF.PI);
\`\`\`

## Friction

Without friction a box sliding on the floor would never slow down. Friction is an impulse along the tangent, the direction of the 
relative velocity with its normal part removed:

\`\`\`csharp
Vector2 tangent = relativeVelocity - Vector2.Dot(relativeVelocity, normal) * normal;
tangent = Vector2.Normalize(tangent);
\`\`\`

If the tangential speed is almost zero the contact is skipped, because normalizing a tiny vector gives a noisy direction. The 
friction impulse needed to stop the sliding completely, called jt, is computed the same way as j, with the tangent in place of the 
normal:

\`\`\`csharp
float denom = 1f / bodyA.Material.Mass + 1f / bodyB.Material.Mass +
	(normalRADotT * normalRADotT) * 1f / bodyA.MomentOfInertia +
	(normalRBDotT * normalRBDotT) * 1f / bodyB.MomentOfInertia;

float jt = -Vector2.Dot(relativeVelocity, tangent);
jt /= denom;
jt /= contactCount;
\`\`\`

How much friction can actually supply is limited by Coulomb's law: the friction impulse cannot be larger than the normal impulse j 
times a friction coefficient. There are two coefficients. If jt is small enough, static friction holds and the surfaces stop sliding 
against each other, so the full jt is applied. If it is larger, the surfaces slide and dynamic friction applies, which is weaker and 
equal to j times the dynamic coefficient, pointing against the sliding.

\`\`\`csharp
if (MathF.Abs(jt) <= j * (bodyA.Material.StaticFriction + bodyB.Material.StaticFriction) / 2)
	frictionImpulse = jt * tangent;
else
	frictionImpulse = -j * tangent * (bodyA.Material.DynamicFriction + bodyB.Material.DynamicFriction) / 2;
\`\`\`

The coefficients of the two bodies are averaged. The current values are 0.5 for static and 0.3 for dynamic, the same for every 
material for now.

## Pushing the bodies apart

Impulses fix the velocities, but the bodies still overlap by the penetration depth. If nothing moved them, objects would slowly sink 
into each other. The last step moves them apart along the normal by the depth:

\`\`\`csharp
if (bodyA is StaticBody2D)
	bodyB.Translate(direction);
else if (bodyB is StaticBody2D)
	bodyA.Translate(-direction);
else
{
	bodyA.Translate(-direction / 2f);
	bodyB.Translate(direction / 2f);
}
\`\`\`

Here \`direction\` is \`normal * depth\`. A static body never moves, so the other body takes the whole correction. Otherwise each body 
takes half. This moves the position directly and does not touch the velocity, so it does not add any energy. Bodies outside the 
camera bounds, bodies with \`HandleCollision\` turned off and projectiles are not separated.

## Broad phase: sweep and prune

Running SAT on every pair of bodies costs far too much once there are more than a handful of them. The broad phase uses the AABBs to 
find the pairs worth testing, with a method called sweep and prune, also known as sort and sweep. It is done on the x axis only.

The bodies are sorted by the left edge of their AABB. I use an insertion sort for this:

\`\`\`csharp
for (int i = 1; i < bodies.Count; i++)
{
	var k = bodies[i];
	float kX = k.CollisionShape.GetAABB().Min.X;

	int j = i - 1;

	while (j >= 0 && bodies[j].CollisionShape.GetAABB().Min.X > kX)
	{
		bodies[j + 1] = bodies[j];
		j--;
	}

	bodies[j + 1] = k;
}
\`\`\`

Insertion sort is slow on random data, but bodies barely change their order between two substeps, so the list is nearly sorted every 
time and the sort runs in close to linear time. This is also why the cached AABBs matter, since the sort reads them constantly.

Then comes the sweep. For each body A, the bodies after it in the list are checked in order. Because the list is sorted by left edge, 
once a body B starts to the right of A's right edge, every body after B does too, so the inner loop can stop:

\`\`\`csharp
for (int i = 0; i < bodies.Count; i++)
{
	PhysicsBody2D bodyA = bodies[i];

	for (int j = i + 1; j < bodies.Count; j++)
	{
		PhysicsBody2D bodyB = bodies[j];

		if (bodyB.CollisionShape.GetAABB().Min.X > bodyA.CollisionShape.GetAABB().Max.X)
			break;

		if (CollisionDetection.AABBIntersection(bodyA.CollisionShape.GetAABB(), bodyB.CollisionShape.GetAABB()))
			contactPairs.Add((i, j));
		else
		{
			bodyA.ResetCollisionState();
			bodyB.ResetCollisionState();
		}
	}
}
\`\`\`

The pairs that pass the full AABB test are stored in a \`HashSet\` as index pairs. The indices refer to the sorted list, and the narrow 
phase runs right after without sorting again, so they stay valid. A pair that is close in x but whose AABBs do not overlap has its 
collision state cleared, which is how \`IsColliding\` and the floor and wall flags go back to false. There is a check at the top of 
the inner loop that skips any body whose AABB is outside the camera bounds, so nothing off screen is tested. The worst case for 
this method is a scene where all the bodies sit at similar x positions, since the inner loop then rarely breaks early and the cost goes back 
to testing every pair.

## Narrow phase

The narrow phase takes each stored pair and runs the exact test. To test collisions, we try the three shape combinations one after 
another, and each of them returns false right away if the pair is not its combination: circle against polygon, polygon against polygon, 
and circle against circle. If one of them reports a collision, the rest of the work follows:

\`\`\`csharp
if (CollisionDetection.CheckCollision(bodyA.CollisionShape, bodyB.CollisionShape, out normal, out depth))
{
	CollisionHelper.FindContactPoints(bodyA.CollisionShape, bodyB.CollisionShape,
		out Vector2 contactP1, out Vector2 contactP2, out int contactCount);

	CollisionManifold contact = new CollisionManifold(bodyA, bodyB, normal, depth, contactP1, contactP2, contactCount);

	if (bodyA is CharacterBody2D || bodyB is CharacterBody2D)
		CollisionResolution.ResolveCollisionBasic(bodyA, bodyB, normal, depth);

	bodyA.IsColliding = true;
	bodyB.IsColliding = true;

	if (bodyA.HandleCollision && bodyB.HandleCollision)
		CollisionResolution.ResolveCollisionAdvanced(in contact);

	SeparateBodies(bodyA, bodyB, normal * depth, bounds);
	UpdateCollisionState(bodyA, bodyB, normal);
}
\`\`\`

At the end the collision state is set from the normal, so character code can ask whether the body is standing on something. In Raylib 
the y axis points down, so a normal with a positive y component means that B is below A:

\`\`\`csharp
bodyA.IsOnCeiling = normal.Y < -0.5f;
bodyA.IsOnFloor = normal.Y > 0.5f;

bodyB.IsOnCeiling = bodyA.IsOnFloor;
bodyB.IsOnFloor = bodyA.IsOnCeiling;

bodyA.IsOnWallL = normal.X < -0.5f;
bodyA.IsOnWallR = normal.X > 0.5f;

bodyB.IsOnWallL = bodyA.IsOnWallR;
bodyB.IsOnWallR = bodyA.IsOnWallL;
\`\`\`

The 0.5 threshold means a surface counts as a floor when its normal is within 60 degrees of straight up, so slopes work as floors 
and steep ones count as walls.

## What happens in a frame

The phsyics update runs 16 substeps each frame. Each substep has two parts. The first handles collisions and the second handles the
rest of the updates.
\`\`\`csharp
for (int it = 0; it < 16; it++)
{
	HandleCollisions(bodies, bounds);
	UpdateBodies(bodies, delta, bounds);
}
\`\`\`

## Source code
The full engine is available on my [Github](https://github.com/AliAhmad-M/Raylib-Physics-Engine). You can view the code for a better
understanding.
`,
};

export default post;