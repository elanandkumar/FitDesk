import { FadeInDown, ReduceMotion } from 'react-native-reanimated';

const LIST_ITEM_DURATION_MS = 220;
const LIST_ITEM_STAGGER_MS = 30;
const MAX_STAGGERED_INDEX = 8;

export function listItemEntering(index: number) {
  return FadeInDown
    .delay(Math.min(index, MAX_STAGGERED_INDEX) * LIST_ITEM_STAGGER_MS)
    .duration(LIST_ITEM_DURATION_MS)
    .withInitialValues({
      opacity: 0.92,
      transform: [{ translateY: 6 }],
    })
    .reduceMotion(ReduceMotion.System);
}
