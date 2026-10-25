import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'ecs-in-cpp',
  title: 'Implementing Entity Component System (ECS) from Scratch in C++',
  tags: ['C++', 'ECS', 'Gamedev'],
  cover: '/blog/ecs-in-cpp/ecs-in-cpp.png',
  excerpt:
    'A guide and analysis towards implementing an Entity Component System (ECS) from scratch in C++.',
  markdown: `

Game engines often start with a base class such as \`Actor\` or \`Node\` that everything inherits from. 
As the project grows, the hierarchy becomes complex and difficult to manage. An Entity Component System (ECS) 
avoids this by mapping entities as integer IDs to structures known as components, and then iterating over contiguous 
component memory in systems.

## 1. What is an entity

An entity is just an identifier. In our example, we declare a type \`EntityID\` as a \`uint32_t\` 
(unsigned 32 bit integer). It has no data and no methods. Its only purpose is to act as a key for components. 
You can think of it like a primary key in a database table.

\`\`\`cpp
using EntityID = uint32_t;
\`\`\`

When you create an entity, it's ID cannot be assigned to any other entity. To handle this, we use a queue that stores all 
available entiy IDs. When an entity is created, we pop an ID from the queue and assign it to the entity.

\`\`\`cpp
EntityID CreateEntity() 
{
    // Get the next available entity ID from the queue
    // Pop the ID from the queue so it can't be reused
    EntityID entity = m_availableEntities.front();
    m_availableEntities.pop_front();
    return entity;

}
\`\`\`


Similarly, when an entity is destroyed, we push its ID back into the queue so it can be reused by other entities.

\`\`\`cpp
void DeleteEntity(EntityID e) 
{
    // Push the ID back so it can be reused
    m_availableEntities.push_back(e);
}
\`\`\`

## 2. What is a component

A component is a data structure that can be mapped to entities. Here is an example of the \`Transform2D\` component
that holds the 2D position, rotation, and scale of an entity:

\`\`\`cpp
struct Transform2D
{
    Vector2 position;
    float rotation;
    Vector2 scale;
};
\`\`\`

Because components are plain data, the engine can pack them tightly in memory. A system iterating over \`Transform2D\` 
components reads them sequentially, which is cache-friendly and fast. This contiguous memory layout is implemented using 
a data structure known as a sparse set and is one of the main performance benefits of ECS.

## 3. Entity to component mapping

If an entity is an ID and a component is data, the engine needs a way to map one to the other. It needs to answer the question: 
"What components belong to Entity 42?". This is handled by a sparse set. A sparse set uses multiple arrays working together to 
provide constant time access while keeping the actual components tightly packed in memory. 

*   **Sparse Array:** A large array indexed by the Entity ID. It stores where that entity's component lives in the dense array.
*   **Dense Array:** A packed array containing the actual component data. There are no gaps.
*   **Dense to Entity Array:** A parallel array to the dense array, storing which Entity ID owns the component at that dense array index.

We require a separate sparse set for every type of component. That way, all components of the same type are stored together in 
memory, and systems can iterate over them efficiently.

**Note: All sparse set component operations (add, remove, lookup) have O(1) time complexity.**

### Sparse set insertion

To add a component, we push it to the end of the dense array. We then record its new index in the sparse array at the entity's ID.

\`\`\`cpp
void AddComponent(EntityID e, T component) 
{
    // Add component to the packed dense array
    uint32_t newIndex = m_dense.size();
    m_dense.push_back(component);
    m_denseToEntity.push_back(e);
    
    // Record where it lives in the sparse array
    m_sparse[e] = newIndex;
}
\`\`\`

### Sparse set deletion

To keep the dense array packed, we use a swap-and-pop strategy. If we want to remove Entity 42, we look at the sparse array to find its index. We take the very last component in the dense array and move it into Entity 42's slot. Then we shrink the array by one.

\`\`\`cpp
void RemoveComponent(EntityID e) 
{
    uint32_t indexToRemove = m_sparse[e];
    uint32_t lastIndex = m_dense.size() - 1;
    EntityID lastEntity = m_denseToEntity[lastIndex];
    
    // Move the last element into the removed slot
    m_dense[indexToRemove] = m_dense[lastIndex];
    m_denseToEntity[indexToRemove] = lastEntity;
    
    // Update the sparse array so the moved entity knows its new home
    m_sparse[lastEntity] = indexToRemove;
    
    // Mark the removed entity as having no component
    m_sparse[e] = INVALID_ENTITY;
    
    // Remove the duplicate at the end
    m_dense.pop_back();
    m_denseToEntity.pop_back();
}
\`\`\`

### Sparse set lookup

Lookup is a two-step process. We check the sparse array for the entity's ID to get the dense index, then return a pointer to the data.

\`\`\`cpp
T* GetComponent(EntityID e)
{
    uint32_t index = m_sparse[e];
    if (index == INVALID_ENTITY) {
        return nullptr;
    }
    return &m_dense[index];
}
\`\`\`

## 4. Role of paginated sparse sets

A standard sparse array allocates memory for every possible entity ID. If the engine supports millions of entities but only a 
few thousand are active, most of that memory is wasted. A paginated sparse set solves this by splitting the sparse array into 
fixed-size pages. Instead of one massive array, it is an array of smaller arrays. We only allocate a page when an entity ID actually 
falls into that range.

\`\`\`cpp
uint32_t page = entityID / MAX_PAGE_SIZE;
uint32_t pageOffset = entityID % MAX_PAGE_SIZE;

// Only allocate memory for this page if it doesn't exist yet
if (page >= m_sparsePages.size()) {
    m_sparsePages.resize(page + 1);
    m_sparsePages[page].resize(MAX_PAGE_SIZE, INVALID_ENTITY);
}

m_sparsePages[page][pageOffset] = denseIndex;
\`\`\`

This adds a tiny bit of math to find the right page, but the memory savings are significant. The dense component data remains contiguous, while the sparse index mapping only takes up memory for the highest active entity ID.

## 5. What is a system

A system contains the logic. It iterates over entities that have a specific set of components and updates them. Here is an example
of how the \`ScriptSystem\` handles this:

\`\`\`cpp
void ScriptSystem::Update(float dt) {
    for (EntityID entity : entities) {
        BehaviorScript* bs = m_ecsRef->GetComponent<BehaviorScript>(entity);

        if (!bs->started) {
            bs->instance->OnStart();
            bs->started = true;
        }
        
        bs->instance->OnUpdate(dt);
    }
}
\`\`\`

The system iterates over all entities with the \`BehaviorScript\` component and calls the \`OnUpdate\` method on each script instance. 
We need to ensure that the system doesn't waste time processing entities that do not have this component, therefore we assign signatures 
to our entities and systems.

## 6. Passing entities to systems

Systems need to know which entities to process. This is managed using signatures. Every entity has a signature, which is a bitset where each 
bit represents a component type. A system has a signature representing its required components.

\`\`\`cpp
using Signature = std::bitset<MAX_COMPONENTS>;
\`\`\`

When an entity's signature changes, we compare it against the signatures of all registered systems using a bitwise AND.

\`\`\`cpp
// If the result equals the system's signature, 
// the entity has all the required components.
if ((entitySignature & systemSignature) == systemSignature) {
    // Entity belongs in this system.
} else {
    // Entity doesn't belong in here.
}
\`\`\`

When components are added or removed, we updates the entity's signature and perform this check. This lets us automatically adjust 
which systems process the entity without manual registration or scanning every frame.

## Source Code
If you want to see the full implementation of this ECS, check out the Nova Engine on [Github](https://github.com/AliAhmad-M/NovaEngine).
You can find all ECS related code in the \`Core/include/Core/ECS\` and \`Core/src/ECS\` folders.
`,
};

export default post;