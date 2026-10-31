"""Builds src/lines.json (every voice line the game can say). Run, then gen_voice.py to make the mp3s."""
import json
from pathlib import Path

W = ("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
     "sixteen seventeen eighteen nineteen twenty").split()
C = lambda n: W[n].capitalize()
ANIMALS = ("lamb duckling hedgehog piglet chick calf squirrel owl fawn badger mouse bearcub "
           "frog otter kingfisher beaver turtle cygnet goatkid marmot cria redpanda yak leopardcub").split()
NAME = {a: a for a in ANIMALS} | {"bearcub": "bear cub", "goatkid": "goat kid", "cria": "alpaca", "redpanda": "red panda", "yak": "yak", "leopardcub": "snow leopard cub"}

L = {
    "hello_choose": "Hello! Which friend would you like to take home?",
    "adopt_yay": "Yay! I'm so happy! Let's go on an adventure together!",
    "map_intro": "Oh no, the meadow has lost its colours! Let's help the animals and bring the colours back.",
    "map_pick": "Tap the shiny circle to play!",
    "meadow_done": "Wow! The whole meadow is full of colour again! You are amazing!",
    "to_forest": "Look, a path to the forest! Tap the sign to go there.",
    "to_river": "Look, a path to the river! Tap the sign to go there.",
    "to_mountains": "Look, a path up the mountains! Tap the sign to go there.",
    "river_intro": "Welcome to the river! The river animals are waiting for us.",
    "river_done": "Splendid! The river is sparkling again! You did it!",
    "mountains_intro": "Welcome to the mountains! Let's help the mountain animals.",
    "mountains_done": "Wow! The mountains are glowing with colour! You are a true hero!",
    "bd_intro": "Tap a bead to slide the beads across.",
    "bd_hint": "Count the red beads to ten first, then the rest.",
    "bd_check": "Tap the tick when you're ready.",
    "mr_intro": "Tap the mirror to copy the spots onto the other wing!",
    "mr_hint": "Count the spots on both wings.",
    "mr_half_hint": "Count the spots on just one wing.",
    "mm_intro": "Find the pairs! Tap two cards to turn them over.",
    "mm_nope": "Not a pair. Try to remember where they are!",
    "gift_hi": "A present for you! Tap it to open it!",
    "gift_open": "Five sparkly gems for you!",
    "gems_got": "You earned some gems!",
    "shop_hi": "Choose something for our sanctuary! You can drag things to move them.",
    "shop_need": "We need more gems. Play some games to earn more!",
    "shop_buy": "Ooh, lovely!",
    "rest": "That was lots of playing! Time for a rest now. See you later!",
    "forest_intro": "Welcome to the forest! The forest animals need our help too.",
    "forest_done": "Hooray! The forest is bright and beautiful again! You are a superstar!",
    "boss_intro": "Oh no, a storm cloud! Answer the questions to blow it away!",
    "boss_next": "The cloud is getting smaller! Keep going!",
    "tf_fill": "Fill up the frame! Drag the ladybirds into the empty spaces.",
    "tf_added": "How many ladybirds did you add?",
    "tf_hint": "Not quite. Count the empty spaces.",
    "watch_me": "Let's count them together.",
    "bb_intro_10": "Pop two bubbles that make ten!",
    "bb_intro_5": "Pop two bubbles that make five!",
    "bb_intro_20": "Pop two bubbles that make twenty!",
    "bb_not": "Not quite! Try a different pair.",
    "bb_hint": "Look! This bubble is a good partner.",
    "feed_hint": "Count how many more apples I need.",
    "cs_intro": "This is a number cherry. The big cherry is the whole. The little cherries are the parts.",
    "cs_hint": "Count all the acorns in both little cherries.",
    "cs_hint_part": "Count the acorns that still need to go in.",
    "hop_tap": "Tap me to hop!",
    "hop_hint": "Count the hops on the number line.",
    "round_done": "That was fantastic! Let's go back to the map.",
    "sanctuary_hi": "Welcome to our sanctuary! Tap the animals to say hello.",
    "book_hi": "This is your sticker book. Help more animals to fill it up!",
    "praise_1": "Brilliant!", "praise_2": "Super!", "praise_3": "You got it!", "praise_4": "Amazing!", "praise_5": "Well done!",
    "oops_1": "Oops! Try again.", "oops_2": "Nearly! Have another go.", "oops_3": "Hmm, not quite. Try again!",
}
for n in range(1, 21):
    L[f"num_{n}"] = C(n) + "."
for n in range(1, 11):
    L[f"mr_q_{n}"] = f"What is double {W[n]}?"
    L[f"dbl_{n}"] = f"Double {W[n]} is {W[2 * n]}!"
    L[f"half_q_{n}"] = f"What is half of {W[2 * n]}?"
    L[f"half_{n}"] = f"Half of {W[2 * n]} is {W[n]}!"
for t in range(11, 20):
    L[f"bd_make_{t}"] = f"Show {W[t]} on the beads!"
for t in range(11, 21):
    for a in range(0, t + 1):
        L[f"bond_{t}_{a}"] = f"{C(a)} and {W[t - a]} make {W[t]}!"
    if t == 20:
        for a in range(0, 21):
            L[f"more_20_{a}"] = f"I've got {W[a]}. How many more to make twenty?"
    for a in range(5, 10):   # bridging through ten: a + b with a 5..9
        b = t - a
        if 2 <= b <= 9:
            L[f"hop_add_{t}_{a}"] = f"Start at {W[a]} and hop forward {W[b]}. Where will you land?"
            L[f"add_{t}_{a}"] = f"{C(a)} add {W[b]} is {W[t]}!"
            L[f"bd_add_{t}_{a}"] = f"You've got {W[a]} beads. Slide {W[b]} more. How many now?"
    if t % 2 == 0:            # doubles fed to an animal
        L[f"feed_{t}_{t // 2}"] = f"I've got {W[t // 2]} apples, but I want {W[t]}! Which basket do I need?"
for a in ANIMALS:
    L[f"rescued_{a}"] = f"You helped the {NAME[a]}! Welcome to our sanctuary, little {NAME[a]}!"
    L[f"hi_{a}"] = f"Hello! I'm the little {NAME[a]}!"
for t in range(1, 11):
    for a in range(0, t + 1):
        b = t - a
        L[f"bond_{t}_{a}"] = f"{C(a)} and {W[b]} make {W[t]}!"
        if t in (5, 10):
            L[f"more_{t}_{a}"] = f"I've got {W[a]}. How many more to make {W[t]}?"
        if t >= 3:
            L[f"feed_{t}_{a}"] = f"I've got {W[a]} apples, but I want {W[t]}! Which basket do I need?"
        if 0 < a < t:
            L[f"cs_part_{t}_{a}"] = f"{C(t)} is {W[a]} and how many more?"
            L[f"cs_whole_{t}_{a}"] = f"{C(a)} and {W[b]}. How many altogether?"
        if b >= 1:   # add: start at a, hop forward b, land on t
            L[f"hop_add_{t}_{a}"] = f"Start at {W[a]} and hop forward {W[b]}. Where will you land?"
            L[f"add_{t}_{a}"] = f"{C(a)} add {W[b]} is {W[t]}!"
        if a >= 1:   # sub: start at t, hop back a, land on b
            L[f"hop_sub_{t}_{a}"] = f"Start at {W[t]} and hop back {W[a]}. Where will you land?"
            L[f"sub_{t}_{a}"] = f"{C(t)} take away {W[a]} is {W[b]}!"

out = Path(__file__).resolve().parents[2] / "src" / "lines.json"
out.write_text(json.dumps(L, indent=1))
print(len(L), "lines")
