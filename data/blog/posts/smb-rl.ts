import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'smb-rl',
  title: 'Optimizing Reinforcement Learning in Super Mario Bros Via Semantic Encoding',
  tags: ['Python', 'PyTorch', 'Reinforcement Learning'],
  cover: '/blog/smb-rl/cover.png',
  excerpt:
    'How a Double DQN agent learns Super Mario Bros from a simplified 12x12 grid representation of the screen.',
  markdown: `
This post covers how I trained a Double DQN agent to play Super Mario Bros, with most of the attention on the observation pipeline. The agent never sees the game's pixels. The environment reads the NES memory and redraws each frame as a small grid where every cell holds one of five values. The sections follow the order the data takes: the environment, the wrappers, the network, the agent, and then the training and evaluation scripts.

## The pipeline

An episode starts with a Super Mario Bros environment from \`gym_super_mario_bros\`. Every frame it produces passes through a chain of wrappers, and the chain ends with a \`(4, 12, 12)\` array. That array goes into a small CNN, which outputs one Q value per action. The agent picks an action, stores the transition in a replay buffer, and periodically samples a batch from the buffer to update the network.

The training script repeats this for thousands of episodes and saves checkpoints. The evaluation script loads a checkpoint, plays with almost no exploration, and counts how often Mario reaches the flag.

## Creating the environment

\`\`\`python
env = gym_super_mario_bros.make(
    f"SuperMarioBros-{world}-{stage}-v0",
    render_mode="rgb_array",
    apply_api_compatibility=True
)
env = JoypadSpace(env, [["right", "B"], ["right", "A", "B"]])
\`\`\`

\`world\` and \`stage\` pick the level. \`apply_api_compatibility\` makes \`step\` return the newer five-value tuple of \`(obs, reward, terminated, truncated, info)\`.

\`JoypadSpace\` reduces the controller to two actions: run right, and run right while jumping. Mario can't walk left or stand still in this setup. In a level that is mostly left to right, those actions rarely help, and removing them means a random action early in training is far more likely to move Mario forward.

## Wrappers

Wrappers are applied in order, and each one receives the output of the previous one:

\`\`\`python
env = SkipFrame(env, skip=4)
env = TileObservation(env)
env = CropObservation(env, top=48, bottom=16, left=32, right=32)
env = GrayScaleObservation(env)
env = ResizeObservation(env, shape=12)
env = FrameStack(env, num_stack=4)
\`\`\`

Without any of them, the agent would receive a \`240 x 256 x 3\` image at 60 frames per second. That causes problems at several levels. The sections below explain what each wrapper does and what would go wrong without it.

### Skipping frames

\`SkipFrame\` repeats the chosen action for 4 frames, adds up the rewards, and returns only the last observation:

\`\`\`python
def step(self, action):
    total_reward = 0.0
    for i in range(self._skip):
        obs, reward, done, trunk, info = self.env.step(action)
        total_reward += reward
        if done:
            break
    return obs, total_reward, done, trunk, info
\`\`\`

Consecutive NES frames are almost identical, so an agent choosing an action every frame spends most of its decisions on situations that barely differ from the previous one. It also affects how far the agent can see into the future. With a discount of 0.95, rewards roughly 20 decisions ahead still count. That is about a third of a second of game time if every frame is a decision, and about 1.3 seconds with a skip of 4, which is closer to the length of a jump. Skipping also means four times fewer forward passes per second of gameplay.

The loop stops early if the episode ends, so the reward from frames after a death isn't counted.

### Semantic encoding

A raw frame has very little of its content that matters for deciding what to press. The sky color is different between levels, underground and castle levels use other palettes, and hills, bushes and clouds are drawn on screen even though Mario can't touch them. Question blocks flash and enemies cycle through walking animations. A network trained on pixels has to find out from rewards alone that a cloud is harmless and a brick is not, and whatever it learns on World 1-1 doesn't carry over to 1-2, where everything is recolored.

The game already knows what is where, though. It keeps the layout of the current level and the position of every enemy in RAM. \`TileObservation\` ignores the image it is given, reads that memory, and draws a new frame on a blank white \`240 x 256\` canvas:

\`\`\`python
def observation(self, observation):
    ram = self.env.unwrapped.env.ram
    canvas = np.full((_SCREEN_H, _SCREEN_W, 3), 255, dtype=np.uint8)
    self._draw_static_tiles(canvas, ram)
    self._draw_enemies(canvas, ram)
    self._draw_mario(canvas, ram)
    return canvas
\`\`\`

Everything is drawn as a 16x16 block aligned to the tile grid, using one of five colors: white for empty space, brown for solid ground and bricks, green for pipes, red for enemies and blue for Mario. Those colors are only labels, and a later wrapper turns them into gray levels.

**Static tiles.** The NES stores the tile layout of the level in RAM as two pages, each 16 tiles wide and 13 tiles tall (208 bytes). As Mario scrolls through the level the game alternates between the two pages. Finding the tile at a given spot is an address calculation:

\`\`\`python
def _get_tile_id(self, ram, x_level, y_screen):
    page  = (x_level // 256) % 2
    sub_x = (x_level % 256) // 16
    sub_y = (y_screen - _STATUS_BAR_H) // 16
    if sub_y not in range(_TILEMAP_ROWS):
        return 0x00
    addr = _TILEMAP_BASE + page * _PAGE_STRIDE + sub_y * _TILEMAP_COLS + sub_x
    return int(ram[addr])
\`\`\`

\`x_level\` is a horizontal position measured from the start of the level, so before looking up a tile the code needs to know which part of the level is on screen. It takes Mario's position in the level, subtracts his position on the screen, and gets the level coordinate of the screen's left edge. Each of the 16 screen columns is then looked up at \`x_start + col * 16\`. The top two rows are skipped because they hold the status bar. A tile ID of 0 is empty, the four IDs used by pipes are marked as pipes, and every other non-empty ID is marked solid.

**Enemies.** The game tracks up to five enemies at a time. Each slot has a flag saying whether it is active, a level position and a screen height. The code converts the level position to a screen position using the same \`x_start\` and draws one red tile per active slot.

**Mario.** His screen position comes from two more memory addresses, with a small offset so the block lands on the sprite instead of its corner. He is drawn as a single blue tile whether he is small or big.

The result is a frame where every object sits on the same grid, with nothing else drawn. The agent doesn't have to learn what a brick looks like or ignore the clouds, and the observation looks the same in every level.

### Cropping

\`\`\`python
env = CropObservation(env, top=48, bottom=16, left=32, right=32)
\`\`\`

The canvas is \`240 x 256\`, and the crop leaves \`176 x 192\`, which is 11 rows and 12 columns of tiles. The top 48 pixels are the blank status bar area plus one row of sky that rarely holds anything useful. The bottom row mostly repeats the ground row above it, and the pit information is already in that row. Two columns are removed from each side, the far edges of the screen. Without the crop, the network would spend input cells on rows and columns that are nearly always empty.

### Grayscale

\`GrayScaleObservation\` maps each label color to one value:

\`\`\`python
gray[np.all(observation == [255, 255, 255], axis=-1)] = 255  # empty
gray[np.all(observation == [139, 90,  43],  axis=-1)] = 128  # solid
gray[np.all(observation == [34,  139, 34],  axis=-1)] = 128  # pipe
gray[np.all(observation == [220, 50,  50],  axis=-1)] = 64   # enemy
gray[np.all(observation == [30,  100, 220], axis=-1)] = 0    # Mario
\`\`\`

Ground and pipes get the same value, since to the agent both are things to avoid or jump over. This drops three color channels to one, which matters once the frames are stacked.

### Resizing

\`ResizeObservation\` scales the \`176 x 192\` image down to \`12 x 12\`. Horizontally, 192 pixels become 12 cells, so one tile maps to one cell. Vertically, 11 tile rows become 12 cells, so the mapping is slightly uneven and a few cells sit between two tile rows. The output is converted back to \`uint8\`, which keeps the replay buffer small.

### Stacking frames

A single frame is a snapshot. It can't tell whether Mario is rising or falling, or which way an enemy is moving. \`FrameStack\` keeps the last 4 observations and gives them to the network together, so the final shape is \`(4, 12, 12)\`.

### What the wrappers add up to

The size difference is large. A stack of four raw RGB frames is 737,280 bytes. Each transition in the replay buffer stores two of those stacks, so 75,000 transitions would need about 110 GB. The processed stack is 576 bytes, and the same buffer takes about 86 MB. The buffer also holds actual signal instead of sprites and background art.

## The network

\`MarioNet\` holds two copies of the same CNN, called \`online\` and \`target\`:

\`\`\`python
feature_layer = nn.Sequential(
    nn.Conv2d(in_channels=c, out_channels=32, kernel_size=3, stride=1, padding=1),
    nn.ReLU(),
    nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, stride=1, padding=1),
    nn.ReLU(),
    nn.Conv2d(in_channels=64, out_channels=64, kernel_size=3, stride=1),
    nn.ReLU(),
    nn.Flatten(),
)

decision_layer = nn.Sequential(
    nn.Linear(num_flatten_features, 256),
    nn.ReLU(),
    nn.Linear(256, output_dim)
)
\`\`\`

The input has 4 channels, one per stacked frame. The first two convolutions use padding, so the grid stays \`12 x 12\`. The third has none and shrinks it to \`10 x 10\` with 64 channels. Flattened, that is 6,400 values, which go through a 256-unit layer and then a 2-unit output, one Q value for each action. The flattened size isn't hardcoded: the network passes a dummy input through the convolutions to measure it.

The target network starts as a copy of the online one and has its gradients turned off. It only changes when the agent copies the online weights into it.

## The agent

\`Mario\` is the agent class. It owns the network, the optimizer and the replay buffer.

**Acting.** The agent uses epsilon-greedy exploration. With probability \`exploration_rate\` it picks a random action, and otherwise it passes the state through the online network and takes the highest Q value. The rate starts at 1.0, is multiplied by 0.9993 after every episode, and stops at 0.1. That takes roughly 3,300 episodes.

**Remembering.** After every step, \`cache\` stores the state, next state, action, reward and done flag. The reward is scaled first. Since 4 frames are summed, a single reward can be large, so rewards above 10 are divided by 100 and the rest by 10. The buffer holds 75,000 transitions and keeps them in a memory-mapped store on the CPU.

**Learning.** Every step calls \`learn\`, which does nothing for the first 10,000 steps while the buffer fills. After that it updates the network on every third step, using a random batch of 64 transitions. The estimate and target are:

\`\`\`python
def td_estimate(self, state, action):
    return self.net(state, model="online")[np.arange(0, self.batch_size), action]

@torch.no_grad()
def td_target(self, reward, next_state, done):
    next_state_Q = self.net(next_state, model="online")
    best_action  = torch.argmax(next_state_Q, axis=1)
    next_Q = self.net(next_state, model="target")[np.arange(0, self.batch_size), best_action]
    return (reward + (1 - done.float()) * self.discount * next_Q).float()
\`\`\`

This is the difference between Double DQN and plain DQN. A plain DQN takes the maximum Q value from the same network that it is updating, which tends to overestimate values, because noise in the estimates gets picked as the maximum. Double DQN uses the online network to choose the best next action and the target network to score it. The loss is a Huber loss between the estimate and the target, gradients are clipped to a norm of 1.0, and the optimizer is Adam with a learning rate of 2.5e-4. The learning rate decays by a factor of 0.9991 after each episode, with a floor of 1e-5.

Every 10,000 steps the online weights are copied into the target network. The discount is 0.95.

## Training

The training script builds the environment and agent, then runs the loop. Each episode looks like this:

\`\`\`python
state = env.reset()
while True:
    action = mario.act(state)
    next_state, reward, done, trunc, info = env.step(action)

    flag_get = bool(info.get("flag_get", False))
    mario.cache(state, next_state, action, reward, done or trunc)
    q, loss = mario.learn()

    state = next_state
    if done or trunc or flag_get:
        break
\`\`\`

An episode ends when Mario dies, the game truncates it, or he reaches the flag. After that the script calls \`on_episode_end\`, which applies the epsilon and learning rate decay.

The script keeps the mean reward over the last 100 episodes and saves a \`best\` checkpoint whenever it improves. The check only starts after a warmup period, because the mean of the first few episodes means little. It also saves a numbered checkpoint every fixed number of episodes and a \`final\` one at the end. Each checkpoint holds the weights, optimizer state, scheduler state, exploration rate, step count and episode count.

A run can start in three ways. A new run starts from random weights. \`resume\` loads the full checkpoint and continues where it left off. \`transfer\` loads only the weights, so the same network can be trained on another level with fresh counters. The replay buffer isn't saved, so after a resume the burn-in is set again and the agent collects 10,000 new steps before it starts learning.

## Evaluation

The evaluation script builds the same environment with the same wrappers, which keeps the observations the same as in training. It loads the weights from a checkpoint and switches the network to evaluation mode. Epsilon is set to 0.05 instead of 0 so the agent doesn't repeat one stuck situation forever. Then it plays a chosen number of full episodes with gradients disabled.

Each run ends when Mario dies, reaches the flag, or hits a step limit, so a run where he gets stuck can't continue forever. A run counts as a success only if \`flag_get\` is true. The script reports the flag rate, the mean reward and the best reward, and saves them with the checkpoint name and level.

## Limitations

The encoding depends on memory addresses specific to Super Mario Bros, so it doesn't transfer to other games. Every solid tile gets the same value, so bricks, question blocks and ground look the same to the agent. Power-ups and projectiles aren't drawn, and Mario takes up one tile whatever his size. The agent also gets information a player has to read off the screen, which makes the task easier than learning from pixels.

## Source code
For the full implementation, you can check out the repository on my [Github](https://github.com/AliAhmad-M/SMB-RL).
`,
};

export default post;