import io

with io.open(r'C:\Users\HP\Desktop\Maruf-teach-Bot\.agents\skills\ytdata\SKILL.md', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "- Right side: A smart boy in a black blazer holding an iPhone.",
    "- Right side: A smart boy in a black blazer holding an iPhone.\n- *DYNAMIC EXPRESSION*: If the user uploads a payment proof screenshot, the boy MUST have a surprised expression (???? ??? ?????? ???). If NO payment proof is uploaded, the boy should just be pointing normally with his finger (??? ???? ?????? ??? ????????)."
)

with io.open(r'C:\Users\HP\Desktop\Maruf-teach-Bot\.agents\skills\ytdata\SKILL.md', 'w', encoding='utf-8') as f:
    f.write(c)
