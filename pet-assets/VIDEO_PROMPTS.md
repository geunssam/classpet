# ClassPet 시그니처 무브 영상 프롬프트

## 사용법
1. Grok 웹에서 이미지-to-비디오 선택
2. 해당 동물/단계의 PNG 이미지 업로드
3. 아래 영어 프롬프트 복사 → 붙여넣기
4. 생성 후 체크리스트로 확인 → 마음에 안 들면 재생성

> 마지막 프레임이 원래 포즈로 안 돌아오는 경우 → ffmpeg 리버스 트릭으로 후처리 가능

---

## 생성 체크리스트

- [ ] 첫 프레임이 원본 이미지와 동일한 포즈인가?
- [ ] **마지막 프레임이 원본 이미지와 완전히 동일한 정지 화면인가?**
- [ ] 클레이/토이 3D 스타일이 유지되는가?
- [ ] 배경이 변하지 않았는가?
- [ ] 액세서리(반다나/별)가 사라지지 않았는가?
- [ ] 동작이 해당 동물의 특성을 잘 보여주는가?

---

## Bear (곰)

**Stage 1 — Newborn** `bear_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny brown clay bear is sleeping curled up on a soft green background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the green background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `bear_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute brown clay bear with pink cheeks is sitting on a lavender purple background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side, wiggles its round little ears and sniffs the air.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `bear_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young brown clay bear wearing a blue bandana is sitting confidently on a lavender purple background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Stands up slightly and stretches its arms wide in a big bear hug pose with a proud smile.
3-5s: Gently sits back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `bear_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic brown clay bear wearing a blue bandana with a yellow star is sitting proudly on a lavender purple background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Rises up tall and does a powerful bear stretch with arms spread wide.
3-5s: Gracefully sits back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Cat (고양이)

**Stage 1 — Newborn** `cat_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny white-and-orange clay kitten is sleeping curled up on a small brown cushion on a light lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down on the cushion, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `cat_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute white-and-orange clay cat with blue-green eyes is sitting on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side, lifts one paw and licks it gently.
3-5s: Gently lowers its paw, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `cat_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young white-and-orange clay cat wearing a blue bandana is sitting confidently on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Stands up slightly and arches its back in a graceful stretch with a proud smile.
3-5s: Gently sits back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `cat_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic white-and-orange clay cat wearing a blue bandana with a yellow star is sitting proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Does an elegant slow stretch, extending one paw forward like a regal feline.
3-5s: Gracefully retracts its paw, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Chick (병아리)

**Stage 1 — Newborn** `chick_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny yellow fluffy clay chick is sleeping nestled on a white egg shell on a cream ivory background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its fluffy body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down onto the egg shell, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `chick_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute pale yellow clay chick with orange beak and orange feet is standing on a light purple background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side and flaps its tiny wings excitedly.
3-5s: Gently folds its wings back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light purple background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `chick_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young yellow clay chick with an orange heart-shaped crest wearing a blue bandana is standing confidently on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Flutters its wings and does a small happy hop with a proud smile.
3-5s: Gently lands and folds its wings, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `chick_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic white clay rooster with a red crest wearing a blue bandana with a yellow star is standing proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Spreads its wings wide and lets out a proud silent crow.
3-5s: Gracefully folds its wings, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star and red crest must stay visible throughout.
```

---

## Dog (강아지)

**Stage 1 — Newborn** `dog_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny cream-colored clay puppy is sleeping curled up on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `dog_stage2_baby_v2.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute cream-colored clay puppy with floppy ears is sitting on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side, wags its tiny tail and pants happily.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `dog_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young cream-colored clay dog wearing a blue bandana is sitting confidently on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Bounces up with an excited tail wag and a proud happy smile.
3-5s: Gently sits back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `dog_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic cream-colored clay dog wearing a blue bandana with a yellow star is sitting proudly on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Wags its tail proudly and lifts one paw in a noble handshake pose.
3-5s: Gracefully lowers its paw, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Dragon (용)

**Stage 1 — Newborn** `dragon_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny purple clay dragon with small ivory horns is sleeping curled up with its tail wrapped around on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down into its curled position, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `dragon_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute light purple clay baby dragon with small wings and pink horns is sitting on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side and puffs out its cheeks trying to blow a tiny flame.
3-5s: Gently relaxes its cheeks, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `dragon_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young purple clay dragon with pink horns and small wings wearing a blue bandana is sitting confidently on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Unfolds its small wings and flaps them proudly with a confident smile.
3-5s: Gently folds its wings back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `dragon_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic purple clay dragon with orange horns and pink wings wearing a blue bandana with a yellow star is sitting proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Spreads its grand wings wide and lifts its head with a silent roar.
3-5s: Gracefully folds its wings, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Elephant (코끼리)

**Stage 1 — Newborn** `elephant_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny gray clay baby elephant is sleeping peacefully on a light cream background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `elephant_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute gray clay elephant with big ears and pink cheeks is sitting on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously and swings its little trunk side to side playfully.
3-5s: Gently lowers its trunk, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `elephant_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young gray clay elephant with small tusks wearing a blue bandana is sitting confidently on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Raises its trunk up high and trumpets silently with a proud smile.
3-5s: Gently lowers its trunk, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `elephant_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic gray clay elephant with tusks wearing a blue bandana with a star is sitting proudly on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Raises its magnificent trunk high and flaps its large ears.
3-5s: Gracefully lowers its trunk, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana with star must stay visible throughout.
```

---

## Fox (여우)

**Stage 1 — Newborn** `fox_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny orange clay fox with a white-tipped tail is sleeping curled up in a ball on a white background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back into its curled position, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the white background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `fox_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute orange clay fox with white cheeks, black paws, and a fluffy white-tipped tail is sitting on a soft pink background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side, twitches its ears and gives a sly little wink.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the pink background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `fox_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young orange clay fox with black paws and a fluffy white-tipped tail wearing a blue bandana is sitting confidently on a soft pink background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Swishes its fluffy tail and strikes a clever pose with a proud smile.
3-5s: Gently settles its tail, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the pink background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `fox_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic orange clay fox with black paws and a fluffy white-tipped tail wearing a blue bandana with a yellow star is sitting proudly on a soft pink background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Flicks its magnificent tail and gives a wise, knowing look.
3-5s: Gracefully settles its tail, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the pink background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Hamster (햄스터)

**Stage 1 — Newborn** `hamster_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny golden-orange clay hamster with a white belly is sleeping curled up on a cream background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `hamster_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute golden-orange clay hamster with a white belly and pink ears is sitting on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, stuffs its cheeks and wiggles its tiny nose.
3-5s: Gently relaxes its cheeks, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `hamster_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young golden-orange clay hamster with a white belly wearing a blue bandana is standing confidently on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Holds up its paws and spins around once with a proud smile.
3-5s: Gently settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `hamster_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic golden-orange clay hamster with a white belly wearing a blue bandana with a yellow star is sitting proudly on a blue-purple gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Puffs up its big round cheeks and does a happy little clap.
3-5s: Gracefully lowers its paws, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-purple gradient background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Hedgehog (고슴도치)

**Stage 1 — Newborn** `hedgehog_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny beige clay hedgehog with brown spines is sleeping curled into a ball on a cream background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back into its curled position, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `hedgehog_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute beige clay hedgehog with brown spines and a pink nose is sitting on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, curls into a tiny ball, then peeks back out.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `hedgehog_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young beige clay hedgehog with brown spines and a red nose wearing a blue bandana is standing confidently on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Rolls into a ball briefly and uncurls with a proud grin.
3-5s: Gently settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `hedgehog_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic beige clay hedgehog with impressive brown spines wearing a blue bandana with a yellow star is sitting proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Curls up showing its impressive spines, then unfurls with a confident smile.
3-5s: Gracefully settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Lion (사자)

**Stage 1 — Newborn** `lion_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny golden clay lion cub with a small yellow mane is sleeping lying down on a cream background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `lion_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute golden-orange clay lion cub with a small tuft of mane is sitting on a blue-pink gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously to one side and opens its mouth in a tiny squeaky yawn.
3-5s: Gently closes its mouth and settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-pink gradient background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `lion_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young golden-orange clay lion with a growing mane wearing a blue bandana is sitting confidently on a blue-pink gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Shakes its growing mane from side to side with a proud confident smile.
3-5s: Gently settles its mane, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-pink gradient background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `lion_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic golden clay lion with a full flowing mane and a yellow star pendant is sitting proudly on a blue-pink gradient background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Shakes its magnificent full mane and opens its mouth in a powerful silent roar.
3-5s: Gracefully closes its mouth, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the blue-pink gradient background unchanged. The yellow star pendant must stay visible throughout.
```

---

## Otter (수달)

**Stage 1 — Newborn** `otter_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny brown clay otter with a cream belly is sleeping curled up on a white background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back into its curled position, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the white background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `otter_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute brown clay otter with a cream belly and whiskers is sitting on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, rolls onto its back and wiggles its paws playfully.
3-5s: Gently rolls back up, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `otter_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young brown clay otter with a cream belly wearing a blue bandana is sitting confidently on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Claps its paws together playfully with a proud smile.
3-5s: Gently lowers its paws, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `otter_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic brown clay otter with a cream belly wearing a blue bandana with a yellow star is sitting proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Rolls gracefully onto its back, juggles an invisible shell, and rolls back up.
3-5s: Gracefully settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Panda (판다)

**Stage 1 — Newborn** `panda_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny black-and-white clay panda is sleeping curled up on its side on a light gray background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light gray background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `panda_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute black-and-white clay panda with pink paw pads and pink cheeks is sitting on a light pink-lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, covers its face with both paws, then peeks out.
3-5s: Gently lowers its paws, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the pink-lavender background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `panda_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young black-and-white clay panda wearing a blue bandana is sitting confidently on a light pink-lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Does a playful tumble roll to one side with a proud smile.
3-5s: Gently sits back up, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the pink-lavender background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `panda_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic black-and-white clay panda with purple paw pads wearing a blue bandana with a yellow star is sitting proudly on a lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Does a slow kung-fu pose, raising one paw gracefully.
3-5s: Gracefully lowers its paw, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the lavender background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Penguin (펭귄)

**Stage 1 — Newborn** `penguin_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny dark gray and white clay penguin is sleeping curled into a round ball on a cream background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its round body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back into its round position, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the cream background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `penguin_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute dark gray and white clay penguin with a yellow beak and pink cheeks is standing on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, flaps its tiny flippers and wobbles side to side.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `penguin_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young black and white clay penguin with a yellow beak wearing a blue bandana is standing confidently on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Waddles a few steps and flaps its flippers with a proud smile.
3-5s: Gently waddles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `penguin_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic black and white clay penguin wearing a blue bandana with a yellow star is standing proudly on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Does a proud waddle-strut and flaps its flippers wide.
3-5s: Gracefully settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Rabbit (토끼)

**Stage 1 — Newborn** `rabbit_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny white clay rabbit with pink ears is sleeping lying down on a light blue-lavender background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue-lavender background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `rabbit_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute white clay rabbit with long pink ears and a pink nose is sitting on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously, twitches its nose rapidly and perks up its ears.
3-5s: Gently settles its ears back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `rabbit_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young white clay rabbit with long pink ears wearing a blue bandana is sitting confidently on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Does a small excited hop in place with a proud smile.
3-5s: Gently lands, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `rabbit_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic white clay rabbit with long pink ears wearing a blue bandana with a yellow star is sitting proudly on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Thumps one powerful back foot and wiggles its nose with authority.
3-5s: Gracefully settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Turtle (거북이)

**Stage 1 — Newborn** `turtle_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny green clay turtle with a dark green shell and yellow rim is sleeping with its head tucked on a light mint background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently tucks its head back in, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light mint background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `turtle_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute light green clay turtle with pink cheeks and big eyes is sitting on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously and slowly peeks its head out further, blinking.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `turtle_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young green clay turtle with a hexagon-patterned shell wearing a blue bandana is sitting confidently on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Pulls its head in shyly, then pops back out with a proud grin.
3-5s: Gently settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `turtle_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic green clay turtle with a hexagon-patterned shell wearing a blue bandana with a yellow star is sitting proudly on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Extends its neck tall and proud, showing its full shell pattern.
3-5s: Gracefully lowers its neck, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana with yellow star must stay visible throughout.
```

---

## Unicorn (유니콘)

**Stage 1 — Newborn** `unicorn_stage1_newborn.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This tiny white clay unicorn with a pink mane and a small white horn is sleeping lying down on a light mint background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Takes a slow gentle breath, its body rising softly, and lets out a tiny cute yawn.
3-5s: Gently nuzzles back down, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light mint background unchanged. Very gentle, minimal movement.
```

**Stage 2 — Baby** `unicorn_stage2_baby.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This cute white clay unicorn with a pink-purple mane, a purple horn, and small white wings is sitting on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tilts its head curiously and nuzzles its little horn shyly.
3-5s: Gently settles back, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. Cute, playful, gentle movement.
```

**Stage 3 — Growing** `unicorn_stage3_growing.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This young white clay unicorn with a pink mane, a purple horn, and small white wings wearing a blue bandana is sitting confidently on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tosses its mane as its small horn glimmers softly with a proud smile.
3-5s: Gently settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana must stay visible throughout.
```

**Stage 4 — Adult** `unicorn_stage4_adult.png`
```
Make a 6-second video from this image. The character's design, colors, proportions, facial features, and accessories must remain exactly identical to the input image throughout the entire video. Do not alter or reinterpret the character in any way.
This majestic white clay unicorn with a pink-purple mane, a golden horn, and large white wings wearing a blue bandana with a yellow star is sitting proudly on a light blue background.
0-1s: Holds the exact pose of the input image, completely still. This frame must be a perfect copy of the input image.
1-3s: Tosses its flowing mane majestically as its golden horn glows with a soft light.
3-5s: Gracefully settles, smoothly returning to the exact original pose.
5-6s: Freezes completely still — the final frame must be identical to the input image.
Maintain the soft clay/toy 3D style. Keep the light blue background unchanged. The blue bandana with yellow star and wings must stay visible throughout.
```

---

## 생성 순서 추천

효율을 위해 단계별로 묶어서 생성:
1. **Stage 1** (16마리) — 동작이 거의 동일 (숨쉬기+하품)하므로 가장 빠름
2. **Stage 2** (16마리) — 동물별 시그니처 무브 다름
3. **Stage 3** (16마리) — 동물별 시그니처 무브 다름
4. **Stage 4** (16마리) — 동물별 시그니처 무브 다름

| 방식 | 일일 한도 | 소요 기간 |
|------|---------|---------|
| Grok 무료 | ~10개 | ~7일 |
| Grok Premium | 50개 | ~2일 |
| Grok Premium+ | 100개 | ~1일 |
