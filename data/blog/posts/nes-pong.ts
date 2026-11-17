import type { BlogPost } from '../types';

const post: BlogPost = {
  slug: 'nes-pong',
  title: 'Writing Games for the Nintendo Entertainment System (1985)',
  tags: ['8-bit', 'Gamedev', 'Assembly', 'Low Level Programming'],
  cover: '/blog/nes-pong/cover.png',
  excerpt:
    'A guide towards developing a simple pong game for the NES using 8-bit 6502 assembly.',
  markdown: `
This guide builds Pong for the original Nintendo Entertainment System in 6502 assembly. There are two paddles, a ball and a score for 
each player. Note that there is no sound, no menu and no computer opponent.

## The big picture

The NES draws 60 frames per second. After each frame the picture chip pauses briefly, and during that pause it signals the CPU with 
an interrupt. All of the game logic lives in the handler for that interrupt:

\`\`\`asm
NMI:
  ; copy sprites to the picture chip
  ; move the ball
  ; read both controllers
  ; move both paddles
  RTI
\`\`\`

The main program does nothing except loop forever. Once setup is finished, every frame is one run of the handler above. The rest of the 
guide fills in each piece.

# Part 1: The hardware

## The 6502 in brief

The CPU is a 6502 variant running at about 1.79 MHz. It has three 8-bit registers you can work with: \`A\` (the accumulator), 
\`X\` and \`Y\`. \`A\` is used for arithmetic and comparisons, while \`X\` and \`Y\` are mostly counters and offsets. A set of status flags records 
the result of the last operation. The ones used here are carry, zero and negative.

Numbers starting with \`$\` are hexadecimal and numbers starting with \`%\` are binary. A \`#\` in front means a literal value instead of 
a memory address:

\`\`\`asm
LDA #$10     ; A = $10
LDA $10      ; A = the byte stored at address $0010
STA $0200    ; store A at address $0200
\`\`\`

Addition and subtraction both involve the carry flag. \`ADC\` adds with carry, so you clear the flag with \`CLC\` first. \`SBC\` subtracts 
with borrow, so you set the flag with \`SEC\` first. \`CMP\` compares \`A\` with a value and sets flags without changing \`A\`. After it, 
\`BCS\` branches if \`A >= value\`, \`BCC\` branches if \`A < value\`, and \`BEQ\` and \`BNE\` branch on equal and not equal.

## Memory

The CPU sees a 16-bit address space. The parts we use:

\`\`\`asm
; $0000-$00FF   zero page, faster to access, used for variables
; $0100-$01FF   the stack
; $0200-$02FF   a copy of sprite data, which we send to the PPU every frame
; $2000-$2007   PPU registers
; $4014         sprite DMA
; $4016-$4017   controllers
; $8000-$FFFF   the cartridge ROM
\`\`\`

The console only has 2 KB of RAM, so you have to be deliberate about what goes in it.

## The PPU

The picture processing unit (PPU) has its own memory that the CPU can't address directly. To write to it, you put an address into 
\`$2006\` (high byte first, then low byte) and then write bytes to \`$2007\`. The address goes up by one after each write.

The PPU's memory holds three kinds of data:

- Pattern tables, which are the 8x8 pixel tiles. Each pixel has 2 bits, so a tile is 16 bytes. They live in the cartridge's CHR ROM.
- Nametables, which are grids of tile numbers that make up the background. One nametable is 32 by 30 tiles, plus 64 attribute bytes, 
  1024 bytes in total.
- Palettes, which assign actual colors to the 2-bit pixel values. Each palette has 4 colors, and there are 4 palettes for the background 
  and 4 for sprites.

Sprites are separate from the background. Each sprite is an 8x8 tile with 4 bytes of data: Y position, tile number, attributes and X 
position. The PPU keeps a table of 64 sprites and we keep a copy of that table in CPU memory at \`$0200\` and send the whole page over once 
per frame.

# Part 2: Setting up the project

## The ROM header

Emulators need to know what the cartridge contains. The iNES header at the start of the file says so:

\`\`\`asm
.segment "HEADER"
  .byte "NES", $1A  ; iNES identifier
  .byte $02         ; PRG ROM, 2 x 16 KB
  .byte $01         ; CHR ROM, 1 x 8 KB
  .byte $01, $00    ; vertical mirroring, mapper 0
\`\`\`

Mapper 0 is the simplest cartridge layout, with no bank switching. 32 KB of program space is a lot more than Pong needs.

## Constants and variables

Register addresses get names so the code is readable:

\`\`\`asm
  PPU_CTRL    =   $2000
  PPU_MASK    =   $2001
  PPU_STATUS  =   $2002
  OAM_ADDR    =   $2003
  PPU_SCROLL  =   $2005
  PPU_ADDR    =   $2006
  PPU_DATA    =   $2007
  OAM_DMA     =   $4014

  JOY_1       =   $4016
  JOY_2       =   $4017

  RIGHT_WALL  =   $FB
  TOP_WALL    =   $04
  BOTTOM_WALL =   $E4
  LEFT_WALL   =   $04
\`\`\`

The wall values are screen coordinates in pixels. The screen is 256 pixels wide, so a position fits in a single byte, which is 
convenient on an 8-bit CPU.

The game variables sit in zero page:

\`\`\`asm
.segment "ZEROPAGE"
    game_state: .res 1       ; not used yet
    temp: .res 1             ; scratch byte
    delay_timer: .res 1      ; pause before the ball moves
    buttons_1: .res 1        ; controller states
    buttons_2: .res 1
    ball_vel_x: .res 1       ; sign bit gives direction
    ball_vel_y: .res 1
    ball_vel_index: .res 1   ; which serve direction is next
\`\`\`

\`.res 1\` reserves one byte. The assembler hands out addresses starting at \`$00\`, therefore \`game_state\` is \`$00\` and \`temp\` is \`$01\`. 
Keep that in mind, because the nametable loader borrows those two bytes later.

## The reset routine

When the console powers on or the reset button is pressed, the CPU jumps to the address stored in the reset vector. Our code there 
puts the hardware into a known state:

\`\`\`asm
RESET:
  SEI           ; disable IRQs
  CLD           ; disable decimal mode

  LDX #$40
  STX $4017     ; disable the APU frame IRQ

  LDX #$00
  STX $4010     ; disable DMC IRQs

  LDX #$FF
  TXS           ; set the stack pointer to the top of the stack

  LDX #$00
  STX PPU_CTRL  ; NMI off
  STX PPU_MASK  ; rendering off
\`\`\`

\`CLD\` does nothing on the NES, since its CPU has no decimal mode, but it's a habit from other 6502 machines. Turning off NMI and 
rendering means the PPU won't touch its memory while we fill it.

### Waiting for vblank

The PPU is only safe to write to between frames, in a period called vblank. Bit 7 of \`PPU_STATUS\` is set when vblank begins, so waiting 
for it is a short loop:

\`\`\`asm
VBLANKWAIT:
  BIT PPU_STATUS
  BPL VBLANKWAIT
  RTS
\`\`\`

\`BIT\` copies bit 7 of the value into the negative flag. \`BPL\` branches while that flag is clear. Reading \`PPU_STATUS\` also clears 
the vblank bit, so the next wait starts fresh.

The PPU needs roughly two frames after power on before it accepts writes reliably. The standard approach is to wait for vblank once, 
use the time to clear RAM, and wait again:

\`\`\`asm
  JSR VBLANKWAIT

  LDA #$00
  CLEAR_MEMORY:
    STA $0000, x
    STA $0100, x
    STA $0200, x
    STA $0300, x
    STA $0400, x
    STA $0500, x
    STA $0600, x
    STA $0700, x
    INX
    CPX #$00
    BNE CLEAR_MEMORY

  JSR VBLANKWAIT
\`\`\`

Each pass clears one byte in each of the eight pages of RAM. \`X\` counts from 0 up to 255 and wraps to 0, which ends the loop. The 
\`CPX #$00\` is redundant, because \`INX\` already sets the zero flag when it wraps.

# Part 3: Graphics

## Palettes

Both palette loaders do the same job. They point the PPU at a palette address and copy 16 bytes:

\`\`\`asm
LOAD_BCK_PAL:
  LDA #$3F
  STA PPU_ADDR    ; high byte
  LDA #$00
  STA PPU_ADDR    ; low byte, so the address is $3F00
  LDX #$00

  LOAD_BCK_PAL_LOOP:
    LDA BCK_PAL, x
    STA PPU_DATA
    INX
    CPX #$10
    BNE LOAD_BCK_PAL_LOOP

  RTS
\`\`\`

The background palettes start at \`$3F00\` and the sprite palettes at \`$3F10\`, so the sprite version only changes the low byte and 
the label it reads from. The data is a table of NES color codes:

\`\`\`asm
BCK_PAL:
  .byte $0f, $30, $00, $00
  .byte $0f, $00, $00, $00
  .byte $0f, $00, $00, $00
  .byte $0f, $00, $00, $00
\`\`\`

\`$0F\` is black, \`$30\` is white and \`$00\` is gray. Pong only needs the first palette. The first color in every palette is a 
background color shared by all of them, so \`$0F\` goes at the start of each.

## The background

The background is one nametable stored as a binary file. Loading it means copying 1024 bytes to PPU address \`$2000\`. A 1024 byte 
copy doesn't fit in a single loop of 256, because \`X\` and \`Y\` are only 8 bits, so we use two nested loops. The inner one runs 256 times 
and the outer one runs 4 times:

\`\`\`asm
LOAD_NAM:
  LDA PPU_STATUS  ; reset the PPU address latch
  LDA #$20
  STA PPU_ADDR
  LDA #$00
  STA PPU_ADDR

  LDA #<NAMETABLE ; low byte of the data's address
  STA $0000
  LDA #>NAMETABLE ; high byte
  STA $0001

  LDX #$00
  LDY #$00

  LOAD_NAM_LOOP:
    LDA ($00), y
    STA PPU_DATA
    INY
    CPY #$00
    BNE LOAD_NAM_LOOP
    INC $0001       ; move to the next 256 byte page
    INX
    CPX #$04
    BNE LOAD_NAM_LOOP

  RTS
\`\`\`

Reading \`PPU_STATUS\` first resets which half of the address the PPU expects next. Without it, a stray earlier write could leave 
the high and low bytes swapped.

\`LDA ($00), y\` is indirect indexed addressing. The two bytes at \`$00\` and \`$01\` hold a 16-bit address, and \`y\` is added to it. That 
is the only way to read through a pointer on the 6502. It is also why this routine overwrites \`game_state\` and \`temp\`. It runs 
once before the game starts, so nothing is lost.

## Sprites

The sprite table in ROM has 13 entries of 4 bytes each:

\`\`\`asm
SPRITES:
; SPR: y   tile attribute  x
.byte $00, $00, %00000000, $00  ; unused
.byte $00, $00, %00000000, $00  ; unused

; Ball
.byte $74, $00, %00000000, $7C

; Paddle 1, four sprites stacked
.byte $64, $01, %00000000, $10
.byte $6C, $01, %00000000, $10
.byte $74, $01, %00000000, $10
.byte $7C, $01, %00000000, $10

; Paddle 2
.byte $64, $01, %00000000, $E8
.byte $6C, $01, %00000000, $E8
.byte $74, $01, %00000000, $E8
.byte $7C, $01, %00000000, $E8

; Player 1 score
.byte $08, $02, %00000000, $10

; Player 2 score
.byte $08, $02, %00000000, $E8
\`\`\`

A sprite is only 8 pixels tall, so each paddle is four of them one above the other, 32 pixels in total. The tile number picks a 
tile from the pattern table: tile 0 is the ball, tile 1 is a piece of paddle, and tiles 2 to 11 are the digits 0 to 9. The attribute 
byte holds the palette number, flip bits and a priority bit. All of ours are zero.

Copying the table into RAM is a simple loop. \`$34\` is 13 sprites times 4 bytes:

\`\`\`asm
LOAD_SPRITES:
  LDX #$00
  LOAD_SPRITES_LOOP:
    LDA SPRITES, x
    STA $0200, x
    INX
    CPX #$34
    BNE LOAD_SPRITES_LOOP

  RTS
\`\`\`

Every sprite is now 4 bytes at \`$0200 + 4 * index\`. The code later on uses these addresses directly:

\`\`\`asm
; $0208            ball y
; $020B            ball x
; $020C, $0210, $0214, $0218    paddle 1 y, top to bottom
; $021C, $0220, $0224, $0228    paddle 2 y, top to bottom
; $022D            player 1 score tile
; $0231            player 2 score tile
\`\`\`

Named constants would be easier to read. I wrote raw addresses while working it out, and they stayed.

## Turning rendering on

The last setup steps reset the scroll position, enable NMI, and switch the picture on:

\`\`\`asm
  LDA #$00
  STA PPU_SCROLL
  STA PPU_SCROLL

  CLI

  LDA #%10010000
  STA PPU_CTRL

  LDA #%00011010
  STA PPU_MASK
\`\`\`

The scroll reset is needed because writing to \`PPU_ADDR\` changes the PPU's internal scroll registers as a side effect. 
In \`PPU_CTRL\`, bit 7 enables NMI and bit 4 makes the background read its tiles from the second pattern table, with sprites using the first. 

In \`PPU_MASK\`, bit 4 shows sprites, bit 3 shows the background and bit 1 shows the background in the leftmost 8 pixels. Bit 2, which 
would show sprites in that strip, is left clear. That means the ball disappears a few pixels before it reaches the left wall.

The ball's starting velocity is set here as well, and the delay flag is initialized. Both are covered in Part 5. After that, the 
main program finishes with:

\`\`\`asm
  FOREVER:
    JMP FOREVER
\`\`\`

# Part 3.5: Handling the frame

Every NMI starts with a sprite transfer:

\`\`\`asm
NMI:
  LDA #$00
  STA OAM_ADDR
  LDA #$02
  STA OAM_DMA
\`\`\`

Writing \`$02\` to \`$4014\` copies the 256 bytes starting at \`$0200\` into the PPU's sprite memory. The CPU is frozen for 513 cycles while 
it happens. A frame has about 29,780 CPU cycles and vblank only lasts around 2,270 of them, so the copy takes a big share of the window. 
That is the reason for keeping a RAM copy and sending it all at once, instead of writing to the PPU in many small pieces.

The transfer comes first, and the game logic comes after it. Changes made this frame show up on screen next frame.

\`\`\`asm
  JSR MOV_BALL

  JSR LATCH_CONTROLLER_1
  JSR LATCH_CONTROLLER_2

  JSR MOV_PADDLE_1
  JSR MOV_PADDLE_2

  RTI
\`\`\`

The vectors at the end of the ROM point the CPU to these two routines:

\`\`\`asm
.segment "VECTORS"
  .word NMI
  .word RESET
\`\`\`

The 6502 reads three vectors at the top of memory: NMI, reset and IRQ. I only define the first two, because nothing in the 
game raises an IRQ.

# Part 4: Input

## Reading a controller

A controller is a shift register. You write 1 and then 0 to \`$4016\` to make it capture the current state of all eight buttons. 
After that, each read of \`$4016\` returns the state of a single button in bit 0, in this order: A, B, Select, Start, Up, Down, Left, Right.

\`\`\`asm
LATCH_CONTROLLER_1:
  LDA #$01
  STA JOY_1
  LDA #$00
  STA JOY_1       ; latch the buttons

  LDX #$08
  READ_CONTROLLER_1:
    LDA JOY_1
    LSR           ; bit 0 goes into the carry flag
    ROL buttons_1 ; and from there into buttons_1
    DEX
    BNE READ_CONTROLLER_1

  RTS
\`\`\`

\`LSR\` shifts \`A\` right by one and drops the old bit 0 into carry. \`ROL\` shifts the variable left and brings the carry in at bit 0. Eight 
rounds of that leave the first button read (A) in bit 7 and the last (Right) in bit 0. This gives the following masks:

\`\`\`asm
; Up    AND #$08
; Down  AND #$04
\`\`\`

The latch strobe on \`$4016\` captures both controller ports at once, so the second controller needs no strobe of its own:

\`\`\`asm
LATCH_CONTROLLER_2:
  LDX #$08
  READ_CONTROLLER_2:
    LDA JOY_2
    LSR
    ROL buttons_2
    DEX
    BNE READ_CONTROLLER_2

  RTS
\`\`\`

The only difference is that it reads from \`$4017\`. This routine has to run after \`LATCH_CONTROLLER_1\`, which is why the order in 
the NMI handler matters. Writes to \`$4017\` don't latch anything, since on a write that address belongs to the sound hardware.

# Part 5: Paddles and the ball

## Moving a paddle

A paddle is four sprites, so moving it means changing four Y values. The loop steps \`X\` through 0, 4, 8 and 12, which are the offsets 
of those four bytes from the first one:

\`\`\`asm
MOV_PADDLE_1:
  READ_UP_1:
    LDA buttons_1
    AND #$08
    BEQ READ_DOWN_1     ; up not pressed

    LDA $020C           ; y of the top sprite
    CMP #TOP_WALL
    BCC READ_DOWN_1     ; already at the top

    LDX #$00
    MOV_UP_1:
      LDA $020C, x
      SEC
      SBC #$02          ; y = y - 2
      STA $020C, x

      INX
      INX
      INX
      INX

      CPX #$10
      BNE MOV_UP_1

  READ_DOWN_1:
    LDA buttons_1
    AND #$04
    BEQ READ_DONE_1

    LDA $0218           ; y of the bottom sprite
    CMP #BOTTOM_WALL
    BCS READ_DONE_1

    LDX #$00
    MOV_DOWN_1:
      LDA $020C, x
      CLC
      ADC #$02          ; y = y + 2
      STA $020C, x

      INX
      INX
      INX
      INX

      CPX #$10
      BNE MOV_DOWN_1

  READ_DONE_1:
    RTS
\`\`\`

Y grows downward on the screen, so moving up subtracts. The top limit is checked against the first sprite and the bottom limit 
against the last. The paddle moves 2 pixels per frame, or 120 pixels per second. Paddle 2 is the same routine with \`buttons_2\` and 
the addresses starting at \`$021C\`.

## Velocity as a sign bit

The ball moves a fixed amount each frame, 2 pixels horizontally and 1 vertically. Only the direction changes, so each velocity variable 
stores a single flag in bit 7. When the bit is set, the ball moves right or down. When it's clear, the ball moves left or up. 
Reversing direction is a single exclusive or:

\`\`\`asm
LDA ball_vel_y
EOR #%10000000
STA ball_vel_y
\`\`\`

\`EOR\` flips every bit where the operand has a 1, so this changes bit 7 and nothing else.

There are four possible serve directions, kept in two small tables:

\`\`\`asm
; bit 7 set: right / down.   bit 7 clear: left / up
VELOCITES_X:
  .byte %00000000, %10000000, %00000000, %10000000

VELOCITES_Y:
  .byte %00000000, %00000000, %10000000, %10000000
\`\`\`

Reading both tables at the same index gives left and up, right and up, left and down, then right and down. At the start of the 
program, the initial velocity is set directly:

\`\`\`asm
  LDA #%10000000  ; right
  STA ball_vel_x

  LDA #%00000000  ; up
  STA ball_vel_y

  LDA #$00
  STA ball_vel_index
\`\`\`

## The start delay

After each point the ball sits in the center for a moment. A flag marks that state, and I kept it in the \`Y\` register:

\`\`\`asm
MOV_BALL:
  CPY #$FF
  BEQ HANDLE_DELAY

  JMP HANDLE_WALL_Y

  HANDLE_DELAY:
    JSR INCREMENT_TIMER

    LDA delay_timer
    CMP #$00
    BNE SKIP_MOV_BALL

    LDY #$00            ; delay over, clear the flag
\`\`\`

The timer itself is minimal:

\`\`\`asm
INCREMENT_TIMER:
  INC delay_timer
  RTS
\`\`\`

\`delay_timer\` goes up by one each frame. A byte wraps from 255 back to 0, and the check above treats a zero as the end of the wait. 
This is also what restarts the timer for the next serve, because it's already back at zero.

Storing a flag in a register is a shortcut. It works here because nothing touches \`Y\` while the flag is set, but a zero page variable 
would be safer. I'd change it if I rewrote this.

## Bouncing off the top and bottom

\`\`\`asm
  HANDLE_WALL_Y:
    LDA $0208

    CMP #TOP_WALL
    BCC INVERT_VEL_Y    ; y < top wall

    CMP #BOTTOM_WALL
    BCS INVERT_VEL_Y    ; y >= bottom wall

    JMP HANDLE_WALL_X
    INVERT_VEL_Y:
      LDA ball_vel_y
      EOR #%10000000
      STA ball_vel_y
\`\`\`

Both comparisons use the unsigned branches from earlier. If the ball is outside either limit, the vertical direction flips. 
The ball only moves 1 pixel vertically per frame, so it can't be past a wall for more than one check, and the flip can't happen twice 
in a row.

## Scoring

The same approach works horizontally, except that crossing a side wall is a point instead of a bounce:

\`\`\`asm
  HANDLE_WALL_X:
    LDA $020B

    CMP #LEFT_WALL
    BCC PLAYER_2_SCORE

    CMP #RIGHT_WALL
    BCS PLAYER_1_SCORE

    JMP HANDLE_PADDLES

    PLAYER_1_SCORE:
      LDX $022D       ; tile of player 1's score sprite
      JSR SCORE_POINT
      STA $022D
      JMP RESET_BALL_POS

    PLAYER_2_SCORE:
      LDX $0231
      JSR SCORE_POINT
      STA $0231
      JMP RESET_BALL_POS
\`\`\`

There is no score variable. The score is stored in the tile number of the score sprite. Tile 2 draws a 0, tile 3 draws a 1 and 
so on up to tile 11 for a 9. Adding a point means moving to the next tile:

\`\`\`asm
SCORE_POINT:
  CPX #$0B          ; already showing a 9
  BEQ END_SCORE_POINT

  INX

  END_SCORE_POINT:
    TXA

  RTS
\`\`\`

The routine takes the current tile in \`X\` and returns the new one in \`A\`. At 9 it stops counting. This game has no winner and no 
second digit, so the score just stays there.

## Serving

When a point is scored the ball goes back to the center, the delay flag is set, and the next serve direction is taken from 
the tables:

\`\`\`asm
    RESET_BALL_POS:
      LDA #$7C
      STA $020B           ; x

      LDA #$74
      STA $0208           ; y

      LDY #$FF            ; start the delay

      LDX ball_vel_index

      LDA VELOCITES_X, X
      STA ball_vel_x

      LDA VELOCITES_Y, X
      STA ball_vel_y

      LDA ball_vel_index
      CMP #$03
      BEQ RESET_INDEX

      CLC
      ADC #$01
      JMP STORE_INDEX

      RESET_INDEX:
        LDA #$00

      STORE_INDEX:
        STA ball_vel_index

      JMP HANDLE_PADDLES
\`\`\`

The index counts 0, 1, 2, 3 and back to 0, so the serves go through all four directions in turn. Nothing here is random. Players 
learn the order quickly, but it is easy to build and test.

## Paddle collisions

Collision checking happens in two stages. The first stage asks whether the ball is at the right distance horizontally. If it 
is, the second asks whether it lines up vertically with the paddle.

\`\`\`asm
  HANDLE_PADDLE_1:
    LDA $020B
    CMP #$16
    BCS HANDLE_PADDLE_2   ; x >= $16, too far right

    CMP #$14
    BCC HANDLE_PADDLE_2   ; x < $14, too far left

    LDX $020C             ; paddle 1 top sprite y
    LDY $0218             ; paddle 1 bottom sprite y

    JMP CHECK_PADDLE_Y
\`\`\`

Paddle 1 sits at x = $10 and is 8 pixels wide. The ball only counts as touching it when its x is $14 or $15. The window is 
two pixels wide to match the ball's speed. The ball starts at an even x and moves in steps of 2, so it always has an even value and 
must land on $14 exactly once as it passes. A narrower window could be skipped, and a wider one would flip the direction twice.

Paddle 2 works the same way, with the window at $E4 and $E5:

\`\`\`asm
  HANDLE_PADDLE_2:
    LDA $020B
    CMP #$E4
    BCC CHECK_VEL_X
    CMP #$E6
    BCS CHECK_VEL_X

    LDX $021C
    LDY $0228

    JMP CHECK_PADDLE_Y
\`\`\`

Both paths end at the same vertical check, with \`X\` holding the paddle's top sprite and \`Y\` holding the bottom sprite's y:

\`\`\`asm
    CHECK_PADDLE_Y:
      CHECK_PADDLE_TOP:
        TXA
        STA temp

        LDA $0208
        CMP temp
        BCS CHECK_PADDLE_BOTTOM   ; ball y >= paddle top

        JMP CHECK_VEL_X

      CHECK_PADDLE_BOTTOM:
        TYA
        CLC
        ADC #$08                  ; bottom of the last sprite
        STA temp

        LDA $0208
        CMP temp
        BCC INVERT_VEL_X          ; ball y < paddle bottom

        JMP CHECK_VEL_X

        INVERT_VEL_X:
          LDA ball_vel_x
          EOR #%10000000
          STA ball_vel_x

          JMP CHECK_VEL_X
\`\`\`

\`CMP\` needs its operand in memory, and the values here live in \`X\` and \`Y\`, so \`temp\` holds them for the comparison. The 
check compares only the ball's top edge against the paddle's top and bottom. A ball whose lower edge is just overlapping the 
top of the paddle gets missed. It's a small error at this scale. Also, the ball always leaves a paddle at the same angle, 
however it was hit.

## A branch that was too far

The 6502's branch instructions are limited to 127 bytes forward and 128 bytes back. \`MOV_BALL\` is long enough that the branch 
from the delay check to the end of the routine didn't reach, and the assembler reports a range error. The fix is to branch to a 
nearby stub that holds a \`JMP\`, which has no range limit:

\`\`\`asm
  SKIP_MOV_BALL:
    JMP END_MOV_BALL
\`\`\`

## Moving the ball

With the checks done, the ball is moved by its velocity:

\`\`\`asm
  CHECK_VEL_X:
    LDA ball_vel_x
    AND #%10000000
    BEQ MOV_NEG_X
    JMP MOV_POS_X

  MOV_POS_X:
    LDA $020B
    CLC
    ADC #$02            ; move right
    JMP END_MOV_X

  MOV_NEG_X:
    LDA $020B
    SEC
    SBC #$02            ; move left
    JMP END_MOV_X

  END_MOV_X:
    STA $020B
\`\`\`

\`AND #%10000000\` keeps only the sign bit, so the result is zero when the bit is clear. The vertical movement is identical, 
using \`ball_vel_y\`, the address \`$0208\` and a step of 1 instead of 2. The routine finishes with \`RTS\`, and the NMI handler 
carries on with the controllers.

## Source code

The full project, including the tile and nametable assets, is on [GitHub](https://github.com/AliAhmad-M/Pong-NES).

Some things I'd add next are a score limit that ends the round, paddle hit positions that change the ball's angle, and a sound 
effect for each bounce using the first pulse channel.
`,
};

export default post;